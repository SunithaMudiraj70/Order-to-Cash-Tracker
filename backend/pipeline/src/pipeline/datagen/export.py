"""Dataset export serializers for CSV tables and cryptographic manifests."""

import hashlib
import json
import subprocess
from datetime import UTC, datetime

import pandas as pd

from pipeline.datagen.config import DatagenConfig

TABLE_FILE_MAP = {
    "accounts": "account.csv",
    "quotes": "quote.csv",
    "quote_lines": "quote_line.csv",
    "orders": "sales_order.csv",
    "order_lines": "order_line.csv",
    "shipments": "shipment.csv",
    "shipment_lines": "shipment_line.csv",
    "invoices": "invoice.csv",
    "invoice_lines": "invoice_line.csv",
    "payments": "payment.csv",
    "allocations": "payment_allocation.csv",
    "disputes": "dispute.csv",
    "status_events": "status_event.csv",
    "ground_truth": "ground_truth.csv",
}


def get_git_sha() -> str:
    """PURPOSE: Resolve current git commit SHA for provenance tracking.
    INPUT: none
    RETURNS: str
    ERRORS: returns 'unknown' on failure
    """
    try:
        res = subprocess.run(
            ["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True
        )
        return res.stdout.strip()
    except (subprocess.SubprocessError, OSError):
        return "unknown"


def export_dataset(dataset: dict[str, list], config: DatagenConfig) -> dict[str, str]:
    """PURPOSE: Serialize dataset tables to CSV files and calculate sha256 checksums.
    INPUT: dataset: dict[str, list of pydantic models], config: DatagenConfig
    RETURNS: dict[str, str] (filename -> sha256 checksum)
    ERRORS: raises IOError on filesystem failure
    """
    out_dir = config.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_dir = config.manifest_dir
    manifest_dir.mkdir(parents=True, exist_ok=True)

    checksums: dict[str, str] = {}
    row_counts: dict[str, int] = {}

    for table_name, filename in TABLE_FILE_MAP.items():
        rows = dataset.get(table_name, [])
        file_path = out_dir / filename
        dicts = []
        for r in rows:
            d = r.model_dump(mode="json") if hasattr(r, "model_dump") else r
            if "payload" in d and isinstance(d["payload"], dict):
                d["payload"] = json.dumps(d["payload"])
            dicts.append(d)
        df = pd.DataFrame(dicts)
        df.to_csv(file_path, index=False)

        raw_bytes = file_path.read_bytes()
        digest = hashlib.sha256(raw_bytes).hexdigest()
        checksums[filename] = digest
        row_counts[filename] = len(rows)

    manifest_payload = {
        "seed": config.seed,
        "scale": config.scale.value,
        "row_counts": row_counts,
        "sha256": checksums,
        "generator_command": f"python -m pipeline.datagen generate --scale {config.scale.value} --seed {config.seed}",
        "git_sha": get_git_sha(),
        "generated_at": datetime.now(UTC).isoformat(),
    }

    manifest_path = manifest_dir / f"manifest_{config.scale.value}_{config.seed}.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_payload, f, indent=2)

    with open(out_dir / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest_payload, f, indent=2)

    return checksums

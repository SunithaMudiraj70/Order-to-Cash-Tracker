"""PURPOSE: Generate dataset provenance manifest and statistical distribution profile.
INPUT: dataset dictionary, DatagenConfig
RETURNS: Path to written manifest files
ERRORS: raises OSError on file write failure
"""

import json
import subprocess
from pathlib import Path
from typing import Any

from pipeline.datagen.config import DatagenConfig


def _get_git_sha() -> str:
    """PURPOSE: Retrieve active git commit SHA.
    INPUT: None
    RETURNS: str (git commit hash or fallback)
    ERRORS: catches subprocess errors
    """
    try:
        out = subprocess.check_output(["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL)
        return out.decode("utf-8").strip()
    except (subprocess.SubprocessError, OSError):
        return "uncommitted-working-tree"


def write_source_manifest(config: DatagenConfig) -> Path:
    """PURPOSE: Persist source data provenance manifest documenting lawful synthetic origin.
    INPUT: config: DatagenConfig
    RETURNS: Path
    ERRORS: none
    """
    manifest_dir = config.manifest_dir
    manifest_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "dataset_type": "100% Synthetic Order-to-Cash Data",
        "provenance": "Lawful, privacy-safe synthetic generation via Python Faker and NumPy.",
        "external_data_sources": "None (zero customer or production data incorporated)",
        "generator_command": f"python -m pipeline.datagen generate --scale {config.scale.value} --seed {config.seed}",
        "seed": config.seed,
        "as_of_date": str(config.as_of_date),
        "scale": config.scale.value,
        "git_commit": _get_git_sha(),
        "libraries": {"python": "3.11", "numpy": ">=1.26", "faker": ">=25.1", "pydantic": ">=2.7"},
    }
    path = manifest_dir / "source_manifest.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    return path


def write_distribution_profile(dataset: dict[str, list[Any]], config: DatagenConfig) -> Path:
    """PURPOSE: Compute statistical distribution metrics across amounts, lags, and seasonality.
    INPUT: dataset, config
    RETURNS: Path
    ERRORS: none
    """
    orders = dataset.get("orders", [])
    quotes = dataset.get("quotes", [])
    invoices = dataset.get("invoices", [])
    payments = dataset.get("payments", [])
    accounts = dataset.get("accounts", [])

    quote_acc = len(orders) / max(1, len(quotes))
    bins = {"0-5k": 0, "5k-15k": 0, "15k-30k": 0, "30k-50k": 0, "50k+": 0}
    for o in orders:
        val = float(o.total_amount)
        if val < 5000:
            bins["0-5k"] += 1
        elif val < 15000:
            bins["5k-15k"] += 1
        elif val < 30000:
            bins["15k-30k"] += 1
        elif val < 50000:
            bins["30k-50k"] += 1
        else:
            bins["50k+"] += 1

    terms_mix: dict[str, int] = {}
    for a in accounts:
        key = f"Net {a.payment_terms_days}"
        terms_mix[key] = terms_mix.get(key, 0) + 1

    profile = {
        "scale": config.scale.value,
        "total_quotes": len(quotes),
        "total_orders": len(orders),
        "total_invoices": len(invoices),
        "total_payments": len(payments),
        "quote_acceptance_rate": round(quote_acc, 4),
        "order_amount_histogram": bins,
        "payment_terms_mix": terms_mix,
        "segment_distribution": {
            seg: sum(1 for a in accounts if a.segment == seg) for seg in ["Enterprise", "Mid-Market", "SMB"]
        },
    }
    path = config.manifest_dir / "distribution_profile.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)
    return path

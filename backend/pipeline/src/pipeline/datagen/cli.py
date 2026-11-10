"""CLI interface for data generation, validation, and deterministic reproduction."""

import json
from pathlib import Path
from typing import Any

import numpy as np
import typer
from faker import Faker

from pipeline.datagen.anomalies import inject_all_anomalies
from pipeline.datagen.config import DatagenConfig, ScaleProfile
from pipeline.datagen.events import generate_status_events
from pipeline.datagen.export import export_dataset
from pipeline.datagen.master import generate_accounts, generate_quotes, generate_sales_orders
from pipeline.datagen.transactions import generate_fulfillments, generate_invoices_and_settlement
from pipeline.datagen.validate import validate_dataset

app = typer.Typer(help="Order-to-Cash Synthetic Data Generator CLI")


def build_dataset(config: DatagenConfig) -> dict[str, list[Any]]:
    """PURPOSE: Generate in-memory dataset graph from config.
    INPUT: config: DatagenConfig
    RETURNS: dict[str, list of pydantic row models]
    ERRORS: none
    """
    rng = np.random.default_rng(config.seed)
    faker = Faker()
    faker.seed_instance(config.seed)

    accounts = generate_accounts(rng, faker, config.params.accounts_count)
    quotes, q_lines = generate_quotes(rng, accounts, config.params)
    orders, o_lines = generate_sales_orders(rng, quotes, q_lines)
    shipments, s_lines = generate_fulfillments(rng, orders, o_lines)
    invoices, i_lines, payments, allocs, disputes = generate_invoices_and_settlement(
        rng, faker, orders, o_lines, accounts
    )
    events = generate_status_events(quotes, orders, shipments, invoices, payments, disputes)
    gt_rows = inject_all_anomalies(
        rng,
        orders,
        o_lines,
        shipments,
        s_lines,
        invoices,
        i_lines,
        payments,
        allocs,
        disputes,
        events,
        config.anomaly_rate,
    )
    return {
        "accounts": accounts,
        "quotes": quotes,
        "quote_lines": q_lines,
        "orders": orders,
        "order_lines": o_lines,
        "shipments": shipments,
        "shipment_lines": s_lines,
        "invoices": invoices,
        "invoice_lines": i_lines,
        "payments": payments,
        "allocations": allocs,
        "disputes": disputes,
        "status_events": events,
        "ground_truth": gt_rows,
    }


def _save_validation_report(manifest_dir: Path, report: Any) -> Path:
    """PURPOSE: Persist validation summary report to disk.
    INPUT: manifest_dir, report
    RETURNS: Path
    ERRORS: none
    """
    manifest_dir.mkdir(parents=True, exist_ok=True)
    summary_path = manifest_dir / "validation_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(report.model_dump(mode="json"), f, indent=2)
    return summary_path


@app.command()
def generate(
    scale: ScaleProfile = typer.Option(ScaleProfile.SMALL, "--scale", "-s"),
    seed: int = typer.Option(20261022, "--seed"),
    anomaly_rate: float = typer.Option(0.08, "--anomaly-rate"),
) -> None:
    """PURPOSE: Generate dataset, run validation, and export CSVs and manifests.
    INPUT: scale: ScaleProfile, seed: int, anomaly_rate: float
    RETURNS: None
    ERRORS: raises typer.Exit on error
    """
    config = DatagenConfig(scale=scale, seed=seed, anomaly_rate=anomaly_rate)
    typer.echo(f"--> Generating O2C dataset: scale={scale.value}, seed={seed}...")
    dataset = build_dataset(config)
    report = validate_dataset(dataset)
    summary_path = _save_validation_report(config.manifest_dir, report)
    export_dataset(dataset, config)
    typer.echo(f"--> Generation complete: {report.total_records} records exported.")
    typer.echo(f"--> Validation report written to {summary_path}")
    typer.echo(f"--> Is Valid: {report.is_valid}")


@app.command()
def validate(scale: ScaleProfile = typer.Option(ScaleProfile.SMALL, "--scale", "-s")) -> None:
    """PURPOSE: Validate existing generated dataset summary.
    INPUT: scale: ScaleProfile
    RETURNS: None
    ERRORS: raises FileNotFoundError
    """
    summary_path = Path("data/manifests/validation_summary.json")
    if not summary_path.exists():
        typer.echo("Error: validation_summary.json not found. Run generate first.")
        raise typer.Exit(code=1)
    typer.echo(summary_path.read_text(encoding="utf-8"))


@app.command()
def reproduce(
    scale: ScaleProfile = typer.Option(ScaleProfile.SMALL, "--scale", "-s"),
    seed: int = typer.Option(20261022, "--seed"),
) -> None:
    """PURPOSE: Execute generation twice with identical seed and verify bitwise parity.
    INPUT: scale: ScaleProfile, seed: int
    RETURNS: None
    ERRORS: raises AssertionError on mismatch
    """
    config = DatagenConfig(scale=scale, seed=seed)
    typer.echo(f"--> Running reproducibility test for seed={seed}...")
    c1 = export_dataset(build_dataset(config), config)
    c2 = export_dataset(build_dataset(config), config)
    assert c1 == c2, "Reproducibility failure: Checksums between runs did not match!"
    repro_path = config.manifest_dir / "reproducibility.json"
    payload = {
        "status": "passed",
        "scale": scale.value,
        "seed": seed,
        "matching_files_count": len(c1),
        "checksums": c1,
    }
    with open(repro_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    typer.echo(f"--> Reproducibility confirmed! All {len(c1)} files match bit-for-bit.")


if __name__ == "__main__":
    app()

"""PURPOSE: CLI interface for data generation, validation, and deterministic reproduction.
INPUT: CLI arguments (--scale, --seed, --baseline)
RETURNS: None (writes files and prints reports)
ERRORS: raises typer.Exit on error
"""

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
from pipeline.datagen.export_sql import export_sql_seed
from pipeline.datagen.manifests import write_distribution_profile, write_source_manifest
from pipeline.datagen.master import generate_accounts, generate_quotes, generate_sales_orders
from pipeline.datagen.settlements import generate_invoices_and_settlement
from pipeline.datagen.transactions import generate_fulfillments
from pipeline.datagen.validate import validate_dataset

app = typer.Typer(help="Order-to-Cash Synthetic Data Generator CLI")


def build_dataset(config: DatagenConfig) -> dict[str, list[Any]]:
    """PURPOSE: Generate full in-memory relational dataset graph from config.
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
        rng, orders, o_lines, accounts, shipments, config.params, config.as_of_date
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
        config.anomaly_rates,
        config.as_of_date,
        config.inject_anomalies,
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


def _save_validation(manifest_dir: Path, report: Any, fname: str = "validation_summary.json") -> Path:
    """PURPOSE: Persist validation summary report to disk."""
    manifest_dir.mkdir(parents=True, exist_ok=True)
    summary_path = manifest_dir / fname
    summary_path.write_text(json.dumps(report.model_dump(mode="json"), indent=2), encoding="utf-8")
    return summary_path


@app.command()
def generate(
    scale: ScaleProfile = typer.Option(ScaleProfile.SMALL, "--scale", "-s"),
    seed: int = typer.Option(20261022, "--seed"),
    baseline: bool = typer.Option(False, "--baseline", help="Run clean baseline without injected anomalies"),
) -> None:
    """PURPOSE: Generate dataset, execute validation checks, and export CSVs and manifests.
    INPUT: scale: ScaleProfile, seed: int, baseline: bool
    RETURNS: None
    ERRORS: raises typer.Exit on error
    """
    config = DatagenConfig(scale=scale, seed=seed, inject_anomalies=not baseline)
    typer.echo(f"--> Generating O2C dataset: scale={scale.value}, seed={seed}, baseline={baseline}...")
    dataset = build_dataset(config)
    report = validate_dataset(dataset)
    fname = "baseline_validation.json" if baseline else "validation_summary.json"
    summary_path = _save_validation(config.manifest_dir, report, fname)
    if not baseline:
        export_dataset(dataset, config)
        write_source_manifest(config)
        write_distribution_profile(dataset, config)
    typer.echo(f"--> Generation complete: {report.total_records} records. Valid: {report.is_valid}")
    typer.echo(f"--> Report written to {summary_path}")


@app.command()
def validate() -> None:
    """PURPOSE: Print existing generated validation summary.
    INPUT: None
    RETURNS: None
    ERRORS: raises typer.Exit if missing
    """
    path = Path("data/manifests/validation_summary.json")
    if not path.exists():
        typer.echo("Error: validation_summary.json not found. Run generate first.")
        raise typer.Exit(code=1)
    typer.echo(path.read_text(encoding="utf-8"))


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
    typer.echo(f"--> Running reproducibility test for scale={scale.value}, seed={seed}...")
    c1 = export_dataset(build_dataset(config), config)
    c2 = export_dataset(build_dataset(config), config)
    assert c1 == c2, "Reproducibility failure: Checksums between runs did not match!"
    repro_path = config.manifest_dir / "reproducibility.json"
    repro_path.write_text(
        json.dumps({"status": "passed", "scale": scale.value, "seed": seed, "checksums": c1}, indent=2),
        encoding="utf-8",
    )
    typer.echo(f"--> Reproducibility confirmed! All {len(c1)} files match bit-for-bit.")


@app.command("seed-sql")
def seed_sql(
    scale: ScaleProfile = typer.Option(ScaleProfile.FULL, "--scale", "-s"),
    seed: int = typer.Option(20261022, "--seed"),
) -> None:
    """PURPOSE: Generate on-demand database seed SQL script.
    INPUT: scale: ScaleProfile, seed: int
    RETURNS: None
    ERRORS: none
    """
    config = DatagenConfig(scale=scale, seed=seed)
    typer.echo(f"--> Generating SQL seed for scale={scale.value}...")
    dataset = build_dataset(config)
    path = Path(f"backend/db/seed/seed_{scale.value}.sql")
    export_sql_seed(dataset, path)
    typer.echo(f"--> SQL seed exported to {path}")


if __name__ == "__main__":
    app()

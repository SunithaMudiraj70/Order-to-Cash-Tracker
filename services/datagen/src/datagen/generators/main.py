"""CLI entry point for synthetic dataset generation.

TODO (Step 2): Implement full graph generation pipeline and ground truth extraction.
"""

from pathlib import Path
import typer
from datagen.config.settings import ScaleProfile

app = typer.Typer(help="Order-to-Cash Synthetic Data Generator CLI")


@app.command()
def generate(
    scale: ScaleProfile = typer.Option(
        ScaleProfile.SMALL, "--scale", "-s", help="Scale of dataset"
    ),
    seed: int = typer.Option(20261022, "--seed", help="Random seed"),
    out: Path = typer.Option(
        Path("data/processed"), "--out", "-o", help="Target output directory"
    ),
) -> None:
    """Generate synthetic O2C transaction dataset with injected anomalies."""
    typer.echo(f"Initializing data generation: scale={scale.value}, seed={seed}, out={out}")
    # TODO (Step 2): Run orchestrator pipeline
    typer.echo("Data generator stub ready. Logic to be implemented in Step 2.")


if __name__ == "__main__":
    app()


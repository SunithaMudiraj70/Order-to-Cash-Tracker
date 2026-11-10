"""CLI runner for detector evaluation.

TODO (Step 3): Connect to live Supabase / PostgreSQL instance and run benchmark.
"""

import typer

app = typer.Typer(help="Order-to-Cash Detector Evaluation CLI")


@app.command()
def evaluate() -> None:
    """Run detector rules against operational events and score against ground truth."""
    typer.echo("Executing detector rules evaluation against gt.ground_truth...")
    # TODO (Step 3): Query o2c.status_event and benchmark against gt.ground_truth
    typer.echo("Detector evaluation stub ready. Logic to be implemented in Step 3.")


if __name__ == "__main__":
    app()


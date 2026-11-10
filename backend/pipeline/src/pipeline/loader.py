"""Database bulk loader copying CSV datasets into Supabase PostgreSQL."""

import json
from pathlib import Path

import psycopg2.extras
import typer

from pipeline.datagen.config import ScaleProfile
from pipeline.db.connection import get_connection

app = typer.Typer(help="Order-to-Cash Database Bulk Loader CLI")


@app.callback()
def callback():
    """Database bulk loader commands."""


LOAD_ORDER = [
    ("o2c.account", "account.csv"),
    ("o2c.quote", "quote.csv"),
    ("o2c.quote_line", "quote_line.csv"),
    ("o2c.sales_order", "sales_order.csv"),
    ("o2c.order_line", "order_line.csv"),
    ("o2c.shipment", "shipment.csv"),
    ("o2c.shipment_line", "shipment_line.csv"),
    ("o2c.invoice", "invoice.csv"),
    ("o2c.invoice_line", "invoice_line.csv"),
    ("o2c.payment", "payment.csv"),
    ("o2c.payment_allocation", "payment_allocation.csv"),
    ("o2c.dispute", "dispute.csv"),
    ("o2c.status_event", "status_event.csv"),
    ("gt.ground_truth", "ground_truth.csv"),
]


def truncate_tables(conn) -> None:
    """PURPOSE: Truncate operational and ground-truth tables in reverse order.
    INPUT: conn: psycopg2 connection
    RETURNS: None
    ERRORS: raises psycopg2.DatabaseError
    """
    tables = [t[0] for t in reversed(LOAD_ORDER)]
    with conn.cursor() as cur:
        cur.execute(f"TRUNCATE TABLE {', '.join(tables)} CASCADE;")
    conn.commit()


def copy_csv_to_table(conn, table: str, file_path: Path) -> int:
    """PURPOSE: Execute fast COPY FROM STDIN for a CSV file.
    INPUT: conn, table: str, file_path: Path
    RETURNS: int (number of rows loaded)
    ERRORS: raises psycopg2.DatabaseError, FileNotFoundError
    """
    with open(file_path, "r", encoding="utf-8") as f:
        header_line = f.readline().strip()
        f.seek(0)
        columns = header_line.split(",")

        copy_sql = f"COPY {table} ({', '.join(columns)}) FROM STDIN WITH CSV HEADER;"
        with conn.cursor() as cur:
            cur.copy_expert(copy_sql, f)
            cur.execute(f"SELECT COUNT(*) FROM {table};")
            count = cur.fetchone()[0]
    return count


@app.command("load")
def load_command(
    scale: ScaleProfile = typer.Option(ScaleProfile.SMALL, "--scale", "-s", help="Scale to load"),
) -> None:
    """PURPOSE: Bulk load processed CSV datasets into database via COPY.
    INPUT: scale: ScaleProfile
    RETURNS: None
    ERRORS: raises SystemExit on mismatch or failure
    """
    data_dir = Path("data/processed") / scale.value
    manifest_path = data_dir / "manifest.json"
    if not manifest_path.exists():
        typer.echo(f"Manifest not found at {manifest_path}. Run datagen generate first.")
        raise typer.Exit(code=1)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    expected_counts = manifest.get("row_counts", {})

    conn = get_connection()
    try:
        typer.echo(f"--> Beginning bulk load for scale={scale.value}...")
        profiles = []
        with conn.cursor() as cur:
            cur.execute("SELECT id, email, role, full_name, account_id FROM o2c.profiles;")
            profiles = cur.fetchall()
            cur.execute("SET session_replication_role = replica;")

        typer.echo("  [TRUNCATE] Clearing existing rows...")
        truncate_tables(conn)

        for table, filename in LOAD_ORDER:
            file_path = data_dir / filename
            if not file_path.exists():
                raise FileNotFoundError(f"Missing file: {file_path}")
            count = copy_csv_to_table(conn, table, file_path)
            expected = expected_counts.get(filename, count)
            assert count == expected, f"Count mismatch for {table}: loaded {count} vs expected {expected}"
            typer.echo(f"  [LOADED] {table:<24} {count:>6} rows")

        with conn.cursor() as cur:
            if profiles:
                psycopg2.extras.execute_batch(
                    cur,
                    "INSERT INTO o2c.profiles (id, email, role, full_name, account_id) VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;",
                    profiles,
                )
            cur.execute("SET session_replication_role = DEFAULT;")
        conn.commit()
        typer.echo("--> Bulk load completed successfully and verified against manifest.")
    finally:
        conn.close()


if __name__ == "__main__":
    app()

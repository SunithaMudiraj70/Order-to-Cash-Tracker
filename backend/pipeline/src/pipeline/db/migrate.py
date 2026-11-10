"""Database migration runner applying versioned SQL scripts."""

import hashlib
from pathlib import Path

import typer

from pipeline.db.connection import get_connection

app = typer.Typer(help="Order-to-Cash Database Migration CLI")
MIGRATIONS_DIR = Path("backend/db/migrations")


def calculate_checksum(file_path: Path) -> str:
    """PURPOSE: Calculate sha256 checksum of migration SQL file.
    INPUT: file_path: Path
    RETURNS: str (hex-encoded sha256)
    ERRORS: raises FileNotFoundError
    """
    content = file_path.read_bytes()
    return hashlib.sha256(content).hexdigest()


def ensure_migration_table(conn) -> None:
    """PURPOSE: Create o2c_migrations table if not present.
    INPUT: conn: psycopg2 connection
    RETURNS: None
    ERRORS: raises psycopg2.DatabaseError on SQL failure
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS public.o2c_migrations (
                version TEXT PRIMARY KEY,
                checksum TEXT NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
            );
            """
        )
    conn.commit()


def get_applied_migrations(conn) -> dict[str, str]:
    """PURPOSE: Retrieve dictionary of applied migration versions and checksums.
    INPUT: conn: psycopg2 connection
    RETURNS: dict[str, str] (version -> checksum)
    ERRORS: raises psycopg2.DatabaseError
    """
    with conn.cursor() as cur:
        cur.execute("SELECT version, checksum FROM public.o2c_migrations;")
        return {row[0]: row[1] for row in cur.fetchall()}


def apply_migration_file(conn, file_path: Path, version: str, checksum: str) -> None:
    """PURPOSE: Execute a single SQL migration inside a transaction and log it.
    INPUT: conn, file_path: Path, version: str, checksum: str
    RETURNS: None
    ERRORS: raises psycopg2.DatabaseError, triggers rollback
    """
    sql = file_path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql)
        cur.execute(
            """
            INSERT INTO public.o2c_migrations (version, checksum, applied_at)
            VALUES (%s, %s, timezone('utc', now()));
            """,
            (version, checksum),
        )
    conn.commit()


def reset_schemas(conn) -> None:
    """PURPOSE: Drop o2c, gt, analytics schemas and o2c_migrations tracking table.
    INPUT: conn: psycopg2 connection
    RETURNS: None
    ERRORS: raises psycopg2.DatabaseError
    """
    with conn.cursor() as cur:
        cur.execute("DROP SCHEMA IF EXISTS o2c CASCADE;")
        cur.execute("DROP SCHEMA IF EXISTS gt CASCADE;")
        cur.execute("DROP SCHEMA IF EXISTS analytics CASCADE;")
        cur.execute("DROP TABLE IF EXISTS public.o2c_migrations CASCADE;")
    conn.commit()


@app.command()
def run(
    reset: bool = typer.Option(False, "--reset", "-r", help="Drop schemas and replay migrations"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation prompt for reset"),
) -> None:
    """PURPOSE: CLI entry point to apply or reset database migrations.
    INPUT: reset: bool, yes: bool
    RETURNS: None
    ERRORS: raises SystemExit on error or cancellation
    """
    if reset and not yes:
        confirm = typer.confirm("Are you sure you want to drop schemas o2c, gt, and analytics?")
        if not confirm:
            typer.echo("Migration reset aborted.")
            raise typer.Exit(code=0)

    conn = get_connection()
    try:
        if reset:
            typer.echo("--> Dropping schemas o2c, gt, analytics and migrations table...")
            reset_schemas(conn)

        ensure_migration_table(conn)
        applied = get_applied_migrations(conn)

        files = sorted(MIGRATIONS_DIR.glob("*.sql"))
        if not files:
            typer.echo(f"No migration files found in {MIGRATIONS_DIR}")
            return

        for f in files:
            version = f.name
            checksum = calculate_checksum(f)
            if version in applied:
                if applied[version] != checksum:
                    raise ValueError(
                        f"Checksum mismatch for {version}! Applied: {applied[version]} vs Current: {checksum}"
                    )
                typer.echo(f"  [OK] {version} (already applied)")
                continue

            typer.echo(f"  [APPLY] Applying migration: {version}...")
            apply_migration_file(conn, f, version, checksum)
            typer.echo(f"  [DONE] {version} applied successfully.")

        typer.echo("--> All migrations are up to date.")
    finally:
        conn.close()


if __name__ == "__main__":
    app()

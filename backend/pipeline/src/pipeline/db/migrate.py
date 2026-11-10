"""Database migration runner applying versioned SQL scripts to secure schemas."""

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
    return hashlib.sha256(file_path.read_bytes()).hexdigest()


def ensure_migration_table(conn) -> None:
    """PURPOSE: Create o2c.migrations table with RLS enabled and revoke anon privileges.
    INPUT: conn: psycopg2 connection
    RETURNS: None
    ERRORS: raises psycopg2.DatabaseError on SQL failure
    """
    with conn.cursor() as cur:
        cur.execute("CREATE SCHEMA IF NOT EXISTS o2c;")
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS o2c.migrations (
                version TEXT PRIMARY KEY,
                checksum TEXT NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
            );
            ALTER TABLE o2c.migrations ENABLE ROW LEVEL SECURITY;
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='o2c_migrations') THEN
                    INSERT INTO o2c.migrations (version, checksum, applied_at)
                    SELECT version, checksum, applied_at FROM public.o2c_migrations
                    ON CONFLICT (version) DO NOTHING;
                    DROP TABLE public.o2c_migrations;
                END IF;
            END $$;
            REVOKE ALL ON TABLE o2c.migrations FROM anon, authenticated, public;
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
        cur.execute("SELECT version, checksum FROM o2c.migrations;")
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
            INSERT INTO o2c.migrations (version, checksum, applied_at)
            VALUES (%s, %s, timezone('utc', now()))
            ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum;
            """,
            (version, checksum),
        )
    conn.commit()


def _process_file(conn, f: Path, applied: dict[str, str]) -> tuple[bool, str]:
    """PURPOSE: Validate checksum and apply single migration file if pending.
    INPUT: conn, f: Path, applied: dict
    RETURNS: tuple[bool (is_new), str (status_message)]
    ERRORS: raises ValueError on checksum mismatch, DatabaseError on SQL failure
    """
    version = f.name
    checksum = calculate_checksum(f)
    if version in applied:
        if applied[version] != checksum:
            raise ValueError(f"Checksum mismatch for {version}! Applied: {applied[version]} vs File: {checksum}")
        return False, f"  [OK] {version} (already applied)"
    apply_migration_file(conn, f, version, checksum)
    return True, f"  [DONE] {version} applied successfully."


@app.command()
def run(
    reset: bool = typer.Option(False, "--reset", "-r", help="Drop schemas and replay migrations"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation prompt for reset"),
) -> None:
    """PURPOSE: CLI entry point to apply or reset database migrations.
    INPUT: reset: bool, yes: bool
    RETURNS: None
    ERRORS: raises typer.Exit on error or cancellation
    """
    if reset:
        if not yes and not typer.confirm("Drop schemas o2c, gt, and analytics?"):
            raise typer.Exit(code=0)
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("DROP SCHEMA IF EXISTS o2c, gt, analytics CASCADE; DROP TABLE IF EXISTS public.o2c_migrations CASCADE;")
        conn.commit()
        conn.close()

    conn = get_connection()
    applied_count, skipped_count, failed_count = 0, 0, 0
    try:
        ensure_migration_table(conn)
        applied = get_applied_migrations(conn)
        for f in sorted(MIGRATIONS_DIR.glob("*.sql")):
            try:
                is_new, msg = _process_file(conn, f, applied)
                typer.echo(msg)
                if is_new:
                    applied_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                failed_count += 1
                typer.echo(f"  [FAIL] Migration {f.name} failed: {e}")
                raise typer.Exit(code=1) from e
        typer.echo(f"\nMigration Summary: Applied: {applied_count} | Skipped: {skipped_count} | Failed: {failed_count}")
        typer.echo("Open Supabase Table Editor -> choose schema o2c / gt / analytics")
    finally:
        conn.close()


if __name__ == "__main__":
    app()

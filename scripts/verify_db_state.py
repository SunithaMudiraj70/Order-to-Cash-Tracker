"""PURPOSE: Read-only verification of database tables, rows, migrations, and privileges.
INPUT: None (reads DATABASE_URL from environment)
RETURNS: None (prints results to stdout)
ERRORS: raises psycopg2.DatabaseError on connection or query failure
"""

import sys
from pathlib import Path

# Add backend/pipeline/src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "pipeline" / "src"))
from pipeline.db.connection import get_connection  # noqa: E402


def check_migrations(conn) -> None:
    """PURPOSE: Print applied migrations from o2c_migrations table.
    INPUT: conn: psycopg2 connection
    RETURNS: None
    ERRORS: none
    """
    with conn.cursor() as cur:
        # Check both public.o2c_migrations and o2c.migrations if exists
        cur.execute(
            """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE (table_schema = 'public' AND table_name = 'o2c_migrations')
               OR (table_schema = 'o2c' AND table_name = 'migrations');
            """
        )
        found = cur.fetchall()
        for schema, name in found:
            cur.execute(f"SELECT version, checksum, applied_at FROM {schema}.{name} ORDER BY version;")
            rows = cur.fetchall()
            print(f"=== APPLIED MIGRATIONS ({schema}.{name}) ===")
            for v, cs, at in rows:
                print(f"  {v} | {at}")
            print(f"Total applied versions in {schema}.{name}: {len(rows)}\n")


def check_table_counts(conn) -> None:
    """PURPOSE: Query and print row counts for all tables and views in target schemas.
    INPUT: conn: psycopg2 connection
    RETURNS: None
    ERRORS: none
    """
    print("=== TABLE & VIEW ROW COUNTS ===")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_schema, table_name, table_type
            FROM information_schema.tables
            WHERE table_schema IN ('o2c', 'gt', 'analytics')
            ORDER BY table_schema, table_name;
            """
        )
        tables = cur.fetchall()
        for schema, name, ttype in tables:
            try:
                cur.execute(f'SELECT count(*) FROM "{schema}"."{name}";')
                cnt = cur.fetchone()[0]
                print(f"  {schema}.{name:<25} ({ttype}) -> {cnt:,} rows")
            except Exception as e:
                print(f"  {schema}.{name:<25} ({ttype}) -> ERROR: {e}")
                conn.rollback()


def check_security_privileges(conn) -> None:
    """PURPOSE: Check RLS state and table privileges for anon and authenticated roles.
    INPUT: conn: psycopg2 connection
    RETURNS: None
    ERRORS: none
    """
    print("\n=== SECURITY AUDIT (RLS & PRIVILEGES) ===")
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT schemaname, tablename, rowsecurity
            FROM pg_tables
            WHERE (schemaname IN ('o2c', 'gt', 'analytics'))
               OR (schemaname = 'public' AND tablename = 'o2c_migrations')
            ORDER BY schemaname, tablename;
            """
        )
        pg_tabs = cur.fetchall()
        for schema, name, rls in pg_tabs:
            cur.execute(f"SELECT has_table_privilege('anon', '\"{schema}\".\"{name}\"', 'SELECT');")
            anon_sel = cur.fetchone()[0]
            cur.execute(f"SELECT has_table_privilege('authenticated', '\"{schema}\".\"{name}\"', 'SELECT');")
            auth_sel = cur.fetchone()[0]
            print(f"  {schema}.{name:<26} | RLS: {str(rls):<5} | anon SELECT: {str(anon_sel):<5} | auth SELECT: {str(auth_sel):<5}")


def main() -> None:
    """PURPOSE: Execute all read-only database verification queries.
    INPUT: None
    RETURNS: None
    ERRORS: raises Exception on failure
    """
    conn = get_connection()
    try:
        check_migrations(conn)
        check_table_counts(conn)
        check_security_privileges(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()


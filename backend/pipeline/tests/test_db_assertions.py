"""Database schema assertion tests verifying tables, FKs, triggers, and ground truth isolation."""

import psycopg2
import pytest

from pipeline.db.connection import get_connection


@pytest.fixture(scope="module")
def db_conn():
    conn = get_connection()
    yield conn
    conn.close()


def test_schemas_exist(db_conn) -> None:
    """PURPOSE: Assert o2c, gt, and analytics schemas exist in Postgres.
    INPUT: db_conn: connection
    RETURNS: None
    ERRORS: AssertionError on missing schema
    """
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('o2c', 'gt', 'analytics');"
        )
        schemas = {r[0] for r in cur.fetchall()}
    assert {"o2c", "gt", "analytics"}.issubset(schemas)


def test_o2c_tables_exist(db_conn) -> None:
    """PURPOSE: Assert all 14 o2c operational tables exist.
    INPUT: db_conn: connection
    RETURNS: None
    ERRORS: AssertionError on missing table
    """
    expected = {
        "account",
        "quote",
        "quote_line",
        "sales_order",
        "order_line",
        "shipment",
        "shipment_line",
        "invoice",
        "invoice_line",
        "payment",
        "payment_allocation",
        "dispute",
        "status_event",
        "profiles",
    }
    with db_conn.cursor() as cur:
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'o2c';")
        actual = {r[0] for r in cur.fetchall()}
    assert expected.issubset(actual)


def test_gt_ground_truth_exists(db_conn) -> None:
    """PURPOSE: Assert gt.ground_truth exists.
    INPUT: db_conn: connection
    RETURNS: None
    ERRORS: AssertionError on missing table
    """
    with db_conn.cursor() as cur:
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'gt';")
        tables = {r[0] for r in cur.fetchall()}
    assert "ground_truth" in tables


def test_gt_has_no_foreign_keys_to_o2c(db_conn) -> None:
    """PURPOSE: Assert gt.ground_truth has zero foreign keys pointing into o2c schema.
    INPUT: db_conn: connection
    RETURNS: None
    ERRORS: AssertionError if any FK found
    """
    query = """
    SELECT
        tc.constraint_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'gt'
      AND tc.table_name = 'ground_truth';
    """
    with db_conn.cursor() as cur:
        cur.execute(query)
        fks = cur.fetchall()
    assert len(fks) == 0, f"Expected 0 foreign keys on gt.ground_truth, found: {fks}"


def test_status_event_blocks_update_and_delete(db_conn) -> None:
    """PURPOSE: Verify trigger blocks UPDATE and DELETE on o2c.status_event.
    INPUT: db_conn: connection
    RETURNS: None
    ERRORS: AssertionError if trigger fails to raise exception
    """
    test_event_id = "EVT-999999"
    with db_conn.cursor() as cur:
        # Insert test event
        cur.execute(
            """
            INSERT INTO o2c.status_event (event_id, entity_type, entity_id, to_status)
            VALUES (%s, 'QUOTE', 'QTE-2026-999999', 'DRAFT')
            ON CONFLICT (event_id) DO NOTHING;
            """,
            (test_event_id,),
        )
        db_conn.commit()

        # Attempt UPDATE -> must raise exception
        with pytest.raises(psycopg2.DatabaseError):
            cur.execute(
                "UPDATE o2c.status_event SET to_status = 'ACCEPTED' WHERE event_id = %s;",
                (test_event_id,),
            )
            db_conn.commit()
        db_conn.rollback()

        # Attempt DELETE -> must raise exception
        with pytest.raises(psycopg2.DatabaseError):
            cur.execute("DELETE FROM o2c.status_event WHERE event_id = %s;", (test_event_id,))
            db_conn.commit()
        db_conn.rollback()

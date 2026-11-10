"""PURPOSE: Assert analytics views maintain strict grain, valid dates, and zero fan-out.
INPUT: Postgres connection via db_conn fixture
RETURNS: None
ERRORS: AssertionError on fan-out, date ordering violations, or dynamic date usage
"""

import pytest
from pipeline.db.connection import get_connection


@pytest.fixture(scope="module")
def db_conn():
    conn = get_connection()
    yield conn
    conn.close()


def test_cycle_time_delays_row_count_matches_orders(db_conn) -> None:
    """PURPOSE: Verify v_cycle_time_delays has exactly one row per sales order.
    INPUT: db_conn
    RETURNS: None
    ERRORS: AssertionError
    """
    with db_conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM o2c.sales_order;")
        order_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM analytics.v_cycle_time_delays;")
        view_count = cur.fetchone()[0]
    assert view_count == order_count, f"View fanned out: {view_count} vs {order_count}"


def test_cycle_time_delays_no_negative_durations(db_conn) -> None:
    """PURPOSE: Verify 0 negative stage durations exist in cycle time analytics.
    INPUT: db_conn
    RETURNS: None
    ERRORS: AssertionError
    """
    sql = """
    SELECT COUNT(*) FROM analytics.v_cycle_time_delays
    WHERE ship_to_invoice_days < 0
       OR order_to_ship_days < 0
       OR quote_to_order_days < 0;
    """
    with db_conn.cursor() as cur:
        cur.execute(sql)
        neg_count = cur.fetchone()[0]
    assert neg_count == 0, f"Found {neg_count} rows with negative duration"


def test_views_contain_no_current_date(db_conn) -> None:
    """PURPOSE: Verify analytical views do not reference dynamic current_date or now().
    INPUT: db_conn
    RETURNS: None
    ERRORS: AssertionError
    """
    sql = """
    SELECT viewname, definition
    FROM pg_views
    WHERE schemaname = 'analytics';
    """
    with db_conn.cursor() as cur:
        cur.execute(sql)
        views = cur.fetchall()
    for vname, vdef in views:
        assert "current_date" not in vdef.lower(), f"{vname} calls current_date"
        assert "now()" not in vdef.lower(), f"{vname} calls now()"


def test_exception_triage_table_structure(db_conn) -> None:
    """PURPOSE: Verify analytics.exception_triage table exists with RLS enabled.
    INPUT: db_conn
    RETURNS: None
    ERRORS: AssertionError
    """
    with db_conn.cursor() as cur:
        cur.execute("SELECT rowsecurity FROM pg_tables WHERE schemaname = 'analytics' AND tablename = 'exception_triage';")
        res = cur.fetchone()
        assert res is not None, "analytics.exception_triage table does not exist"
        assert res[0] is True, "RLS is not enabled on analytics.exception_triage"


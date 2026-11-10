"""PURPOSE: Ground truth audit script querying real DB state, view grains, and date violations.
INPUT: None (connects via DATABASE_URL)
RETURNS: None (prints audit tables)
ERRORS: raises psycopg2.DatabaseError on SQL failure
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "pipeline" / "src"))
from pipeline.db.connection import get_connection


def audit_table_counts(cur) -> list[tuple[str, str, str, int]]:
    """PURPOSE: Retrieve exact row counts for all base tables and views in target schemas.
    INPUT: cur: psycopg2 cursor
    RETURNS: list[tuple[str, str, str, int]]
    ERRORS: raises psycopg2.DatabaseError
    """
    cur.execute("""
        SELECT table_schema, table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema IN ('o2c', 'gt', 'analytics')
        ORDER BY table_schema, table_type, table_name;
    """)
    rows = cur.fetchall()
    results = []
    for schema, name, t_type in rows:
        cur.execute(f'SELECT count(*) FROM "{schema}"."{name}"')
        cnt = cur.fetchone()[0]
        results.append((schema, name, t_type, cnt))
    return results


def audit_view_grains(cur) -> list[tuple[str, int, str, int, bool]]:
    """PURPOSE: Check row count vs expected grain for all analytics views.
    INPUT: cur: psycopg2 cursor
    RETURNS: list[tuple[str, int, str, int, bool]]
    ERRORS: raises psycopg2.DatabaseError
    """
    cur.execute("SELECT count(*) FROM o2c.sales_order")
    order_cnt = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM o2c.account")
    account_cnt = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM o2c.dispute WHERE status IN ('OPEN', 'UNDER_REVIEW')")
    dispute_cnt = cur.fetchone()[0]
    cur.execute("SELECT count(DISTINCT payment_id) FROM o2c.payment")
    pay_cnt = cur.fetchone()[0]

    grains = [
        ("v_ar_aging_summary", "1 per account (with balance)", account_cnt),
        ("v_cycle_time_delays", "1 per sales_order", order_cnt),
        ("v_open_disputes_vs_receivables", "1 per open dispute", dispute_cnt),
        ("v_revenue_leakage", "1 per sales_order", order_cnt),
        ("v_unallocated_payments", "<= 1 per unallocated payment", pay_cnt),
    ]
    results = []
    for vname, grain_desc, exp_count in grains:
        cur.execute(f"SELECT count(*) FROM analytics.{vname}")
        actual_cnt = cur.fetchone()[0]
        fan_out = actual_cnt > exp_count
        results.append((vname, actual_cnt, grain_desc, exp_count, fan_out))
    return results


def audit_date_order_violations(cur) -> list[tuple[str, int, int, int]]:
    """PURPOSE: Query date ordering anomalies and cross-check against gt.ground_truth.
    INPUT: cur: psycopg2 cursor
    RETURNS: list[tuple[str, int, int, int]]
    ERRORS: raises psycopg2.DatabaseError
    """
    checks = [
        ("invoice_date < min(ship_date)", """
            SELECT i.invoice_id AS entity_id, i.order_id
            FROM o2c.invoice i
            JOIN (SELECT order_id, min(ship_date) as min_ship FROM o2c.shipment GROUP BY order_id) s
              ON i.order_id = s.order_id
            WHERE i.invoice_date < s.min_ship
        """),
        ("payment_date < invoice_date", """
            SELECT pa.payment_id AS entity_id, i.order_id
            FROM o2c.payment_allocation pa
            JOIN o2c.payment p ON pa.payment_id = p.payment_id
            JOIN o2c.invoice i ON pa.invoice_id = i.invoice_id
            WHERE p.payment_date < i.invoice_date
        """),
        ("delivered_date < ship_date", """
            SELECT shipment_id AS entity_id, order_id
            FROM o2c.shipment
            WHERE delivered_date < ship_date
        """),
        ("due_date < invoice_date", """
            SELECT invoice_id AS entity_id, order_id
            FROM o2c.invoice
            WHERE due_date < invoice_date
        """),
        ("cycle_delays ship_to_inv < 0", """
            SELECT order_id AS entity_id, order_id
            FROM analytics.v_cycle_time_delays
            WHERE ship_to_invoice_days < 0
        """),
    ]
    results = []
    for label, query in checks:
        cur.execute(f"WITH viol AS ({query}) SELECT count(*) FROM viol")
        total_viol = cur.fetchone()[0]
        cur.execute(f"""
            WITH viol AS ({query})
            SELECT count(DISTINCT v.entity_id) 
            FROM viol v
            JOIN gt.ground_truth gt 
              ON (gt.entity_id = v.entity_id OR gt.entity_id = v.order_id)
        """)
        labelled = cur.fetchone()[0]
        unlabelled = total_viol - labelled
        results.append((label, total_viol, labelled, unlabelled))
    return results


def main() -> None:
    """PURPOSE: Main entry point running Phase A Ground Truth Audit and printing gate evidence.
    INPUT: None
    RETURNS: None
    ERRORS: none
    """
    with get_connection() as conn, conn.cursor() as cur:
        print("\n" + "=" * 80 + "\nPHASE A: REAL DATABASE SCHEMA & TABLE/VIEW ROW COUNTS\n" + "=" * 80)
        table_counts = audit_table_counts(cur)
        for schema, name, t_type, count in table_counts:
            print(f" {schema:<11} | {name:<32} | {t_type:<10} | {count:>8} rows")

        print("\n" + "=" * 80 + "\nPHASE A: ANALYTICS VIEW GRAIN & FAN-OUT AUDIT\n" + "=" * 80)
        view_grains = audit_view_grains(cur)
        for vname, actual, grain, expected, fan_out in view_grains:
            status = "\033[31m[FAN-OUT BUG]\033[0m" if fan_out else "\033[32m[GRAIN OK]\033[0m"
            print(f" {vname:<32} | Actual: {actual:>6} | Expected: {expected:>6} ({grain:<30}) -> {status}")

        print("\n" + "=" * 80 + "\nPHASE A: DATE-ORDER VIOLATIONS & GROUND TRUTH RECONCILIATION\n" + "=" * 80)
        viol_counts = audit_date_order_violations(cur)
        for label, total, labelled, unlabelled in viol_counts:
            bug_flag = f"\033[31m{unlabelled} UNLABELLED DEFECTS\033[0m" if unlabelled > 0 else "\033[32mALL LABELLED\033[0m"
            print(f" {label:<32} | Total: {total:>5} | Labelled: {labelled:>5} | Unlabelled: {unlabelled:>5} -> {bug_flag}")
        print("=" * 80 + "\n")


if __name__ == "__main__":
    main()

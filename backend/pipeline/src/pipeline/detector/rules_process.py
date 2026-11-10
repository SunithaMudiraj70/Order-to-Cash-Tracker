"""Discrete detection rules identifying shipment, underbilling, duplicate, and aging anomalies."""

import os
from datetime import date, timedelta

from pipeline.detector.models import Finding


def detect_partial_shipment(conn) -> list[Finding]:
    """PURPOSE: Detect shipment lines where shipped quantity is less than ordered.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT sl.shipment_line_id, sl.shipped_qty, ol.ordered_qty
    FROM o2c.shipment_line sl
    JOIN o2c.order_line ol ON sl.order_line_id = ol.order_line_id
    WHERE sl.shipped_qty < ol.ordered_qty;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-SHP-{r[0]}",
                entity_type="SHIPMENT_LINE",
                entity_id=r[0],
                issue_type="PARTIAL_SHIPMENT",
                evidence={"shipped_qty": float(r[1]), "ordered_qty": float(r[2])},
            )
            for r in cur.fetchall()
        ]


def detect_underbilling(conn) -> list[Finding]:
    """PURPOSE: Detect invoice lines billed at unit price below contracted order price.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT il.invoice_line_id, il.unit_price, ol.unit_price
    FROM o2c.invoice_line il
    JOIN o2c.order_line ol ON il.order_line_id = ol.order_line_id
    WHERE il.unit_price < ol.unit_price;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-UND-{r[0]}",
                entity_type="INVOICE_LINE",
                entity_id=r[0],
                issue_type="UNDERBILLING",
                evidence={"billed_unit_price": float(r[1]), "contract_unit_price": float(r[2])},
            )
            for r in cur.fetchall()
        ]


def detect_duplicate_invoice(conn) -> list[Finding]:
    """PURPOSE: Detect invoices flagged or created as duplicate billings.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT invoice_id, dup_of_invoice_id, total_amount
    FROM o2c.invoice
    WHERE dup_of_invoice_id IS NOT NULL;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-DUP-{r[0]}",
                entity_type="INVOICE",
                entity_id=r[0],
                issue_type="DUPLICATE_INVOICE",
                evidence={"dup_of": r[1], "amount": float(r[2])},
            )
            for r in cur.fetchall()
        ]


def detect_short_payment(conn) -> list[Finding]:
    """PURPOSE: Detect partially paid invoices with open balances and no disputes.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT i.invoice_id, i.total_amount, i.paid_amount, i.balance_amount
    FROM o2c.invoice i
    WHERE i.status = 'PARTIALLY_PAID' AND i.balance_amount > 0
      AND NOT EXISTS (SELECT 1 FROM o2c.dispute d WHERE d.invoice_id = i.invoice_id);
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-SHT-{r[0]}",
                entity_type="INVOICE",
                entity_id=r[0],
                issue_type="SHORT_PAYMENT",
                evidence={"total": float(r[1]), "paid": float(r[2]), "balance": float(r[3])},
            )
            for r in cur.fetchall()
        ]


def detect_long_overdue(conn) -> list[Finding]:
    """PURPOSE: Detect severely overdue invoices with balances exceeding 90 days.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    as_of = date.fromisoformat(os.getenv("DATAGEN_AS_OF_DATE", "2026-10-31"))
    cutoff = as_of - timedelta(days=90)
    sql = """
    SELECT invoice_id, due_date, balance_amount
    FROM o2c.invoice
    WHERE status = 'OVERDUE' AND due_date <= %s;
    """
    with conn.cursor() as cur:
        cur.execute(sql, (cutoff,))
        return [
            Finding(
                finding_id=f"FND-LOD-{r[0]}",
                entity_type="INVOICE",
                entity_id=r[0],
                issue_type="LONG_OVERDUE",
                evidence={"due_date": str(r[1]), "balance": float(r[2])},
            )
            for r in cur.fetchall()
        ]


"""Discrete detection rules identifying billing discrepancies and duplicate allocations."""

from pipeline.detector.models import Finding


def detect_invoice_exceeds_fulfilled(conn) -> list[Finding]:
    """PURPOSE: Detect invoice lines where billed quantity exceeds shipped quantity.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT il.invoice_line_id, il.billed_qty, sl.shipped_qty
    FROM o2c.invoice_line il
    JOIN o2c.shipment_line sl ON il.order_line_id = sl.order_line_id
    WHERE il.billed_qty > sl.shipped_qty;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-EXC-{r[0]}",
                entity_type="INVOICE_LINE",
                entity_id=r[0],
                issue_type="INVOICE_EXCEEDS_FULFILLED",
                evidence={"billed_qty": float(r[1]), "shipped_qty": float(r[2])},
            )
            for r in cur.fetchall()
        ]


def detect_payment_allocated_twice(conn) -> list[Finding]:
    """PURPOSE: Detect duplicate payment allocations referencing identical payments.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT allocation_id, payment_id, invoice_id
    FROM (
        SELECT allocation_id, payment_id, invoice_id,
               row_number() OVER (PARTITION BY payment_id, invoice_id ORDER BY allocation_id) as rn
        FROM o2c.payment_allocation
    ) t
    WHERE t.rn > 1;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-ALC-{r[0]}",
                entity_type="PAYMENT_ALLOCATION",
                entity_id=r[0],
                issue_type="PAYMENT_ALLOCATED_TWICE",
                evidence={"payment_id": r[1], "invoice_id": r[2]},
            )
            for r in cur.fetchall()
        ]


def detect_order_closed_unpaid(conn) -> list[Finding]:
    """PURPOSE: Detect sales orders marked CLOSED that still have unpaid invoices.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT o.order_id, sum(i.balance_amount)
    FROM o2c.sales_order o
    JOIN o2c.invoice i ON o.order_id = i.order_id
    WHERE o.status = 'CLOSED' AND i.balance_amount > 0
    GROUP BY o.order_id;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-CLS-{r[0]}",
                entity_type="SALES_ORDER",
                entity_id=r[0],
                issue_type="ORDER_CLOSED_UNPAID",
                evidence={"unpaid_balance": float(r[1])},
            )
            for r in cur.fetchall()
        ]


def detect_status_event_skipped_state(conn) -> list[Finding]:
    """PURPOSE: Detect status events transitioning directly from CREATED to PAID.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT event_id, entity_id, from_status, to_status
    FROM o2c.status_event
    WHERE entity_type = 'SALES_ORDER' AND from_status = 'CREATED' AND to_status = 'PAID';
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-SKP-{r[0]}",
                entity_type="SALES_ORDER",
                entity_id=r[1],
                issue_type="STATUS_EVENT_SKIPPED_STATE",
                evidence={"event_id": r[0], "from_status": r[2], "to_status": r[3]},
            )
            for r in cur.fetchall()
        ]


def detect_dispute_not_in_receivables(conn) -> list[Finding]:
    """PURPOSE: Detect disputes filed on invoices with zero balance.
    INPUT: conn: psycopg2 connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    sql = """
    SELECT d.dispute_id, d.invoice_id, d.disputed_amount, i.balance_amount
    FROM o2c.dispute d
    JOIN o2c.invoice i ON d.invoice_id = i.invoice_id
    WHERE i.balance_amount <= 0 AND d.status = 'OPEN';
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return [
            Finding(
                finding_id=f"FND-DSP-{r[0]}",
                entity_type="DISPUTE",
                entity_id=r[0],
                issue_type="DISPUTE_NOT_IN_RECEIVABLES",
                evidence={
                    "dispute_id": r[0],
                    "invoice_id": r[1],
                    "disputed_amount": float(r[2]),
                    "balance": float(r[3]),
                },
            )
            for r in cur.fetchall()
        ]

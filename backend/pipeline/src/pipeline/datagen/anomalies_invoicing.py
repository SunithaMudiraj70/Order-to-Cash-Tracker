"""Injection of unpaid closed sales orders and duplicate invoice billings."""

from datetime import datetime, timedelta
from decimal import Decimal

from pipeline.datagen import ids
from pipeline.datagen.models import GroundTruthRow, InvoiceRow, PaymentAllocationRow, SalesOrderRow


def inject_order_closed_unpaid(
    orders: list[SalesOrderRow],
    invoices: list[InvoiceRow],
    allocations: list[PaymentAllocationRow],
    sample_size: int,
    gt_idx: int,
    ts: datetime,
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Close sales orders while resetting invoice balances to uncollected.
    INPUT: orders, invoices, allocations, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    inv_map = {inv.order_id: inv for inv in invoices}
    for o in orders[:sample_size]:
        o.status = "CLOSED"
        inv = inv_map.get(o.order_id)
        if inv:
            inv.paid_amount, inv.balance_amount, inv.status = (
                Decimal("0.00"),
                inv.total_amount,
                "ISSUED",
            )
        records.append(
            GroundTruthRow(
                gt_id=ids.gt_id(curr_idx),
                entity_type="SALES_ORDER",
                entity_id=o.order_id,
                issue_type="ORDER_CLOSED_UNPAID",
                expected_decision="REOPEN_ORDER_COLLECTIONS",
                injected_rule="RULE-03-CLOSED-UNPAID",
                notes="Sales order closed with uncollected balance.",
                created_at=ts,
            )
        )
        curr_idx += 1
    unpaid = {inv_map[o.order_id].invoice_id for o in orders[:sample_size] if o.order_id in inv_map}
    allocations[:] = [a for a in allocations if a.invoice_id not in unpaid]
    return records, curr_idx


def inject_duplicate_invoice(
    invoices: list[InvoiceRow], sample_size: int, gt_idx: int, ts: datetime
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Issue duplicate invoices referencing the same sales orders.
    INPUT: invoices, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    for orig in invoices[:sample_size]:
        dup_id = ids.invoice_id(len(invoices) + curr_idx)
        dup = InvoiceRow(
            invoice_id=dup_id,
            order_id=orig.order_id,
            account_id=orig.account_id,
            status="ISSUED",
            invoice_date=orig.invoice_date + timedelta(days=1),
            due_date=orig.due_date + timedelta(days=1),
            subtotal=orig.subtotal,
            tax=orig.tax,
            total_amount=orig.total_amount,
            paid_amount=Decimal("0.00"),
            balance_amount=orig.total_amount,
            currency="USD",
            dup_of_invoice_id=orig.invoice_id,
            created_at=orig.created_at,
        )
        invoices.append(dup)
        records.append(
            GroundTruthRow(
                gt_id=ids.gt_id(curr_idx),
                entity_type="INVOICE",
                entity_id=dup_id,
                issue_type="DUPLICATE_INVOICE",
                expected_decision="VOID_DUPLICATE_INVOICE",
                injected_rule="RULE-08-DUPLICATE-INVOICE",
                notes="Second billing invoice issued for same sales order.",
                created_at=ts,
            )
        )
        curr_idx += 1
    return records, curr_idx

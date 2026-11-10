"""PURPOSE: Injection of short payment remittance and severe overdue invoice anomalies.
INPUT: invoices, allocations, sample_size, gt_idx, ts, as_of
RETURNS: tuple[list[GroundTruthRow], int]
ERRORS: none
"""

from datetime import date, datetime, timedelta
from decimal import Decimal

from pipeline.datagen import ids
from pipeline.datagen.derive import calc_balance_amount, round_money
from pipeline.datagen.models import GroundTruthRow, InvoiceRow, PaymentAllocationRow


def inject_short_payment(
    invoices: list[InvoiceRow],
    allocations: list[PaymentAllocationRow],
    sample_size: int,
    gt_idx: int,
    ts: datetime,
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Underpay invoices and adjust remittance allocations accordingly.
    INPUT: invoices, allocations, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    target = invoices[sample_size * 2 : sample_size * 3]
    for inv in target:
        inv.paid_amount = round_money(inv.total_amount * Decimal("0.85"))
        inv.balance_amount = calc_balance_amount(inv.total_amount, inv.paid_amount)
        inv.status = "PARTIALLY_PAID"
        records.append(
            GroundTruthRow(
                gt_id=ids.gt_id(curr_idx),
                entity_type="INVOICE",
                entity_id=inv.invoice_id,
                issue_type="SHORT_PAYMENT",
                expected_decision="REQUEST_BALANCE_PAYMENT",
                injected_rule="RULE-09-SHORT-PAYMENT",
                notes="Remittance received was less than invoice balance.",
                created_at=ts,
            )
        )
        curr_idx += 1
    short_ids = {inv.invoice_id: inv.paid_amount for inv in target}
    for a in allocations:
        if a.invoice_id in short_ids:
            a.allocated_amount = short_ids[a.invoice_id]
    return records, curr_idx


def inject_long_overdue(
    invoices: list[InvoiceRow],
    allocations: list[PaymentAllocationRow],
    sample_size: int,
    gt_idx: int,
    ts: datetime,
    as_of: date = date(2026, 10, 31),
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Select early invoices older than 90 days with uncollected balances.
    INPUT: invoices, allocations, sample_size, gt_idx, ts, as_of
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    # Filter candidate invoices whose invoice_date allows > 90 days overdue relative to as_of
    candidates = [i for i in invoices if i.invoice_date <= as_of - timedelta(days=120)]
    target = candidates[:sample_size] if len(candidates) >= sample_size else invoices[:sample_size]
    for inv in target:
        inv.due_date = min(inv.due_date, as_of - timedelta(days=95))
        inv.paid_amount = Decimal("0.00")
        inv.balance_amount = inv.total_amount
        inv.status = "OVERDUE"
        records.append(
            GroundTruthRow(
                gt_id=ids.gt_id(curr_idx),
                entity_type="INVOICE",
                entity_id=inv.invoice_id,
                issue_type="LONG_OVERDUE",
                expected_decision="ESCALATE_TO_COLLECTIONS",
                injected_rule="RULE-10-LONG-OVERDUE",
                notes="Receivable overdue for greater than 90 days.",
                created_at=ts,
            )
        )
        curr_idx += 1
    overdue_ids = {inv.invoice_id for inv in target}
    allocations[:] = [a for a in allocations if a.invoice_id not in overdue_ids]
    return records, curr_idx

"""Injection of short payment remittance and severe overdue invoice anomalies."""

from datetime import date, datetime
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
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Force invoice due dates older than 90 days with uncollected balances.
    INPUT: invoices, allocations, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    target = invoices[sample_size * 3 : sample_size * 4]
    for inv in target:
        inv.invoice_date = date(2026, 1, 15)
        inv.due_date = date(2026, 2, 15)
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

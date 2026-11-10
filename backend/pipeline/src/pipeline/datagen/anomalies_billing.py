"""Controlled injection of billing discrepancies and payment allocation anomalies."""

from datetime import datetime
from decimal import Decimal

from pipeline.datagen import ids
from pipeline.datagen.anomalies_invoicing import (
    inject_duplicate_invoice,
    inject_order_closed_unpaid,
)
from pipeline.datagen.derive import round_money
from pipeline.datagen.models import GroundTruthRow, InvoiceLineRow, PaymentAllocationRow


def inject_invoice_exceeds_fulfilled(
    invoice_lines: list[InvoiceLineRow], sample_size: int, gt_idx: int, ts: datetime
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Inflate invoice line billed qty above shipment quantity.
    INPUT: invoice_lines, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    for il in invoice_lines[:sample_size]:
        il.billed_qty += Decimal("5.000")
        il.line_total = round_money(il.billed_qty * il.unit_price)
        records.append(
            GroundTruthRow(
                gt_id=ids.gt_id(curr_idx),
                entity_type="INVOICE_LINE",
                entity_id=il.invoice_line_id,
                issue_type="INVOICE_EXCEEDS_FULFILLED",
                expected_decision="FLAG_OVERBILLING_HOLD",
                injected_rule="RULE-01-EXCEEDS-FULFILLED",
                notes="Billed quantity inflated above shipped fulfillment.",
                created_at=ts,
            )
        )
        curr_idx += 1
    return records, curr_idx


def inject_payment_allocated_twice(
    allocations: list[PaymentAllocationRow], sample_size: int, gt_idx: int, ts: datetime
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Create duplicate payment allocations referencing identical payments.
    INPUT: allocations, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    target = (
        allocations[sample_size * 4 : sample_size * 5]
        if len(allocations) >= sample_size * 5
        else allocations[:sample_size]
    )
    for alc in target:
        dup = PaymentAllocationRow(
            allocation_id=ids.allocation_id(len(allocations) + curr_idx + 100),
            payment_id=alc.payment_id,
            invoice_id=alc.invoice_id,
            allocated_amount=alc.allocated_amount,
            allocated_at=alc.allocated_at,
            created_at=alc.created_at,
        )
        allocations.append(dup)
        records.append(
            GroundTruthRow(
                gt_id=ids.gt_id(curr_idx),
                entity_type="PAYMENT_ALLOCATION",
                entity_id=dup.allocation_id,
                issue_type="PAYMENT_ALLOCATED_TWICE",
                expected_decision="REVERSE_DUPLICATE_ALLOCATION",
                injected_rule="RULE-02-ALLOCATED-TWICE",
                notes="Payment remittance applied twice against same invoice.",
                created_at=ts,
            )
        )
        curr_idx += 1
    return records, curr_idx


def inject_underbilling(
    invoice_lines: list[InvoiceLineRow], sample_size: int, gt_idx: int, ts: datetime
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Reduce unit price on billed invoice lines below contracted price.
    INPUT: invoice_lines, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    for il in invoice_lines[sample_size : sample_size * 2]:
        il.unit_price = round_money(il.unit_price * Decimal("0.70"))
        il.line_total = round_money(il.billed_qty * il.unit_price)
        records.append(
            GroundTruthRow(
                gt_id=ids.gt_id(curr_idx),
                entity_type="INVOICE_LINE",
                entity_id=il.invoice_line_id,
                issue_type="UNDERBILLING",
                expected_decision="ISSUE_SUPPLEMENTARY_INVOICE",
                injected_rule="RULE-07-UNDERBILLING",
                notes="Invoice unit price billed below contract price.",
                created_at=ts,
            )
        )
        curr_idx += 1
    return records, curr_idx


__all__ = [
    "inject_duplicate_invoice",
    "inject_invoice_exceeds_fulfilled",
    "inject_order_closed_unpaid",
    "inject_payment_allocated_twice",
    "inject_underbilling",
]

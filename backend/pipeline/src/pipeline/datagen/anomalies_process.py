"""Controlled injection of process jump, dispute, and partial shipment anomalies."""

from datetime import datetime, timedelta
from decimal import Decimal

from pipeline.datagen import ids
from pipeline.datagen.derive import round_money
from pipeline.datagen.models import (
    DisputeRow,
    GroundTruthRow,
    InvoiceLineRow,
    InvoiceRow,
    OrderLineRow,
    SalesOrderRow,
    ShipmentLineRow,
    StatusEventRow,
)


def inject_status_event_skipped_state(
    orders: list[SalesOrderRow],
    events: list[StatusEventRow],
    sample_size: int,
    gt_idx: int,
    ts: datetime,
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Insert status events jumping illegal state directly from CREATED to PAID.
    INPUT: orders, events, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    for o in orders[sample_size : sample_size * 2]:
        events.append(StatusEventRow(
            event_id=ids.event_id(len(events) + curr_idx),
            entity_type="SALES_ORDER", entity_id=o.order_id,
            from_status="CREATED", to_status="PAID",
            event_ts=o.created_at + timedelta(days=2), actor="system",
            source="unauthorized_override", payload={"anomaly": True},
            created_at=o.created_at,
        ))
        records.append(GroundTruthRow(
            gt_id=ids.gt_id(curr_idx), entity_type="SALES_ORDER",
            entity_id=o.order_id, issue_type="STATUS_EVENT_SKIPPED_STATE",
            expected_decision="AUDIT_STATE_JUMP",
            injected_rule="RULE-04-SKIPPED-STATE",
            notes="Status jumped illegal state from CREATED directly to PAID.",
            created_at=ts,
        ))
        curr_idx += 1
    return records, curr_idx


def inject_dispute_not_in_receivables(
    invoices: list[InvoiceRow],
    disputes: list[DisputeRow],
    sample_size: int,
    gt_idx: int,
    ts: datetime,
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: File disputes against settled zero-balance invoices.
    INPUT: invoices, disputes, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    paid_invoices = [i for i in invoices if i.status == "PAID"]
    start = min(500, max(0, len(paid_invoices) - sample_size))
    for inv in paid_invoices[start : start + sample_size]:
        d_id = ids.dispute_id(len(disputes) + curr_idx)
        d_ts = inv.created_at + timedelta(days=15)
        disputes.append(DisputeRow(
            dispute_id=d_id, invoice_id=inv.invoice_id, status="OPEN",
            opened_at=d_ts, disputed_amount=round_money(inv.total_amount * Decimal("0.4")),
            reason_code="PRICING_ERROR", created_at=d_ts,
        ))
        records.append(GroundTruthRow(
            gt_id=ids.gt_id(curr_idx), entity_type="DISPUTE",
            entity_id=d_id, issue_type="DISPUTE_NOT_IN_RECEIVABLES",
            expected_decision="REJECT_DISPUTE_PAID_INVOICE",
            injected_rule="RULE-05-DISPUTE-NOT-IN-RECEIVABLES",
            notes="Dispute filed against fully settled invoice.",
            created_at=ts,
        ))
        curr_idx += 1
    return records, curr_idx


def inject_partial_shipment(
    order_lines: list[OrderLineRow],
    shipment_lines: list[ShipmentLineRow],
    invoice_lines: list[InvoiceLineRow],
    sample_size: int,
    gt_idx: int,
    ts: datetime,
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Lower shipped qty on shipments below ordered quantities with matching billing.
    INPUT: order_lines, shipment_lines, invoice_lines, sample_size, gt_idx, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    curr_idx = gt_idx
    start = 300
    ol_map = {ol.order_line_id: ol for ol in order_lines}
    il_map = {il.order_line_id: il for il in invoice_lines}
    for sl in shipment_lines[start : start + sample_size]:
        mol = ol_map.get(sl.order_line_id)
        if mol:
            mol.ordered_qty = Decimal("10.000")
        sl.shipped_qty = Decimal("4.000")
        mil = il_map.get(sl.order_line_id)
        if mil:
            mil.billed_qty = sl.shipped_qty
            mil.line_total = round_money(mil.billed_qty * mil.unit_price)
        records.append(GroundTruthRow(
            gt_id=ids.gt_id(curr_idx), entity_type="SHIPMENT_LINE",
            entity_id=sl.shipment_line_id, issue_type="PARTIAL_SHIPMENT",
            expected_decision="SCHEDULE_BACKORDER_FULFILLMENT",
            injected_rule="RULE-06-PARTIAL-SHIPMENT",
            notes="Order line only partially fulfilled without backorder notice.",
            created_at=ts,
        ))
        curr_idx += 1
    return records, curr_idx

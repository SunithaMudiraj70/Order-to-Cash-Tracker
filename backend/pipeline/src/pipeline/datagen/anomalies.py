"""Injection of controlled revenue leakage and process delay anomalies."""

from datetime import UTC, datetime

import numpy as np

from pipeline.datagen.anomalies_billing import (
    inject_duplicate_invoice,
    inject_invoice_exceeds_fulfilled,
    inject_order_closed_unpaid,
    inject_payment_allocated_twice,
    inject_underbilling,
)
from pipeline.datagen.anomalies_process import (
    inject_dispute_not_in_receivables,
    inject_long_overdue,
    inject_partial_shipment,
    inject_short_payment,
    inject_status_event_skipped_state,
)
from pipeline.datagen.models import (
    DisputeRow,
    GroundTruthRow,
    InvoiceLineRow,
    InvoiceRow,
    OrderLineRow,
    PaymentAllocationRow,
    PaymentRow,
    SalesOrderRow,
    ShipmentLineRow,
    ShipmentRow,
    StatusEventRow,
)


def _inject_group_one(
    orders: list[SalesOrderRow],
    invoices: list[InvoiceRow],
    invoice_lines: list[InvoiceLineRow],
    allocations: list[PaymentAllocationRow],
    size: int,
    ts: datetime,
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Inject first group of anomalies (exceeds fulfilled, payment allocation, closed unpaid).
    INPUT: orders, invoices, invoice_lines, allocations, size, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    r1, idx = inject_invoice_exceeds_fulfilled(invoice_lines, size, 1, ts)
    records.extend(r1)
    r2, idx = inject_payment_allocated_twice(allocations, size, idx, ts)
    records.extend(r2)
    r3, idx = inject_order_closed_unpaid(orders, invoices, allocations, size, idx, ts)
    records.extend(r3)
    return records, idx


def _inject_group_two(
    orders: list[SalesOrderRow],
    o_lines: list[OrderLineRow],
    s_lines: list[ShipmentLineRow],
    invoices: list[InvoiceRow],
    i_lines: list[InvoiceLineRow],
    allocations: list[PaymentAllocationRow],
    disputes: list[DisputeRow],
    events: list[StatusEventRow],
    size: int,
    idx: int,
    ts: datetime,
) -> list[GroundTruthRow]:
    """PURPOSE: Inject second group of anomalies (events, disputes, shipments, underbilling, dupes, settlements).
    INPUT: entities, size, idx, ts
    RETURNS: list[GroundTruthRow]
    ERRORS: none
    """
    records: list[GroundTruthRow] = []
    r4, idx = inject_status_event_skipped_state(orders, events, size, idx, ts)
    records.extend(r4)
    r5, idx = inject_dispute_not_in_receivables(invoices, disputes, size, idx, ts)
    records.extend(r5)
    r6, idx = inject_partial_shipment(o_lines, s_lines, size, idx, ts)
    records.extend(r6)
    r7, idx = inject_underbilling(i_lines, size, idx, ts)
    records.extend(r7)
    r8, idx = inject_duplicate_invoice(invoices, size, idx, ts)
    records.extend(r8)
    r9, idx = inject_short_payment(invoices, allocations, size, idx, ts)
    records.extend(r9)
    r10, _ = inject_long_overdue(invoices, allocations, size, idx, ts)
    records.extend(r10)
    return records


def inject_all_anomalies(
    rng: np.random.Generator,
    orders: list[SalesOrderRow],
    order_lines: list[OrderLineRow],
    shipments: list[ShipmentRow],
    shipment_lines: list[ShipmentLineRow],
    invoices: list[InvoiceRow],
    invoice_lines: list[InvoiceLineRow],
    payments: list[PaymentRow],
    allocations: list[PaymentAllocationRow],
    disputes: list[DisputeRow],
    events: list[StatusEventRow],
    target_rate: float = 0.08,
) -> list[GroundTruthRow]:
    """PURPOSE: Inject 10 canonical revenue leakage / process delay issues into dataset.
    INPUT: rng, entity lists, target_rate
    RETURNS: list[GroundTruthRow] (benchmark labels strictly isolated from o2c)
    ERRORS: none
    """
    size = max(1, int(len(orders) * (target_rate / 10)))
    ts = datetime(2026, 10, 22, 12, 0, 0, tzinfo=UTC)

    g1, next_idx = _inject_group_one(orders, invoices, invoice_lines, allocations, size, ts)
    g2 = _inject_group_two(
        orders,
        order_lines,
        shipment_lines,
        invoices,
        invoice_lines,
        allocations,
        disputes,
        events,
        size,
        next_idx,
        ts,
    )
    return g1 + g2

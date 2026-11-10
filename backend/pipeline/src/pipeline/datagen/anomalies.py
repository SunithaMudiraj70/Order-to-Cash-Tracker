"""PURPOSE: Controlled injection of 10 discrete anomaly rules and negative decoys.
INPUT: entity collections, anomaly_rates dict, as_of date
RETURNS: list[GroundTruthRow] (benchmark ground truth labels)
ERRORS: none
"""

from datetime import UTC, date, datetime

import numpy as np

from pipeline.datagen.anomalies_aging import inject_long_overdue, inject_short_payment
from pipeline.datagen.anomalies_billing import (
    inject_duplicate_invoice,
    inject_invoice_exceeds_fulfilled,
    inject_order_closed_unpaid,
    inject_payment_allocated_twice,
    inject_underbilling,
)
from pipeline.datagen.anomalies_process import (
    inject_dispute_not_in_receivables,
    inject_partial_shipment,
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
    i_lines: list[InvoiceLineRow],
    allocs: list[PaymentAllocationRow],
    rates: dict[str, float],
    ts: datetime,
) -> tuple[list[GroundTruthRow], int]:
    """PURPOSE: Inject first group of anomalies with distinct per-rule sample sizes.
    INPUT: orders, invoices, i_lines, allocs, rates, ts
    RETURNS: tuple[list[GroundTruthRow], int]
    ERRORS: none
    """
    n = len(orders)
    records: list[GroundTruthRow] = []
    r1, idx = inject_invoice_exceeds_fulfilled(
        i_lines, max(1, int(n * rates.get("INVOICE_EXCEEDS_FULFILLED", 0.008))), 1, ts
    )
    records.extend(r1)
    r2, idx = inject_payment_allocated_twice(
        allocs, max(1, int(n * rates.get("PAYMENT_ALLOCATED_TWICE", 0.009))), idx, ts
    )
    records.extend(r2)
    r3, idx = inject_order_closed_unpaid(
        orders, invoices, allocs, max(1, int(n * rates.get("ORDER_CLOSED_UNPAID", 0.010))), idx, ts
    )
    records.extend(r3)
    return records, idx


def _inject_group_two(
    orders: list[SalesOrderRow],
    o_lines: list[OrderLineRow],
    s_lines: list[ShipmentLineRow],
    invoices: list[InvoiceRow],
    i_lines: list[InvoiceLineRow],
    allocs: list[PaymentAllocationRow],
    disputes: list[DisputeRow],
    events: list[StatusEventRow],
    rates: dict[str, float],
    idx: int,
    ts: datetime,
    as_of: date,
) -> list[GroundTruthRow]:
    """PURPOSE: Inject remaining rules with distinct rates and valid date alignments.
    INPUT: entities, rates, idx, ts, as_of
    RETURNS: list[GroundTruthRow]
    ERRORS: none
    """
    n = len(orders)
    records: list[GroundTruthRow] = []
    r4, idx = inject_status_event_skipped_state(
        orders, events, max(1, int(n * rates.get("STATUS_EVENT_SKIPPED_STATE", 0.006))), idx, ts
    )
    records.extend(r4)
    r5, idx = inject_dispute_not_in_receivables(
        invoices, disputes, max(1, int(n * rates.get("DISPUTE_NOT_IN_RECEIVABLES", 0.005))), idx, ts
    )
    records.extend(r5)
    r6, idx = inject_partial_shipment(
        o_lines, s_lines, i_lines, max(1, int(n * rates.get("PARTIAL_SHIPMENT", 0.012))), idx, ts
    )
    records.extend(r6)
    r7, idx = inject_underbilling(
        i_lines, max(1, int(n * rates.get("UNDERBILLING", 0.009))), idx, ts
    )
    records.extend(r7)
    r8, idx = inject_duplicate_invoice(
        invoices, max(1, int(n * rates.get("DUPLICATE_INVOICE", 0.007))), idx, ts
    )
    records.extend(r8)
    r9, idx = inject_short_payment(
        invoices, allocs, max(1, int(n * rates.get("SHORT_PAYMENT", 0.011))), idx, ts
    )
    records.extend(r9)
    r10, _ = inject_long_overdue(
        invoices, allocs, max(1, int(n * rates.get("LONG_OVERDUE", 0.007))), idx, ts, as_of
    )
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
    rates: dict[str, float],
    as_of: date = date(2026, 10, 31),
    enabled: bool = True,
) -> list[GroundTruthRow]:
    """PURPOSE: Inject discrete anomaly rules with distinct rates into dataset.
    INPUT: rng, entity lists, rates, as_of, enabled
    RETURNS: list[GroundTruthRow] (benchmark labels strictly isolated from o2c)
    ERRORS: none
    """
    if not enabled:
        return []
    ts = datetime(2026, 10, 22, 12, 0, 0, tzinfo=UTC)
    g1, next_idx = _inject_group_one(orders, invoices, invoice_lines, allocations, rates, ts)
    g2 = _inject_group_two(
        orders, order_lines, shipment_lines, invoices, invoice_lines,
        allocations, disputes, events, rates, next_idx, ts, as_of
    )
    return g1 + g2

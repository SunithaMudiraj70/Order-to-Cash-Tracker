"""Status event ledger generator capturing immutable transition audit trails."""

from datetime import datetime

from pipeline.datagen import ids
from pipeline.datagen.models import (
    DisputeRow,
    InvoiceRow,
    PaymentRow,
    QuoteRow,
    SalesOrderRow,
    ShipmentRow,
    StatusEventRow,
)


def generate_status_events(
    quotes: list[QuoteRow],
    orders: list[SalesOrderRow],
    shipments: list[ShipmentRow],
    invoices: list[InvoiceRow],
    payments: list[PaymentRow],
    disputes: list[DisputeRow],
) -> list[StatusEventRow]:
    """PURPOSE: Generate chronological status event audit history for all entities.
    INPUT: quotes, orders, shipments, invoices, payments, disputes
    RETURNS: list[StatusEventRow]
    ERRORS: none
    """
    events: list[StatusEventRow] = []
    evt_idx = 1

    def add_evt(entity_type: str, entity_id: str, from_s: str | None, to_s: str, ts: datetime):
        nonlocal evt_idx
        events.append(
            StatusEventRow(
                event_id=ids.event_id(evt_idx),
                entity_type=entity_type,
                entity_id=entity_id,
                from_status=from_s,
                to_status=to_s,
                event_ts=ts,
                actor="system",
                source="datagen_engine",
                payload={"simulated": True},
                created_at=ts,
            )
        )
        evt_idx += 1

    for q in quotes:
        add_evt("QUOTE", q.quote_id, None, "DRAFT", q.created_at)
        add_evt("QUOTE", q.quote_id, "DRAFT", "SENT", q.created_at)
        add_evt("QUOTE", q.quote_id, "SENT", q.status, q.created_at)

    for o in orders:
        add_evt("SALES_ORDER", o.order_id, None, "CREATED", o.created_at)
        add_evt("SALES_ORDER", o.order_id, "CREATED", "CONFIRMED", o.created_at)

    for s in shipments:
        add_evt("SHIPMENT", s.shipment_id, None, "PLANNED", s.created_at)
        if s.status in ("SHIPPED", "DELIVERED"):
            add_evt("SHIPMENT", s.shipment_id, "PLANNED", "SHIPPED", s.created_at)
        if s.status == "DELIVERED":
            add_evt("SHIPMENT", s.shipment_id, "SHIPPED", "DELIVERED", s.created_at)

    for i in invoices:
        add_evt("INVOICE", i.invoice_id, None, "DRAFT", i.created_at)
        add_evt("INVOICE", i.invoice_id, "DRAFT", "ISSUED", i.created_at)
        if i.status != "ISSUED":
            add_evt("INVOICE", i.invoice_id, "ISSUED", i.status, i.created_at)

    for p in payments:
        add_evt("PAYMENT", p.payment_id, None, "RECEIVED", p.created_at)
        add_evt("PAYMENT", p.payment_id, "RECEIVED", p.status, p.created_at)

    for d in disputes:
        add_evt("DISPUTE", d.dispute_id, None, "OPEN", d.created_at)

    return events

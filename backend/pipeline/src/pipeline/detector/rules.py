"""Discrete detection rules identifying revenue leakage and process bottlenecks."""

from pipeline.detector.rules_billing import (
    detect_dispute_not_in_receivables,
    detect_invoice_exceeds_fulfilled,
    detect_order_closed_unpaid,
    detect_payment_allocated_twice,
    detect_status_event_skipped_state,
)
from pipeline.detector.rules_process import (
    detect_duplicate_invoice,
    detect_long_overdue,
    detect_partial_shipment,
    detect_short_payment,
    detect_underbilling,
)

ALL_RULES = [
    detect_invoice_exceeds_fulfilled,
    detect_payment_allocated_twice,
    detect_order_closed_unpaid,
    detect_status_event_skipped_state,
    detect_dispute_not_in_receivables,
    detect_partial_shipment,
    detect_underbilling,
    detect_duplicate_invoice,
    detect_short_payment,
    detect_long_overdue,
]

__all__ = [
    "ALL_RULES",
    "detect_dispute_not_in_receivables",
    "detect_duplicate_invoice",
    "detect_invoice_exceeds_fulfilled",
    "detect_long_overdue",
    "detect_order_closed_unpaid",
    "detect_partial_shipment",
    "detect_payment_allocated_twice",
    "detect_short_payment",
    "detect_status_event_skipped_state",
    "detect_underbilling",
]

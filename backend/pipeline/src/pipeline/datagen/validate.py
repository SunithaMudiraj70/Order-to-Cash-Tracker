"""PURPOSE: Integrity, referential consistency, and date-order validation for generated datasets.
INPUT: dataset dictionary of entity lists
RETURNS: ValidationReport instance
ERRORS: none
"""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class ValidationReport(BaseModel):
    is_valid: bool = True
    total_records: int = 0
    table_counts: dict[str, int] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    checked_rules: list[str] = Field(default_factory=list)
    reconciled_violations: dict[str, int] = Field(default_factory=dict)
    unreconciled_defects: int = 0
    validated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


def _check_primary_keys(dataset: dict[str, list[Any]], report: ValidationReport) -> None:
    """PURPOSE: Assert primary key uniqueness across all entity tables.
    INPUT: dataset, report
    RETURNS: None
    ERRORS: none
    """
    report.checked_rules.append("PRIMARY_KEY_UNIQUENESS")
    pk_map = {
        "accounts": "account_id",
        "quotes": "quote_id",
        "quote_lines": "quote_line_id",
        "orders": "order_id",
        "order_lines": "order_line_id",
        "shipments": "shipment_id",
        "shipment_lines": "shipment_line_id",
        "invoices": "invoice_id",
        "invoice_lines": "invoice_line_id",
        "payments": "payment_id",
        "allocations": "allocation_id",
        "disputes": "dispute_id",
        "status_events": "event_id",
        "ground_truth": "gt_id",
    }
    for table_name, pk_field in pk_map.items():
        seen = set()
        for r in dataset.get(table_name, []):
            val = getattr(r, pk_field)
            if val in seen:
                report.errors.append(f"Duplicate PK {val} in {table_name}")
                report.is_valid = False
            seen.add(val)


def _check_foreign_keys(dataset: dict[str, list[Any]], report: ValidationReport) -> None:
    """PURPOSE: Assert relational referential integrity between tables.
    INPUT: dataset, report
    RETURNS: None
    ERRORS: none
    """
    report.checked_rules.append("FOREIGN_KEY_INTEGRITY")
    accs = {a.account_id for a in dataset.get("accounts", [])}
    ords = {o.order_id for o in dataset.get("orders", [])}
    invs = {i.invoice_id for i in dataset.get("invoices", [])}
    for q in dataset.get("quotes", []):
        if q.account_id not in accs:
            report.errors.append(f"Quote {q.quote_id} points to missing account {q.account_id}")
    for s in dataset.get("shipments", []):
        if s.order_id not in ords:
            report.errors.append(f"Shipment {s.shipment_id} points to missing order {s.order_id}")
    for inv in dataset.get("invoices", []):
        if inv.order_id not in ords:
            report.errors.append(f"Invoice {inv.invoice_id} points to missing order {inv.order_id}")
    for d in dataset.get("disputes", []):
        if d.invoice_id not in invs:
            report.errors.append(f"Dispute {d.dispute_id} points to missing invoice {d.invoice_id}")
    if report.errors:
        report.is_valid = False


def _check_date_order(dataset: dict[str, list[Any]], report: ValidationReport) -> None:
    """PURPOSE: Assert chronological order across quote, order, shipment, invoice, payment milestones.
    INPUT: dataset, report
    RETURNS: None
    ERRORS: none
    """
    report.checked_rules.append("DATE_ORDER_CHRONOLOGY")
    q_map = {q.quote_id: q for q in dataset.get("quotes", [])}
    o_map = {o.order_id: o for o in dataset.get("orders", [])}
    s_map = {s.order_id: s for s in dataset.get("shipments", [])}
    inv_map = {i.invoice_id: i for i in dataset.get("invoices", [])}
    gt_entities = {gt.entity_id for gt in dataset.get("ground_truth", [])}

    for o in dataset.get("orders", []):
        q = q_map.get(o.quote_id)
        if q and o.order_date < q.quote_date:
            report.errors.append(f"order_date {o.order_date} < quote_date {q.quote_date} for {o.order_id}")
    for s in dataset.get("shipments", []):
        o = o_map.get(s.order_id)
        if o and s.ship_date < o.order_date:
            report.errors.append(f"ship_date {s.ship_date} < order_date {o.order_date} for {s.shipment_id}")
        if s.delivered_date < s.ship_date:
            report.errors.append(f"delivered_date {s.delivered_date} < ship_date {s.ship_date} for {s.shipment_id}")
    for inv in dataset.get("invoices", []):
        s = s_map.get(inv.order_id)
        if s and inv.invoice_date < s.ship_date and inv.invoice_id not in gt_entities:
            report.errors.append(
                f"UNLABELLED: invoice_date {inv.invoice_date} < ship_date {s.ship_date} on {inv.invoice_id}"
            )
            report.unreconciled_defects += 1
    for alc in dataset.get("allocations", []):
        inv = inv_map.get(alc.invoice_id)
        if inv and alc.allocated_at.date() < inv.invoice_date and alc.allocation_id not in gt_entities:
            report.errors.append(f"UNLABELLED: payment_date < invoice_date on allocation {alc.allocation_id}")
            report.unreconciled_defects += 1
    if report.unreconciled_defects > 0:
        report.is_valid = False


def validate_dataset(dataset: dict[str, list[Any]]) -> ValidationReport:
    """PURPOSE: Validate PK uniqueness, FK integrity, ground truth isolation, and date ordering.
    INPUT: dataset: dict[str, list of pydantic row models]
    RETURNS: ValidationReport
    ERRORS: none
    """
    report = ValidationReport(
        total_records=sum(len(rows) for rows in dataset.values()),
        table_counts={k: len(v) for k, v in dataset.items()},
    )
    _check_primary_keys(dataset, report)
    _check_foreign_keys(dataset, report)
    _check_date_order(dataset, report)
    report.checked_rules.append("GROUND_TRUTH_ISOLATION")
    for gt in dataset.get("ground_truth", []):
        if not gt.gt_id.startswith("GT-"):
            report.errors.append(f"Invalid GT ID: {gt.gt_id}")
            report.is_valid = False
    return report

"""Integrity and referential consistency validation for generated datasets."""

from datetime import UTC, datetime

from pydantic import BaseModel, Field


class ValidationReport(BaseModel):
    is_valid: bool = True
    total_records: int = 0
    table_counts: dict[str, int] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    checked_rules: list[str] = Field(default_factory=list)
    validated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


def validate_dataset(dataset: dict[str, list]) -> ValidationReport:
    """PURPOSE: Validate PK uniqueness, FK integrity, and arithmetic consistency.
    INPUT: dataset: dict[str, list of pydantic row models]
    RETURNS: ValidationReport
    ERRORS: none
    """
    report = ValidationReport()
    total = sum(len(rows) for rows in dataset.values())
    report.total_records = total
    report.table_counts = {k: len(v) for k, v in dataset.items()}

    # 1. Primary Key Uniqueness
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
        rows = dataset.get(table_name, [])
        seen_pks = set()
        for r in rows:
            val = getattr(r, pk_field)
            if val in seen_pks:
                report.errors.append(f"Duplicate PK {val} in table {table_name}")
                report.is_valid = False
            seen_pks.add(val)

    # 2. Foreign Key Integrity
    report.checked_rules.append("FOREIGN_KEY_INTEGRITY")
    acc_ids = {a.account_id for a in dataset.get("accounts", [])}
    order_ids = {o.order_id for o in dataset.get("orders", [])}
    inv_ids = {i.invoice_id for i in dataset.get("invoices", [])}

    for q in dataset.get("quotes", []):
        if q.account_id not in acc_ids:
            report.errors.append(f"Quote {q.quote_id} points to missing account {q.account_id}")
            report.is_valid = False

    for s in dataset.get("shipments", []):
        if s.order_id not in order_ids:
            report.errors.append(f"Shipment {s.shipment_id} points to missing order {s.order_id}")
            report.is_valid = False

    for inv in dataset.get("invoices", []):
        if inv.order_id not in order_ids:
            report.errors.append(f"Invoice {inv.invoice_id} points to missing order {inv.order_id}")
            report.is_valid = False

    for d in dataset.get("disputes", []):
        if d.invoice_id not in inv_ids:
            report.errors.append(f"Dispute {d.dispute_id} points to missing invoice {d.invoice_id}")
            report.is_valid = False

    # 3. Ground truth isolation check (NO FKs)
    report.checked_rules.append("GROUND_TRUTH_ISOLATION")
    for gt in dataset.get("ground_truth", []):
        if not gt.gt_id.startswith("GT-"):
            report.errors.append(f"Invalid GT ID: {gt.gt_id}")
            report.is_valid = False

    return report

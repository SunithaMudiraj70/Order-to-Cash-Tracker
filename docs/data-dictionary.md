# Order-to-Cash (O2C) Data Dictionary

> Auto-generated from source of truth Pydantic models (`backend/pipeline/src/pipeline/datagen/models.py`).

## Account

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `account_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^ACC-\d{6}$` |
| `name` | `str` | Required | Any text | - | Non-unique | Not Null |
| `segment` | `str` | Required | ENTERPRISE, MID_MARKET, SMB | - | Non-unique | Not Null |
| `region` | `str` | Required | NORTH_AMERICA, EMEA, APAC, LATAM | - | Non-unique | Not Null |
| `credit_limit` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `payment_terms_days` | `int` | Optional | - | days | Non-unique | Numeric >= 0 |
| `status` | `str` | Optional | ACTIVE, DRAFT, SENT, ACCEPTED, ISSUED, PAID, OVERDUE, OPEN, RESOLVED, etc. | - | Non-unique | Nullable / Optional |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |
| `effective_from` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |
| `effective_to` | `datetime | None` | Optional | - | - | Non-unique | Valid ISO 8601 |

## Dispute

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `dispute_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^DSP-2026-\d{6}$` |
| `invoice_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^INV-2026-\d{6}$` |
| `status` | `str` | Required | ACTIVE, DRAFT, SENT, ACCEPTED, ISSUED, PAID, OVERDUE, OPEN, RESOLVED, etc. | - | Non-unique | Not Null |
| `opened_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |
| `resolved_at` | `datetime | None` | Optional | - | - | Non-unique | Valid ISO 8601 |
| `disputed_amount` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `reason_code` | `str` | Required | Any text | - | Non-unique | Not Null |
| `credit_amount` | `Decimal` | Optional | - | USD | Non-unique | Numeric >= 0 |
| `notes` | `str | None` | Optional | Any text | - | Non-unique | Nullable / Optional |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## GroundTruth

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `gt_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^GT-\d{6}$` |
| `entity_type` | `str` | Required | Any text | - | Non-unique | Not Null |
| `entity_id` | `str` | Required | Any text | - | Foreign Key | Not Null |
| `issue_type` | `str` | Required | Valid Anomaly Type | - | Non-unique | Not Null |
| `expected_decision` | `str` | Required | Any text | - | Non-unique | Not Null |
| `injected_rule` | `str` | Required | Any text | - | Non-unique | Not Null |
| `notes` | `str | None` | Optional | Any text | - | Non-unique | Nullable / Optional |
| `severity` | `str` | Optional | Any text | - | Non-unique | Nullable / Optional |
| `detected` | `bool` | Optional | - | - | Non-unique | Nullable / Optional |
| `detected_at` | `datetime | None` | Optional | - | - | Non-unique | Valid ISO 8601 |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## InvoiceLine

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `invoice_line_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^IL-\d{6}$` |
| `invoice_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^INV-2026-\d{6}$` |
| `order_line_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^OL-\d{6}$` |
| `billed_qty` | `Decimal` | Required | - | items | Non-unique | Numeric >= 0 |
| `unit_price` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `line_total` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## Invoice

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `invoice_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^INV-2026-\d{6}$` |
| `order_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^SO-2026-\d{6}$` |
| `account_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^ACC-\d{6}$` |
| `status` | `str` | Required | ACTIVE, DRAFT, SENT, ACCEPTED, ISSUED, PAID, OVERDUE, OPEN, RESOLVED, etc. | - | Non-unique | Not Null |
| `invoice_date` | `date` | Required | - | - | Non-unique | Valid ISO 8601 |
| `due_date` | `date` | Required | - | - | Non-unique | Valid ISO 8601 |
| `subtotal` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `tax` | `Decimal` | Required | - | - | Non-unique | Numeric >= 0 |
| `total_amount` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `paid_amount` | `Decimal` | Optional | - | USD | Non-unique | Numeric >= 0 |
| `balance_amount` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `currency` | `str` | Optional | USD | - | Non-unique | Nullable / Optional |
| `dup_of_invoice_id` | `str | None` | Optional | Any text | - | Foreign Key | Nullable / Optional |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## OrderLine

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `order_line_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^OL-\d{6}$` |
| `order_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^SO-2026-\d{6}$` |
| `quote_line_id` | `str | None` | Optional | Any text | - | Foreign Key | Nullable / Optional |
| `line_no` | `int` | Required | - | - | Non-unique | Numeric >= 0 |
| `sku` | `str` | Required | Any text | - | Non-unique | Not Null |
| `ordered_qty` | `Decimal` | Required | - | items | Non-unique | Numeric >= 0 |
| `unit_price` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `line_total` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## PaymentAllocation

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `allocation_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^ALC-\d{6}$` |
| `payment_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^PAY-2026-\d{6}$` |
| `invoice_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^INV-2026-\d{6}$` |
| `allocated_amount` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `allocated_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## Payment

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `payment_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^PAY-2026-\d{6}$` |
| `account_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^ACC-\d{6}$` |
| `status` | `str` | Required | ACTIVE, DRAFT, SENT, ACCEPTED, ISSUED, PAID, OVERDUE, OPEN, RESOLVED, etc. | - | Non-unique | Not Null |
| `payment_date` | `date` | Required | - | - | Non-unique | Valid ISO 8601 |
| `amount` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `currency` | `str` | Optional | USD | - | Non-unique | Nullable / Optional |
| `method` | `str` | Required | WIRE, ACH, CHECK, CREDIT_CARD | - | Non-unique | Not Null |
| `reference_no` | `str` | Required | Any text | - | Non-unique | Not Null |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## QuoteLine

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `quote_line_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^QL-\d{6}$` |
| `quote_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^QTE-2026-\d{6}$` |
| `line_no` | `int` | Required | - | - | Non-unique | Numeric >= 0 |
| `sku` | `str` | Required | Any text | - | Non-unique | Not Null |
| `description` | `str` | Required | Any text | - | Non-unique | Not Null |
| `qty` | `Decimal` | Required | - | items | Non-unique | Numeric >= 0 |
| `unit_price` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `discount_pct` | `Decimal` | Optional | - | % | Non-unique | Numeric >= 0 |
| `line_total` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## Quote

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `quote_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^QTE-2026-\d{6}$` |
| `account_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^ACC-\d{6}$` |
| `status` | `str` | Required | ACTIVE, DRAFT, SENT, ACCEPTED, ISSUED, PAID, OVERDUE, OPEN, RESOLVED, etc. | - | Non-unique | Not Null |
| `quote_date` | `date` | Required | - | - | Non-unique | Valid ISO 8601 |
| `valid_until` | `date` | Required | - | - | Non-unique | Valid ISO 8601 |
| `total_amount` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `currency` | `str` | Optional | USD | - | Non-unique | Nullable / Optional |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## SalesOrder

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `order_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^SO-2026-\d{6}$` |
| `quote_id` | `str | None` | Optional | Any text | - | Foreign Key | Nullable / Optional |
| `account_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^ACC-\d{6}$` |
| `status` | `str` | Required | ACTIVE, DRAFT, SENT, ACCEPTED, ISSUED, PAID, OVERDUE, OPEN, RESOLVED, etc. | - | Non-unique | Not Null |
| `order_date` | `date` | Required | - | - | Non-unique | Valid ISO 8601 |
| `promised_date` | `date` | Required | - | - | Non-unique | Valid ISO 8601 |
| `total_amount` | `Decimal` | Required | - | USD | Non-unique | Numeric >= 0 |
| `currency` | `str` | Optional | USD | - | Non-unique | Nullable / Optional |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## ShipmentLine

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `shipment_line_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^SL-\d{6}$` |
| `shipment_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^SHP-2026-\d{6}$` |
| `order_line_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^OL-\d{6}$` |
| `shipped_qty` | `Decimal` | Required | - | items | Non-unique | Numeric >= 0 |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## Shipment

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `shipment_id` | `str` | Required | Any text | - | Unique (PK) | Regex: `^SHP-2026-\d{6}$` |
| `order_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^SO-2026-\d{6}$` |
| `status` | `str` | Required | ACTIVE, DRAFT, SENT, ACCEPTED, ISSUED, PAID, OVERDUE, OPEN, RESOLVED, etc. | - | Non-unique | Not Null |
| `ship_date` | `date | None` | Optional | - | - | Non-unique | Valid ISO 8601 |
| `delivered_date` | `date | None` | Optional | - | - | Non-unique | Valid ISO 8601 |
| `carrier` | `str | None` | Optional | Any text | - | Non-unique | Nullable / Optional |
| `tracking_number` | `str | None` | Optional | Any text | - | Non-unique | Nullable / Optional |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

## StatusEvent

| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `event_id` | `str` | Required | Any text | - | Foreign Key | Regex: `^EVT-\d{6,}$` |
| `entity_type` | `str` | Required | Any text | - | Non-unique | Not Null |
| `entity_id` | `str` | Required | Any text | - | Foreign Key | Not Null |
| `from_status` | `str | None` | Optional | Any text | - | Non-unique | Nullable / Optional |
| `to_status` | `str` | Required | Any text | - | Non-unique | Not Null |
| `event_ts` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |
| `actor` | `str` | Optional | Any text | - | Non-unique | Nullable / Optional |
| `source` | `str` | Optional | Any text | - | Non-unique | Nullable / Optional |
| `payload` | `dict[str, Any]` | Optional | - | - | Non-unique | Nullable / Optional |
| `created_at` | `datetime` | Required | - | - | Non-unique | Valid ISO 8601 |

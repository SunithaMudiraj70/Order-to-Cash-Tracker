# Order-to-Cash (O2C) Data Dictionary

> Auto-generated from source of truth Pydantic models (`backend/pipeline/src/pipeline/datagen/models.py`).

## Account

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `account_id` | `str` | Yes | Regex: `^ACC-\d{6}$` |
| `name` | `str` | Yes | - |
| `segment` | `str` | Yes | - |
| `region` | `str` | Yes | - |
| `credit_limit` | `Decimal` | Yes | - |
| `payment_terms_days` | `int` | No | Default: `30` |
| `status` | `str` | No | Default: `ACTIVE` |
| `created_at` | `datetime` | Yes | - |
| `effective_from` | `datetime` | Yes | - |
| `effective_to` | `datetime | None` | No | - |

## Dispute

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `dispute_id` | `str` | Yes | Regex: `^DSP-2026-\d{6}$` |
| `invoice_id` | `str` | Yes | Regex: `^INV-2026-\d{6}$` |
| `status` | `str` | Yes | - |
| `opened_at` | `datetime` | Yes | - |
| `resolved_at` | `datetime | None` | No | - |
| `disputed_amount` | `Decimal` | Yes | - |
| `reason_code` | `str` | Yes | - |
| `credit_amount` | `Decimal` | No | Default: `0.00` |
| `notes` | `str | None` | No | - |
| `created_at` | `datetime` | Yes | - |

## GroundTruth

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `gt_id` | `str` | Yes | Regex: `^GT-\d{6}$` |
| `entity_type` | `str` | Yes | - |
| `entity_id` | `str` | Yes | - |
| `issue_type` | `str` | Yes | - |
| `expected_decision` | `str` | Yes | - |
| `injected_rule` | `str` | Yes | - |
| `notes` | `str | None` | No | - |
| `severity` | `str` | No | Default: `HIGH` |
| `detected` | `bool` | No | Default: `False` |
| `detected_at` | `datetime | None` | No | - |
| `created_at` | `datetime` | Yes | - |

## InvoiceLine

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `invoice_line_id` | `str` | Yes | Regex: `^IL-\d{6}$` |
| `invoice_id` | `str` | Yes | Regex: `^INV-2026-\d{6}$` |
| `order_line_id` | `str` | Yes | Regex: `^OL-\d{6}$` |
| `billed_qty` | `Decimal` | Yes | - |
| `unit_price` | `Decimal` | Yes | - |
| `line_total` | `Decimal` | Yes | - |
| `created_at` | `datetime` | Yes | - |

## Invoice

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `invoice_id` | `str` | Yes | Regex: `^INV-2026-\d{6}$` |
| `order_id` | `str` | Yes | Regex: `^SO-2026-\d{6}$` |
| `account_id` | `str` | Yes | Regex: `^ACC-\d{6}$` |
| `status` | `str` | Yes | - |
| `invoice_date` | `date` | Yes | - |
| `due_date` | `date` | Yes | - |
| `subtotal` | `Decimal` | Yes | - |
| `tax` | `Decimal` | Yes | - |
| `total_amount` | `Decimal` | Yes | - |
| `paid_amount` | `Decimal` | No | Default: `0.00` |
| `balance_amount` | `Decimal` | Yes | - |
| `currency` | `str` | No | Default: `USD` |
| `dup_of_invoice_id` | `str | None` | No | - |
| `created_at` | `datetime` | Yes | - |

## OrderLine

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `order_line_id` | `str` | Yes | Regex: `^OL-\d{6}$` |
| `order_id` | `str` | Yes | Regex: `^SO-2026-\d{6}$` |
| `quote_line_id` | `str | None` | No | - |
| `line_no` | `int` | Yes | - |
| `sku` | `str` | Yes | - |
| `ordered_qty` | `Decimal` | Yes | - |
| `unit_price` | `Decimal` | Yes | - |
| `line_total` | `Decimal` | Yes | - |
| `created_at` | `datetime` | Yes | - |

## PaymentAllocation

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `allocation_id` | `str` | Yes | Regex: `^ALC-\d{6}$` |
| `payment_id` | `str` | Yes | Regex: `^PAY-2026-\d{6}$` |
| `invoice_id` | `str` | Yes | Regex: `^INV-2026-\d{6}$` |
| `allocated_amount` | `Decimal` | Yes | - |
| `allocated_at` | `datetime` | Yes | - |
| `created_at` | `datetime` | Yes | - |

## Payment

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `payment_id` | `str` | Yes | Regex: `^PAY-2026-\d{6}$` |
| `account_id` | `str` | Yes | Regex: `^ACC-\d{6}$` |
| `status` | `str` | Yes | - |
| `payment_date` | `date` | Yes | - |
| `amount` | `Decimal` | Yes | - |
| `currency` | `str` | No | Default: `USD` |
| `method` | `str` | Yes | - |
| `reference_no` | `str` | Yes | - |
| `created_at` | `datetime` | Yes | - |

## QuoteLine

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `quote_line_id` | `str` | Yes | Regex: `^QL-\d{6}$` |
| `quote_id` | `str` | Yes | Regex: `^QTE-2026-\d{6}$` |
| `line_no` | `int` | Yes | - |
| `sku` | `str` | Yes | - |
| `description` | `str` | Yes | - |
| `qty` | `Decimal` | Yes | - |
| `unit_price` | `Decimal` | Yes | - |
| `discount_pct` | `Decimal` | No | Default: `0.00` |
| `line_total` | `Decimal` | Yes | - |
| `created_at` | `datetime` | Yes | - |

## Quote

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `quote_id` | `str` | Yes | Regex: `^QTE-2026-\d{6}$` |
| `account_id` | `str` | Yes | Regex: `^ACC-\d{6}$` |
| `status` | `str` | Yes | - |
| `quote_date` | `date` | Yes | - |
| `valid_until` | `date` | Yes | - |
| `total_amount` | `Decimal` | Yes | - |
| `currency` | `str` | No | Default: `USD` |
| `created_at` | `datetime` | Yes | - |

## SalesOrder

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `order_id` | `str` | Yes | Regex: `^SO-2026-\d{6}$` |
| `quote_id` | `str | None` | No | - |
| `account_id` | `str` | Yes | Regex: `^ACC-\d{6}$` |
| `status` | `str` | Yes | - |
| `order_date` | `date` | Yes | - |
| `promised_date` | `date` | Yes | - |
| `total_amount` | `Decimal` | Yes | - |
| `currency` | `str` | No | Default: `USD` |
| `created_at` | `datetime` | Yes | - |

## ShipmentLine

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `shipment_line_id` | `str` | Yes | Regex: `^SL-\d{6}$` |
| `shipment_id` | `str` | Yes | Regex: `^SHP-2026-\d{6}$` |
| `order_line_id` | `str` | Yes | Regex: `^OL-\d{6}$` |
| `shipped_qty` | `Decimal` | Yes | - |
| `created_at` | `datetime` | Yes | - |

## Shipment

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `shipment_id` | `str` | Yes | Regex: `^SHP-2026-\d{6}$` |
| `order_id` | `str` | Yes | Regex: `^SO-2026-\d{6}$` |
| `status` | `str` | Yes | - |
| `ship_date` | `date | None` | No | - |
| `delivered_date` | `date | None` | No | - |
| `carrier` | `str | None` | No | - |
| `tracking_number` | `str | None` | No | - |
| `created_at` | `datetime` | Yes | - |

## StatusEvent

| Field | Type | Required | Constraints / Default |
| :--- | :--- | :--- | :--- |
| `event_id` | `str` | Yes | Regex: `^EVT-\d{6,}$` |
| `entity_type` | `str` | Yes | - |
| `entity_id` | `str` | Yes | - |
| `from_status` | `str | None` | No | - |
| `to_status` | `str` | Yes | - |
| `event_ts` | `datetime` | Yes | - |
| `actor` | `str` | No | Default: `system` |
| `source` | `str` | No | Default: `o2c_service` |
| `payload` | `dict[str, Any]` | No | Default factory |
| `created_at` | `datetime` | Yes | - |

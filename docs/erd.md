# Entity Relationship Diagram (ERD) & Cardinality

This document outlines the data model and structural relationships across schemas `o2c`, `gt`, and `analytics`.

## Mermaid Entity Relationship Diagram

```mermaid
erDiagram
    ACCOUNT ||--o{ QUOTE : "places (1:N)"
    ACCOUNT ||--o{ SALES_ORDER : "places (1:N)"
    ACCOUNT ||--o{ INVOICE : "billed_to (1:N)"
    ACCOUNT ||--o{ PAYMENT : "remits (1:N)"
    ACCOUNT ||--o{ PROFILES : "associated_with (1:N)"

    QUOTE ||--|{ QUOTE_LINE : "contains (1:N)"
    QUOTE ||--o| SALES_ORDER : "converts_to (1:0..1)"

    SALES_ORDER ||--|{ ORDER_LINE : "contains (1:N)"
    QUOTE_LINE ||--o| ORDER_LINE : "originates (0..1:1)"

    SALES_ORDER ||--o{ SHIPMENT : "fulfilled_by (1:N)"
    SHIPMENT ||--|{ SHIPMENT_LINE : "includes (1:N)"
    ORDER_LINE ||--o{ SHIPMENT_LINE : "shipped_via (1:N)"

    SALES_ORDER ||--o{ INVOICE : "billed_via (1:N)"
    INVOICE ||--|{ INVOICE_LINE : "contains (1:N)"
    ORDER_LINE ||--o{ INVOICE_LINE : "billed_in (1:N)"
    INVOICE ||--o{ INVOICE : "dup_of_invoice_id (0..1:N)"

    PAYMENT ||--o{ PAYMENT_ALLOCATION : "allocates (1:N)"
    INVOICE ||--o{ PAYMENT_ALLOCATION : "cleared_by (1:N)"

    INVOICE ||--o{ DISPUTE : "disputed_in (1:N)"

    ACCOUNT {
        string account_id PK "ACC-XXXXXX"
        string name
        string segment
        string region
        numeric credit_limit
        integer payment_terms_days
        string status
    }

    QUOTE {
        string quote_id PK "QTE-2026-XXXXXX"
        string account_id FK
        quote_status status
        date quote_date
        date valid_until
        numeric total_amount
        char currency
    }

    QUOTE_LINE {
        string quote_line_id PK "QL-XXXXXX"
        string quote_id FK
        int line_no
        string sku
        string description
        numeric qty
        numeric unit_price
        numeric discount_pct
        numeric line_total
    }

    SALES_ORDER {
        string order_id PK "SO-2026-XXXXXX"
        string quote_id FK "UNIQUE"
        string account_id FK
        order_status status
        date order_date
        date promised_date
        numeric total_amount
        char currency
    }

    ORDER_LINE {
        string order_line_id PK "OL-XXXXXX"
        string order_id FK
        string quote_line_id FK
        int line_no
        string sku
        numeric ordered_qty
        numeric unit_price
        numeric line_total
    }

    SHIPMENT {
        string shipment_id PK "SHP-2026-XXXXXX"
        string order_id FK
        shipment_status status
        date ship_date
        date delivered_date
        string carrier
        string tracking_number
    }

    SHIPMENT_LINE {
        string shipment_line_id PK "SL-XXXXXX"
        string shipment_id FK
        string order_line_id FK
        numeric shipped_qty
    }

    INVOICE {
        string invoice_id PK "INV-2026-XXXXXX"
        string order_id FK
        string account_id FK
        invoice_status status
        date invoice_date
        date due_date
        numeric subtotal
        numeric tax
        numeric total_amount
        numeric paid_amount
        numeric balance_amount
        string dup_of_invoice_id FK
    }

    INVOICE_LINE {
        string invoice_line_id PK "IL-XXXXXX"
        string invoice_id FK
        string order_line_id FK
        numeric billed_qty
        numeric unit_price
        numeric line_total
    }

    PAYMENT {
        string payment_id PK "PAY-2026-XXXXXX"
        string account_id FK
        payment_status status
        date payment_date
        numeric amount
        string method
        string reference_no
    }

    PAYMENT_ALLOCATION {
        string allocation_id PK "ALC-XXXXXX"
        string payment_id FK
        string invoice_id FK
        numeric allocated_amount
        timestamptz allocated_at
    }

    DISPUTE {
        string dispute_id PK "DSP-2026-XXXXXX"
        string invoice_id FK
        dispute_status status
        timestamptz opened_at
        timestamptz resolved_at
        numeric disputed_amount
        string reason_code
        numeric credit_amount
    }

    STATUS_EVENT {
        string event_id PK "EVT-XXXXXX"
        entity_type entity_type
        string entity_id "Polymorphic"
        string from_status
        string to_status
        timestamptz event_ts
        string actor
        string source
        jsonb payload
    }

    GROUND_TRUTH {
        string gt_id PK "GT-XXXXXX"
        entity_type entity_type
        string entity_id "No FK to o2c"
        issue_type issue_type
        string expected_decision
        string injected_rule
        string notes
    }

    DETECTOR_FINDINGS {
        string finding_id PK "FND-XXXXXX"
        string entity_type
        string entity_id
        string issue_type
        string severity
        jsonb evidence
        timestamptz detected_at
    }
```

---

## Cardinality & Relationship Matrix

| Primary Entity | Foreign / Child Entity | Cardinality | Enforced Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `o2c.account` | `o2c.quote` | `1 : 0..N` | `ON DELETE RESTRICT` | Customer accounts request multiple quotes |
| `o2c.account` | `o2c.sales_order` | `1 : 0..N` | `ON DELETE RESTRICT` | Customer accounts can place multiple sales orders |
| `o2c.quote` | `o2c.quote_line` | `1 : 1..N` | `ON DELETE RESTRICT`, `UNIQUE(quote_id, line_no)` | Each quote consists of multiple line items |
| `o2c.quote` | `o2c.sales_order` | `1 : 0..1` | `quote_id UNIQUE` on `sales_order` | A quote converts into at most one sales order |
| `o2c.sales_order` | `o2c.order_line` | `1 : 1..N` | `ON DELETE RESTRICT`, `UNIQUE(order_id, line_no)` | Each sales order consists of multiple order lines |
| `o2c.order_line` | `o2c.quote_line` | `0..N : 0..1`| `ON DELETE RESTRICT` | Order lines originate from corresponding quote lines |
| `o2c.sales_order` | `o2c.shipment` | `1 : 0..N` | `ON DELETE RESTRICT` | An order may be fulfilled in partial or multiple shipments |
| `o2c.shipment` | `o2c.shipment_line` | `1 : 1..N` | `ON DELETE RESTRICT`, `UNIQUE(shipment_id, order_line_id)` | Shipment contains fulfillment quantities for lines |
| `o2c.sales_order` | `o2c.invoice` | `1 : 0..N` | `ON DELETE RESTRICT` | Orders can have milestone, partial, or full invoices |
| `o2c.invoice` | `o2c.invoice_line` | `1 : 1..N` | `ON DELETE RESTRICT` | Invoices itemize billed quantities and prices |
| `o2c.invoice` | `o2c.invoice` | `0..1 : 0..N`| `dup_of_invoice_id` | Self-reference pointing to the primary invoice |
| `o2c.account` | `o2c.payment` | `1 : 0..N` | `ON DELETE RESTRICT` | Accounts remit cash receipts |
| `o2c.payment` | `o2c.payment_allocation` | `1 : 1..N` | `ON DELETE RESTRICT` | Single payments may be split across multiple invoices |
| `o2c.invoice` | `o2c.payment_allocation` | `1 : 0..N` | `ON DELETE RESTRICT` | An invoice can be paid off across multiple allocations |
| `o2c.invoice` | `o2c.dispute` | `1 : 0..N` | `ON DELETE RESTRICT` | Invoices can receive one or more customer disputes |
| Operational Tables | `o2c.status_event` | `1 : 0..N` | Immutable ledger, trigger-maintained | Capture all historical state transitions |
| N/A | `gt.ground_truth` | Isolated | **Zero FKs to `o2c` schema** | Benchmark evaluation without feature leakage |
| Detector Rules | `analytics.detector_findings` | N/A | Dedicated findings table | Output of discrete detection rule executions |

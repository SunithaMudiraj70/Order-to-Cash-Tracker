# Data Dictionary: Order-to-Cash (O2C) Schema

This document details all tables, fields, constraints, types, and business descriptions across the Order-to-Cash schemas.

---

## 1. Schema: `o2c` (Operational)

### `o2c.account`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `account_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^ACC-[0-9]{6}$')` | Unique customer account ID |
| `name` | `TEXT` | `NOT NULL` | Legal corporate name |
| `segment` | `TEXT` | `NOT NULL` | Market segment (Enterprise, Mid-Market, SMB) |
| `region` | `TEXT` | `NOT NULL` | Operating geographical region (NA, EMEA, APAC, LATAM) |
| `credit_limit` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Maximum credit allowance in USD |
| `payment_terms_days` | `INTEGER` | `NOT NULL`, `DEFAULT 30`, `CHECK (>= 0)` | Contractual invoice payment term days |
| `status` | `TEXT` | `NOT NULL`, `DEFAULT 'ACTIVE'` | Operational status (ACTIVE, SUSPENDED, INACTIVE) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Record creation timestamp |
| `effective_from` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Timestamp from which account terms apply |
| `effective_to` | `TIMESTAMPTZ` | `NULL` | Deprecation timestamp (null if currently active) |

---

### `o2c.quote`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `quote_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^QTE-2026-[0-9]{6}$')` | Unique quote number |
| `account_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.account` | Target customer account |
| `status` | `o2c.quote_status` | `NOT NULL`, `DEFAULT 'DRAFT'` | State: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED |
| `quote_date` | `DATE` | `NOT NULL`, `DEFAULT CURRENT_DATE` | Date quote was issued |
| `valid_until` | `DATE` | `NOT NULL`, `CHECK (>= quote_date)` | Expiration date of quote |
| `total_amount` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Aggregate quote value |
| `currency` | `CHAR(3)` | `NOT NULL`, `DEFAULT 'USD'` | ISO 4217 currency code |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

### `o2c.quote_line`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `quote_line_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^QL-[0-9]{6}$')` | Unique line identifier |
| `quote_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.quote`, `UNIQUE(quote_id, line_no)` | Associated quote ID |
| `line_no` | `INTEGER` | `NOT NULL`, `CHECK (> 0)` | Position sequence in quote |
| `sku` | `TEXT` | `NOT NULL` | Product SKU identifier |
| `description` | `TEXT` | `NOT NULL` | Item description |
| `qty` | `NUMERIC(12,3)` | `NOT NULL`, `CHECK (> 0)` | Quoted item quantity |
| `unit_price` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Price per unit |
| `discount_pct` | `NUMERIC(5,2)` | `NOT NULL`, `CHECK (0..100)` | Contract discount percentage |
| `line_total` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Calculated total for line |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

### `o2c.sales_order`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `order_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^SO-2026-[0-9]{6}$')` | Unique order identifier |
| `quote_id` | `VARCHAR(32)` | `NULL`, `UNIQUE`, `FK -> o2c.quote` | Converted originating quote |
| `account_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.account` | Customer account placing order |
| `status` | `o2c.order_status`| `NOT NULL`, `DEFAULT 'CREATED'` | CREATED, CONFIRMED, PARTIALLY_FULFILLED, FULFILLED, INVOICED, PAID, CLOSED, CANCELLED |
| `order_date` | `DATE` | `NOT NULL`, `DEFAULT CURRENT_DATE` | Booking date |
| `promised_date` | `DATE` | `NOT NULL`, `CHECK (>= order_date)` | Customer promised fulfillment SLA |
| `total_amount` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Total committed order value |
| `currency` | `CHAR(3)` | `NOT NULL`, `DEFAULT 'USD'` | Currency |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | System order creation timestamp |

---

### `o2c.order_line`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `order_line_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^OL-[0-9]{6}$')` | Unique order line identifier |
| `order_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.sales_order`, `UNIQUE(order_id, line_no)` | Parent sales order |
| `quote_line_id` | `VARCHAR(32)` | `NULL`, `FK -> o2c.quote_line` | Originating quote line item |
| `line_no` | `INTEGER` | `NOT NULL`, `CHECK (> 0)` | Line number index |
| `sku` | `TEXT` | `NOT NULL` | Product SKU |
| `ordered_qty` | `NUMERIC(12,3)` | `NOT NULL`, `CHECK (> 0)` | Quantity ordered |
| `unit_price` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Price per unit |
| `line_total` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Total line amount |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

### `o2c.shipment`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `shipment_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^SHP-2026-[0-9]{6}$')` | Unique shipment number |
| `order_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.sales_order` | Parent sales order |
| `status` | `o2c.shipment_status` | `NOT NULL`, `DEFAULT 'PLANNED'` | PLANNED, SHIPPED, DELIVERED, CANCELLED |
| `ship_date` | `DATE` | `NULL` | Carrier dispatch date |
| `delivered_date` | `DATE` | `NULL`, `CHECK (>= ship_date)` | Customer delivery date |
| `carrier` | `TEXT` | `NULL` | Freight carrier |
| `tracking_number` | `TEXT` | `NULL` | Waybill / tracking number |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Record creation timestamp |

---

### `o2c.shipment_line`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `shipment_line_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^SL-[0-9]{6}$')` | Bridge record ID |
| `shipment_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.shipment` | Parent shipment ID |
| `order_line_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.order_line` | Order line fulfilled |
| `shipped_qty` | `NUMERIC(12,3)` | `NOT NULL`, `CHECK (> 0)` | Quantity included in shipment |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

### `o2c.invoice`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `invoice_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^INV-2026-[0-9]{6}$')` | Unique billing invoice number |
| `order_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.sales_order` | Associated sales order |
| `account_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.account` | Invoiced customer account |
| `status` | `o2c.invoice_status` | `NOT NULL`, `DEFAULT 'DRAFT'` | DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, DISPUTED, VOID |
| `invoice_date` | `DATE` | `NOT NULL`, `DEFAULT CURRENT_DATE` | Date billed |
| `due_date` | `DATE` | `NOT NULL`, `CHECK (>= invoice_date)` | Settlement due date |
| `subtotal` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Pre-tax billing amount |
| `tax` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Tax amount |
| `total_amount` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Grand total amount |
| `paid_amount` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Total settled cash to date |
| `balance_amount` | `NUMERIC(14,2)` | `NOT NULL` | Outstanding balance |
| `currency` | `CHAR(3)` | `NOT NULL`, `DEFAULT 'USD'` | Currency |
| `dup_of_invoice_id`| `VARCHAR(32)` | `NULL`, `FK -> o2c.invoice` | Pointer to duplicate parent invoice (if duplicate) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

### `o2c.invoice_line`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `invoice_line_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^IL-[0-9]{6}$')` | Unique invoice line identifier |
| `invoice_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.invoice` | Parent invoice ID |
| `order_line_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.order_line` | Associated order line |
| `billed_qty` | `NUMERIC(12,3)` | `NOT NULL`, `CHECK (> 0)` | Quantity invoiced |
| `unit_price` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Unit billing price |
| `line_total` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Line subtotal |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

### `o2c.payment`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `payment_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^PAY-2026-[0-9]{6}$')` | Unique cash receipt identifier |
| `account_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.account` | Remitting customer account |
| `status` | `o2c.payment_status` | `NOT NULL`, `DEFAULT 'RECEIVED'` | RECEIVED, ALLOCATED, PARTIALLY_ALLOCATED, REVERSED |
| `payment_date` | `DATE` | `NOT NULL`, `DEFAULT CURRENT_DATE` | Remittance date |
| `amount` | `NUMERIC(14,2)` | `NOT NULL`, `CHECK (> 0)` | Total payment received |
| `currency` | `CHAR(3)` | `NOT NULL`, `DEFAULT 'USD'` | Currency |
| `method` | `TEXT` | `NOT NULL` | Payment channel (ACH, WIRE, CHECK, CARD) |
| `reference_no` | `TEXT` | `NOT NULL` | Bank transaction reference |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Timestamp receipt logged |

---

### `o2c.payment_allocation`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `allocation_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^ALC-[0-9]{6}$')` | Bridge allocation identifier |
| `payment_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.payment` | Parent cash receipt |
| `invoice_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.invoice` | Target invoice credited |
| `allocated_amount`| `NUMERIC(14,2)` | `NOT NULL`, `CHECK (> 0)` | Cash allocated to invoice |
| `allocated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Timestamp allocation occurred |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

### `o2c.dispute`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `dispute_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^DSP-2026-[0-9]{6}$')` | Unique claim identifier |
| `invoice_id` | `VARCHAR(32)` | `NOT NULL`, `FK -> o2c.invoice` | Disputed invoice |
| `status` | `o2c.dispute_status` | `NOT NULL`, `DEFAULT 'OPEN'` | OPEN, UNDER_REVIEW, RESOLVED_CREDIT, RESOLVED_REJECTED, CLOSED |
| `opened_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Ticket filing timestamp |
| `resolved_at` | `TIMESTAMPTZ` | `NULL`, `CHECK (>= opened_at)` | Resolution timestamp |
| `disputed_amount`| `NUMERIC(14,2)` | `NOT NULL`, `CHECK (>= 0)` | Disputed sum claimed by customer |
| `reason_code` | `TEXT` | `NOT NULL` | Reason code (PRICING, DAMAGED, NOT_RECEIVED) |
| `credit_amount` | `NUMERIC(14,2)` | `NOT NULL`, `DEFAULT 0.00` | Conceded credit memo amount |
| `notes` | `TEXT` | `NULL` | Internal investigation summary |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

### `o2c.status_event`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `event_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^EVT-[0-9]{6,}$')` | Append-only event ID |
| `entity_type` | `o2c.entity_type` | `NOT NULL` | Entity category (QUOTE, ORDER, etc.) |
| `entity_id` | `VARCHAR(32)` | `NOT NULL` | Polymorphic ID of modified entity |
| `from_status` | `TEXT` | `NULL` | Previous lifecycle state (null if initial) |
| `to_status` | `TEXT` | `NOT NULL` | New lifecycle state |
| `event_ts` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Moment state transition occurred |
| `actor` | `TEXT` | `NOT NULL`, `DEFAULT 'system'` | User ID or trigger origin executing change |
| `source` | `TEXT` | `NOT NULL`, `DEFAULT 'o2c_service'` | Service origin |
| `payload` | `JSONB` | `NOT NULL`, `DEFAULT '{}'` | Metadata snapshot |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Creation timestamp |

---

## 2. Schema: `gt` (Ground Truth)

### `gt.ground_truth`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `gt_id` | `VARCHAR(32)` | `PRIMARY KEY`, `CHECK (~ '^GT-[0-9]{6}$')` | Unique ground-truth identifier |
| `entity_type` | `o2c.entity_type` | `NOT NULL` | Entity type |
| `entity_id` | `VARCHAR(32)` | `NOT NULL` (NO FK to `o2c.*`) | Unconstrained target entity ID |
| `issue_type` | `o2c.issue_type` | `NOT NULL` | Known injected anomaly category |
| `expected_decision`| `TEXT` | `NOT NULL` | Correct evaluation decision expected |
| `injected_rule` | `TEXT` | `NOT NULL` | Generator injection rule code |
| `notes` | `TEXT` | `NULL` | Mathematical or contextual details |
| `severity` | `TEXT` | `NOT NULL`, `DEFAULT 'HIGH'` | Severity level (LOW, MEDIUM, HIGH, CRITICAL) |
| `detected` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Verified by detection pipeline |
| `detected_at` | `TIMESTAMPTZ` | `NULL` | Timestamp detector tagged anomaly |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Benchmark creation timestamp |


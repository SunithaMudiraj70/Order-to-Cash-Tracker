-- ==============================================================================
-- Migration: 0003_transaction_tables.sql
-- Description: Define downstream operational transaction tables:
--              shipment, shipment_line, invoice, invoice_line, payment,
--              payment_allocation, and dispute.
-- Concern: Transactional Schemas and N:M Bridges
-- Idempotent: Yes
-- ==============================================================================

-- 1. SHIPMENT
CREATE TABLE IF NOT EXISTS o2c.shipment (
  shipment_id VARCHAR(32) PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL REFERENCES o2c.sales_order(order_id) ON DELETE RESTRICT,
  status o2c.shipment_status NOT NULL DEFAULT 'PLANNED',
  ship_date DATE NULL,
  delivered_date DATE NULL,
  carrier TEXT NULL,
  tracking_number TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_shipment_id_format CHECK (shipment_id ~ '^SHP-2026-[0-9]{6}$'),
  CONSTRAINT chk_shipment_delivery_after_ship CHECK (delivered_date IS NULL OR ship_date IS NULL OR delivered_date >= ship_date)
);

COMMENT ON TABLE o2c.shipment IS 'Logistics fulfillments fulfilling sales orders (1:N with Shipment Lines)';
COMMENT ON COLUMN o2c.shipment.shipment_id IS 'Unique shipment identifier formatted as SHP-2026-XXXXXX';

-- 2. SHIPMENT_LINE (Bridge: shipment <-> order_line, N:M)
CREATE TABLE IF NOT EXISTS o2c.shipment_line (
  shipment_line_id VARCHAR(32) PRIMARY KEY,
  shipment_id VARCHAR(32) NOT NULL REFERENCES o2c.shipment(shipment_id) ON DELETE RESTRICT,
  order_line_id VARCHAR(32) NOT NULL REFERENCES o2c.order_line(order_line_id) ON DELETE RESTRICT,
  shipped_qty NUMERIC(12,3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_shipment_line_id_format CHECK (shipment_line_id ~ '^SL-[0-9]{6}$'),
  CONSTRAINT chk_shipment_line_qty_positive CHECK (shipped_qty > 0),
  CONSTRAINT uq_shipment_line_pair UNIQUE (shipment_id, order_line_id)
);

COMMENT ON TABLE o2c.shipment_line IS 'Bridge table mapping shipments to order lines (N:M between Shipments and Order Lines)';
COMMENT ON COLUMN o2c.shipment_line.shipment_line_id IS 'Unique shipment line identifier formatted as SL-XXXXXX';

-- 3. INVOICE
CREATE TABLE IF NOT EXISTS o2c.invoice (
  invoice_id VARCHAR(32) PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL REFERENCES o2c.sales_order(order_id) ON DELETE RESTRICT,
  account_id VARCHAR(32) NOT NULL REFERENCES o2c.account(account_id) ON DELETE RESTRICT,
  status o2c.invoice_status NOT NULL DEFAULT 'DRAFT',
  invoice_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  due_date DATE NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  balance_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  dup_of_invoice_id VARCHAR(32) NULL REFERENCES o2c.invoice(invoice_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_invoice_id_format CHECK (invoice_id ~ '^INV-2026-[0-9]{6}$'),
  CONSTRAINT chk_invoice_due_window CHECK (due_date >= invoice_date),
  CONSTRAINT chk_invoice_subtotal_non_negative CHECK (subtotal >= 0),
  CONSTRAINT chk_invoice_tax_non_negative CHECK (tax >= 0),
  CONSTRAINT chk_invoice_total_non_negative CHECK (total_amount >= 0),
  CONSTRAINT chk_invoice_paid_non_negative CHECK (paid_amount >= 0)
);

COMMENT ON TABLE o2c.invoice IS 'Billing invoices issued to accounts against sales orders (1:N with Invoice Lines, Payment Allocations, Disputes)';
COMMENT ON COLUMN o2c.invoice.invoice_id IS 'Unique invoice identifier formatted as INV-2026-XXXXXX';
COMMENT ON COLUMN o2c.invoice.dup_of_invoice_id IS 'Self-referencing pointer to the original invoice if this record is a duplicate';

-- 4. INVOICE_LINE
CREATE TABLE IF NOT EXISTS o2c.invoice_line (
  invoice_line_id VARCHAR(32) PRIMARY KEY,
  invoice_id VARCHAR(32) NOT NULL REFERENCES o2c.invoice(invoice_id) ON DELETE RESTRICT,
  order_line_id VARCHAR(32) NOT NULL REFERENCES o2c.order_line(order_line_id) ON DELETE RESTRICT,
  billed_qty NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL,
  line_total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_invoice_line_id_format CHECK (invoice_line_id ~ '^IL-[0-9]{6}$'),
  CONSTRAINT chk_invoice_line_qty_positive CHECK (billed_qty > 0),
  CONSTRAINT chk_invoice_line_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_invoice_line_total CHECK (line_total >= 0)
);

COMMENT ON TABLE o2c.invoice_line IS 'Billed items on an invoice tied back to order lines (N:1 with Invoice, N:1 with Order Line)';
COMMENT ON COLUMN o2c.invoice_line.invoice_line_id IS 'Unique invoice line identifier formatted as IL-XXXXXX';

-- 5. PAYMENT
CREATE TABLE IF NOT EXISTS o2c.payment (
  payment_id VARCHAR(32) PRIMARY KEY,
  account_id VARCHAR(32) NOT NULL REFERENCES o2c.account(account_id) ON DELETE RESTRICT,
  status o2c.payment_status NOT NULL DEFAULT 'RECEIVED',
  payment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  amount NUMERIC(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL,
  reference_no TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_payment_id_format CHECK (payment_id ~ '^PAY-2026-[0-9]{6}$'),
  CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

COMMENT ON TABLE o2c.payment IS 'Cash receipts and remittances received from customer accounts (1:N with Payment Allocations)';
COMMENT ON COLUMN o2c.payment.payment_id IS 'Unique payment identifier formatted as PAY-2026-XXXXXX';

-- 6. PAYMENT_ALLOCATION (Bridge: payment <-> invoice, N:M)
CREATE TABLE IF NOT EXISTS o2c.payment_allocation (
  allocation_id VARCHAR(32) PRIMARY KEY,
  payment_id VARCHAR(32) NOT NULL REFERENCES o2c.payment(payment_id) ON DELETE RESTRICT,
  invoice_id VARCHAR(32) NOT NULL REFERENCES o2c.invoice(invoice_id) ON DELETE RESTRICT,
  allocated_amount NUMERIC(14,2) NOT NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_allocation_id_format CHECK (allocation_id ~ '^ALC-[0-9]{6}$'),
  CONSTRAINT chk_allocation_amount_positive CHECK (allocated_amount > 0)
);

COMMENT ON TABLE o2c.payment_allocation IS 'Bridge allocating payment receipts across specific invoices (N:M between Payments and Invoices)';
COMMENT ON COLUMN o2c.payment_allocation.allocation_id IS 'Unique allocation identifier formatted as ALC-XXXXXX';

-- 7. DISPUTE
CREATE TABLE IF NOT EXISTS o2c.dispute (
  dispute_id VARCHAR(32) PRIMARY KEY,
  invoice_id VARCHAR(32) NOT NULL REFERENCES o2c.invoice(invoice_id) ON DELETE RESTRICT,
  status o2c.dispute_status NOT NULL DEFAULT 'OPEN',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  resolved_at TIMESTAMPTZ NULL,
  disputed_amount NUMERIC(14,2) NOT NULL,
  reason_code TEXT NOT NULL,
  credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_dispute_id_format CHECK (dispute_id ~ '^DSP-2026-[0-9]{6}$'),
  CONSTRAINT chk_dispute_amount_non_negative CHECK (disputed_amount >= 0),
  CONSTRAINT chk_dispute_credit_non_negative CHECK (credit_amount >= 0),
  CONSTRAINT chk_dispute_resolved_window CHECK (resolved_at IS NULL OR resolved_at >= opened_at)
);

COMMENT ON TABLE o2c.dispute IS 'Claims or billing disputes filed against an invoice (N:1 with Invoice)';
COMMENT ON COLUMN o2c.dispute.dispute_id IS 'Unique dispute identifier formatted as DSP-2026-XXXXXX';


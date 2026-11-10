-- ==============================================================================
-- Migration: 0002_master_tables.sql
-- Description: Define Order-to-Cash master tables: account, quote, quote_line,
--              sales_order, order_line with strict ID formats, types, and constraints.
-- Concern: Master Data Schema
-- Idempotent: Yes
-- ==============================================================================

-- 1. ACCOUNT
CREATE TABLE IF NOT EXISTS o2c.account (
  account_id VARCHAR(32) PRIMARY KEY,
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  region TEXT NOT NULL,
  credit_limit NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  effective_to TIMESTAMPTZ NULL,

  CONSTRAINT chk_account_id_format CHECK (account_id ~ '^ACC-[0-9]{6}$'),
  CONSTRAINT chk_account_credit_limit CHECK (credit_limit >= 0),
  CONSTRAINT chk_account_terms CHECK (payment_terms_days >= 0),
  CONSTRAINT chk_account_effective_window CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE o2c.account IS 'Customer master records governing credit terms and hierarchy (1:N with Quotes, Orders, Invoices, Payments)';
COMMENT ON COLUMN o2c.account.account_id IS 'Unique account identifier formatted as ACC-XXXXXX';
COMMENT ON COLUMN o2c.account.credit_limit IS 'Total allowable outstanding balance in USD';

-- 2. QUOTE
CREATE TABLE IF NOT EXISTS o2c.quote (
  quote_id VARCHAR(32) PRIMARY KEY,
  account_id VARCHAR(32) NOT NULL REFERENCES o2c.account(account_id) ON DELETE RESTRICT,
  status o2c.quote_status NOT NULL DEFAULT 'DRAFT',
  quote_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  valid_until DATE NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_quote_id_format CHECK (quote_id ~ '^QTE-2026-[0-9]{6}$'),
  CONSTRAINT chk_quote_total_non_negative CHECK (total_amount >= 0),
  CONSTRAINT chk_quote_validity_window CHECK (valid_until >= quote_date)
);

COMMENT ON TABLE o2c.quote IS 'Sales quotes issued to accounts (1:N with Quote Lines, 1:0..1 with Sales Orders)';
COMMENT ON COLUMN o2c.quote.quote_id IS 'Unique quote identifier formatted as QTE-2026-XXXXXX';

-- 3. QUOTE_LINE
CREATE TABLE IF NOT EXISTS o2c.quote_line (
  quote_line_id VARCHAR(32) PRIMARY KEY,
  quote_id VARCHAR(32) NOT NULL REFERENCES o2c.quote(quote_id) ON DELETE RESTRICT,
  line_no INTEGER NOT NULL,
  sku TEXT NOT NULL,
  description TEXT NOT NULL,
  qty NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_quote_line_id_format CHECK (quote_line_id ~ '^QL-[0-9]{6}$'),
  CONSTRAINT chk_quote_line_no_positive CHECK (line_no > 0),
  CONSTRAINT chk_quote_line_qty_positive CHECK (qty > 0),
  CONSTRAINT chk_quote_line_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_quote_line_discount CHECK (discount_pct >= 0 AND discount_pct <= 100),
  CONSTRAINT chk_quote_line_total CHECK (line_total >= 0),
  CONSTRAINT uq_quote_line_quote_id_line_no UNIQUE (quote_id, line_no)
);

COMMENT ON TABLE o2c.quote_line IS 'Detailed line items of a quote (N:1 with Quote, 1:0..1 with Order Line)';
COMMENT ON COLUMN o2c.quote_line.quote_line_id IS 'Unique quote line identifier formatted as QL-XXXXXX';

-- 4. SALES_ORDER
CREATE TABLE IF NOT EXISTS o2c.sales_order (
  order_id VARCHAR(32) PRIMARY KEY,
  quote_id VARCHAR(32) UNIQUE REFERENCES o2c.quote(quote_id) ON DELETE RESTRICT,
  account_id VARCHAR(32) NOT NULL REFERENCES o2c.account(account_id) ON DELETE RESTRICT,
  status o2c.order_status NOT NULL DEFAULT 'CREATED',
  order_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  promised_date DATE NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_order_id_format CHECK (order_id ~ '^SO-2026-[0-9]{6}$'),
  CONSTRAINT chk_order_total_non_negative CHECK (total_amount >= 0),
  CONSTRAINT chk_order_promised_window CHECK (promised_date >= order_date)
);

COMMENT ON TABLE o2c.sales_order IS 'Commercial customer sales orders (1:N with Order Lines, 1:N with Shipments, 1:N with Invoices)';
COMMENT ON COLUMN o2c.sales_order.order_id IS 'Unique sales order identifier formatted as SO-2026-XXXXXX';

-- 5. ORDER_LINE
CREATE TABLE IF NOT EXISTS o2c.order_line (
  order_line_id VARCHAR(32) PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL REFERENCES o2c.sales_order(order_id) ON DELETE RESTRICT,
  quote_line_id VARCHAR(32) NULL REFERENCES o2c.quote_line(quote_line_id) ON DELETE RESTRICT,
  line_no INTEGER NOT NULL,
  sku TEXT NOT NULL,
  ordered_qty NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL,
  line_total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_order_line_id_format CHECK (order_line_id ~ '^OL-[0-9]{6}$'),
  CONSTRAINT chk_order_line_no_positive CHECK (line_no > 0),
  CONSTRAINT chk_order_line_qty_positive CHECK (ordered_qty > 0),
  CONSTRAINT chk_order_line_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_order_line_total CHECK (line_total >= 0),
  CONSTRAINT uq_order_line_order_id_line_no UNIQUE (order_id, line_no)
);

COMMENT ON TABLE o2c.order_line IS 'Line items within a sales order (N:1 with Sales Order, 1:N with Shipment Lines, 1:N with Invoice Lines)';
COMMENT ON COLUMN o2c.order_line.order_line_id IS 'Unique order line identifier formatted as OL-XXXXXX';


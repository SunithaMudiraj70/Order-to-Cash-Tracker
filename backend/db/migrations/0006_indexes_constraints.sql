-- ==============================================================================
-- Migration: 0006_indexes_constraints.sql
-- Description: Foreign key indexes, performance partial indexes for open/overdue
--              invoices and active orders, plus additional consistency constraints.
-- Concern: Indexes and Performance Optimization
-- Idempotent: Yes
-- ==============================================================================

-- 1. FOREIGN KEY INDEXES (OPERATIONAL TABLES)

-- Quote & Quote Line
CREATE INDEX IF NOT EXISTS idx_quote_account_id ON o2c.quote (account_id);
CREATE INDEX IF NOT EXISTS idx_quote_status ON o2c.quote (status);
CREATE INDEX IF NOT EXISTS idx_quote_line_quote_id ON o2c.quote_line (quote_id);

-- Sales Order & Order Line
CREATE INDEX IF NOT EXISTS idx_sales_order_account_id ON o2c.sales_order (account_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_quote_id ON o2c.sales_order (quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_status ON o2c.sales_order (status);
CREATE INDEX IF NOT EXISTS idx_order_line_order_id ON o2c.order_line (order_id);
CREATE INDEX IF NOT EXISTS idx_order_line_quote_line_id ON o2c.order_line (quote_line_id);

-- Shipment & Shipment Line
CREATE INDEX IF NOT EXISTS idx_shipment_order_id ON o2c.shipment (order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_status ON o2c.shipment (status);
CREATE INDEX IF NOT EXISTS idx_shipment_line_shipment_id ON o2c.shipment_line (shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_line_order_line_id ON o2c.shipment_line (order_line_id);

-- Invoice & Invoice Line
CREATE INDEX IF NOT EXISTS idx_invoice_order_id ON o2c.invoice (order_id);
CREATE INDEX IF NOT EXISTS idx_invoice_account_id ON o2c.invoice (account_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON o2c.invoice (status);
CREATE INDEX IF NOT EXISTS idx_invoice_line_invoice_id ON o2c.invoice_line (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_order_line_id ON o2c.invoice_line (order_line_id);

-- Payment & Allocation
CREATE INDEX IF NOT EXISTS idx_payment_account_id ON o2c.payment (account_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON o2c.payment (status);
CREATE INDEX IF NOT EXISTS idx_payment_alloc_payment_id ON o2c.payment_allocation (payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_alloc_invoice_id ON o2c.payment_allocation (invoice_id);

-- Dispute
CREATE INDEX IF NOT EXISTS idx_dispute_invoice_id ON o2c.dispute (invoice_id);
CREATE INDEX IF NOT EXISTS idx_dispute_status ON o2c.dispute (status);

-- Status Event Ledger
CREATE INDEX IF NOT EXISTS idx_status_event_lookup ON o2c.status_event (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_status_event_ts ON o2c.status_event (event_ts DESC);

-- Ground Truth Indexes
CREATE INDEX IF NOT EXISTS idx_gt_lookup ON gt.ground_truth (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_gt_issue_type ON gt.ground_truth (issue_type);
CREATE INDEX IF NOT EXISTS idx_gt_detected ON gt.ground_truth (detected);

-- 2. PARTIAL INDEXES FOR TARGETED PERFORMANCE

-- Invoices currently outstanding / open
CREATE INDEX IF NOT EXISTS idx_invoice_open_receivables
  ON o2c.invoice (account_id, due_date, balance_amount)
  WHERE status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE');

-- Overdue invoices targeting aging & collections pipelines
CREATE INDEX IF NOT EXISTS idx_invoice_overdue_aging
  ON o2c.invoice (due_date, balance_amount)
  WHERE status = 'OVERDUE' OR (status IN ('ISSUED', 'PARTIALLY_PAID') AND due_date < CURRENT_DATE);

-- Invoices flagged as duplicate
CREATE INDEX IF NOT EXISTS idx_invoice_duplicate_pointer
  ON o2c.invoice (dup_of_invoice_id)
  WHERE dup_of_invoice_id IS NOT NULL;

-- Active unresolved customer disputes
CREATE INDEX IF NOT EXISTS idx_dispute_unresolved
  ON o2c.dispute (invoice_id, opened_at)
  WHERE status IN ('OPEN', 'UNDER_REVIEW');

-- Active / in-flight sales orders pending fulfillment or invoicing
CREATE INDEX IF NOT EXISTS idx_sales_order_inflight
  ON o2c.sales_order (account_id, order_date)
  WHERE status NOT IN ('PAID', 'CLOSED', 'CANCELLED');

-- In-transit shipments
CREATE INDEX IF NOT EXISTS idx_shipment_in_transit
  ON o2c.shipment (order_id, ship_date)
  WHERE status IN ('PLANNED', 'SHIPPED');


-- ==============================================================================
-- Migration: 0013_fix_views_fanout_and_dates.sql
-- Description: Eliminate view fan-out, replace dynamic now() with fixed date,
--              and create exception triage audit table.
-- Concern: Analytical integrity and triage management
-- Idempotent: Yes
-- ==============================================================================

-- 1. PARAMETERIZED AGING FUNCTION WITH FIXED DEFAULT CUTOFF
CREATE OR REPLACE FUNCTION analytics.fn_aging(p_cutoff DATE DEFAULT DATE '2026-10-31')
RETURNS TABLE (
  account_id VARCHAR(32),
  account_name TEXT,
  segment TEXT,
  total_invoices BIGINT,
  total_outstanding_balance NUMERIC(14,2),
  current_balance NUMERIC(14,2),
  bucket_1_30_days NUMERIC(14,2),
  bucket_31_60_days NUMERIC(14,2),
  bucket_61_90_days NUMERIC(14,2),
  bucket_91_plus_days NUMERIC(14,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.account_id,
    a.name AS account_name,
    a.segment,
    COUNT(i.invoice_id) AS total_invoices,
    COALESCE(SUM(i.balance_amount), 0.00)::NUMERIC(14,2) AS total_outstanding_balance,
    COALESCE(SUM(CASE WHEN i.due_date >= p_cutoff THEN i.balance_amount ELSE 0 END), 0.00)::NUMERIC(14,2) AS current_balance,
    COALESCE(SUM(CASE WHEN i.due_date < p_cutoff AND i.due_date >= p_cutoff - INTERVAL '30 days' THEN i.balance_amount ELSE 0 END), 0.00)::NUMERIC(14,2) AS bucket_1_30_days,
    COALESCE(SUM(CASE WHEN i.due_date < p_cutoff - INTERVAL '30 days' AND i.due_date >= p_cutoff - INTERVAL '60 days' THEN i.balance_amount ELSE 0 END), 0.00)::NUMERIC(14,2) AS bucket_31_60_days,
    COALESCE(SUM(CASE WHEN i.due_date < p_cutoff - INTERVAL '60 days' AND i.due_date >= p_cutoff - INTERVAL '90 days' THEN i.balance_amount ELSE 0 END), 0.00)::NUMERIC(14,2) AS bucket_61_90_days,
    COALESCE(SUM(CASE WHEN i.due_date < p_cutoff - INTERVAL '90 days' THEN i.balance_amount ELSE 0 END), 0.00)::NUMERIC(14,2) AS bucket_91_plus_days
  FROM o2c.invoice i
  JOIN o2c.account a ON i.account_id = a.account_id
  WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
  GROUP BY i.account_id, a.name, a.segment;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE VIEW analytics.v_ar_aging_summary AS
SELECT * FROM analytics.fn_aging(DATE '2026-10-31');

-- 2. REVENUE LEAKAGE VIEW (Aggregating order lines and shipment lines independently)
CREATE OR REPLACE VIEW analytics.v_revenue_leakage AS
WITH order_totals AS (
  SELECT
    order_id,
    COALESCE(SUM(line_total), 0.00) AS total_ordered_amount
  FROM o2c.order_line
  GROUP BY order_id
),
shipment_totals AS (
  SELECT
    ol.order_id,
    COALESCE(SUM(sl.shipped_qty * ol.unit_price), 0.00) AS total_fulfilled_amount
  FROM o2c.shipment_line sl
  JOIN o2c.order_line ol ON sl.order_line_id = ol.order_line_id
  GROUP BY ol.order_id
),
billing_totals AS (
  SELECT
    i.order_id,
    COALESCE(SUM(i.total_amount), 0.00) AS total_billed_amount,
    COALESCE(SUM(i.paid_amount), 0.00) AS total_paid_amount,
    COALESCE(SUM(i.balance_amount), 0.00) AS total_unpaid_amount,
    COUNT(CASE WHEN i.dup_of_invoice_id IS NOT NULL THEN 1 END) AS duplicate_invoice_count
  FROM o2c.invoice i
  GROUP BY i.order_id
)
SELECT
  o.order_id,
  o.account_id,
  o.status AS order_status,
  COALESCE(ot.total_ordered_amount, 0.00) AS total_ordered_amount,
  COALESCE(st.total_fulfilled_amount, 0.00) AS total_fulfilled_amount,
  COALESCE(bt.total_billed_amount, 0.00) AS total_billed_amount,
  COALESCE(bt.total_paid_amount, 0.00) AS total_paid_amount,
  COALESCE(bt.total_unpaid_amount, 0.00) AS total_unpaid_amount,
  GREATEST(COALESCE(bt.total_billed_amount, 0.00) - COALESCE(st.total_fulfilled_amount, 0.00), 0.00) AS overbilled_amount,
  GREATEST(COALESCE(st.total_fulfilled_amount, 0.00) - COALESCE(bt.total_billed_amount, 0.00), 0.00) AS underbilled_amount,
  CASE WHEN o.status = 'CLOSED' AND COALESCE(bt.total_unpaid_amount, 0.00) > 0 THEN bt.total_unpaid_amount ELSE 0.00 END AS unpaid_closed_leakage,
  COALESCE(bt.duplicate_invoice_count, 0) AS duplicate_invoice_count
FROM o2c.sales_order o
LEFT JOIN order_totals ot ON o.order_id = ot.order_id
LEFT JOIN shipment_totals st ON o.order_id = st.order_id
LEFT JOIN billing_totals bt ON o.order_id = bt.order_id;

-- 3. CYCLE TIME DELAYS VIEW (1 row per order, zero fan-out)
CREATE OR REPLACE VIEW analytics.v_cycle_time_delays AS
WITH order_shipments AS (
  SELECT
    order_id,
    MIN(ship_date) AS min_ship_date,
    MAX(ship_date) AS max_ship_date
  FROM o2c.shipment
  GROUP BY order_id
),
order_invoices AS (
  SELECT
    order_id,
    MIN(invoice_date) AS min_invoice_date,
    MAX(invoice_date) AS max_invoice_date,
    MAX(due_date) AS max_due_date
  FROM o2c.invoice
  WHERE dup_of_invoice_id IS NULL
  GROUP BY order_id
),
order_payments AS (
  SELECT
    i.order_id,
    MIN(p.payment_date) AS min_payment_date,
    MAX(p.payment_date) AS max_payment_date
  FROM o2c.invoice i
  JOIN o2c.payment_allocation pa ON i.invoice_id = pa.invoice_id
  JOIN o2c.payment p ON pa.payment_id = p.payment_id
  WHERE i.dup_of_invoice_id IS NULL
  GROUP BY i.order_id
)
SELECT
  o.order_id,
  o.account_id,
  o.order_date,
  o.promised_date,
  os.min_ship_date AS ship_date,
  oi.min_invoice_date AS invoice_date,
  op.max_payment_date AS payment_date,
  (o.order_date - q.quote_date) AS quote_to_order_days,
  (os.min_ship_date - o.order_date) AS order_to_ship_days,
  (oi.min_invoice_date - os.min_ship_date) AS ship_to_invoice_days,
  (op.max_payment_date - oi.min_invoice_date) AS invoice_to_pay_days,
  CASE WHEN os.max_ship_date > o.promised_date THEN true ELSE false END AS is_delivery_sla_breached,
  CASE WHEN (os.min_ship_date - o.order_date) > 7 THEN true ELSE false END AS is_fulfillment_delayed,
  CASE WHEN (oi.min_invoice_date - os.min_ship_date) > 3 THEN true ELSE false END AS is_billing_delayed,
  CASE WHEN op.max_payment_date > oi.max_due_date THEN true ELSE false END AS is_payment_overdue
FROM o2c.sales_order o
LEFT JOIN o2c.quote q ON o.quote_id = q.quote_id
LEFT JOIN order_shipments os ON o.order_id = os.order_id
LEFT JOIN order_invoices oi ON o.order_id = oi.order_id
LEFT JOIN order_payments op ON o.order_id = op.order_id;

-- 4. EXCEPTION TRIAGE AUDIT TABLE
CREATE TABLE IF NOT EXISTS analytics.exception_triage (
  triage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE')),
  note TEXT,
  actor VARCHAR(128) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exception_triage_finding_id ON analytics.exception_triage (finding_id);
ALTER TABLE analytics.exception_triage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY exception_triage_all_access ON analytics.exception_triage
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. GRANTS
GRANT EXECUTE ON FUNCTION analytics.fn_aging(DATE) TO authenticated, anon;
GRANT SELECT ON analytics.v_ar_aging_summary TO authenticated, anon;
GRANT SELECT ON analytics.v_revenue_leakage TO authenticated, anon;
GRANT SELECT ON analytics.v_cycle_time_delays TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON analytics.exception_triage TO authenticated, anon;


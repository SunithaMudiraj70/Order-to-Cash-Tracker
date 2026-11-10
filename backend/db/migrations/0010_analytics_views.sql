-- ==============================================================================
-- Migration: 0010_analytics_views.sql
-- Description: Production analytical views and parameterized aging function.
-- Concern: Analytics Layer Implementation
-- Idempotent: Yes
-- ==============================================================================

-- Drop old stubs to allow clean column type adjustments
DROP VIEW IF EXISTS analytics.v_ar_aging_summary CASCADE;
DROP VIEW IF EXISTS analytics.v_revenue_leakage_summary CASCADE;
DROP VIEW IF EXISTS analytics.v_revenue_leakage CASCADE;
DROP VIEW IF EXISTS analytics.v_process_cycle_time_delays CASCADE;
DROP VIEW IF EXISTS analytics.v_cycle_time_delays CASCADE;
DROP VIEW IF EXISTS analytics.v_fulfillment_reconciliation CASCADE;
DROP VIEW IF EXISTS analytics.v_unallocated_payments CASCADE;
DROP VIEW IF EXISTS analytics.v_open_disputes_vs_receivables CASCADE;

-- 1. PARAMETERIZED AGING FUNCTION
CREATE OR REPLACE FUNCTION analytics.fn_aging(p_cutoff DATE DEFAULT CURRENT_DATE)
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

-- 2. AR AGING SUMMARY VIEW
CREATE OR REPLACE VIEW analytics.v_ar_aging_summary AS
SELECT * FROM analytics.fn_aging(CURRENT_DATE);

-- 3. REVENUE LEAKAGE VIEW (Billed vs Fulfilled vs Paid per Order)
CREATE OR REPLACE VIEW analytics.v_revenue_leakage AS
WITH order_fulfillments AS (
  SELECT
    ol.order_id,
    SUM(ol.line_total) AS total_ordered_amount,
    COALESCE(SUM(sl.shipped_qty * ol.unit_price), 0.00) AS total_fulfilled_amount
  FROM o2c.order_line ol
  LEFT JOIN o2c.shipment_line sl ON ol.order_line_id = sl.order_line_id
  GROUP BY ol.order_id
),
order_billings AS (
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
  COALESCE(f.total_ordered_amount, 0.00) AS total_ordered_amount,
  COALESCE(f.total_fulfilled_amount, 0.00) AS total_fulfilled_amount,
  COALESCE(b.total_billed_amount, 0.00) AS total_billed_amount,
  COALESCE(b.total_paid_amount, 0.00) AS total_paid_amount,
  COALESCE(b.total_unpaid_amount, 0.00) AS total_unpaid_amount,
  GREATEST(COALESCE(b.total_billed_amount, 0.00) - COALESCE(f.total_fulfilled_amount, 0.00), 0.00) AS overbilled_amount,
  GREATEST(COALESCE(f.total_fulfilled_amount, 0.00) - COALESCE(b.total_billed_amount, 0.00), 0.00) AS underbilled_amount,
  CASE WHEN o.status = 'CLOSED' AND COALESCE(b.total_unpaid_amount, 0.00) > 0 THEN b.total_unpaid_amount ELSE 0.00 END AS unpaid_closed_leakage,
  COALESCE(b.duplicate_invoice_count, 0) AS duplicate_invoice_count
FROM o2c.sales_order o
LEFT JOIN order_fulfillments f ON o.order_id = f.order_id
LEFT JOIN order_billings b ON o.order_id = b.order_id;

-- 4. CYCLE TIME DELAYS VIEW
CREATE OR REPLACE VIEW analytics.v_cycle_time_delays AS
SELECT
  o.order_id,
  o.account_id,
  o.order_date,
  o.promised_date,
  s.ship_date,
  i.invoice_date,
  p.payment_date,
  (o.order_date - q.quote_date) AS quote_to_order_days,
  (s.ship_date - o.order_date) AS order_to_ship_days,
  (i.invoice_date - s.ship_date) AS ship_to_invoice_days,
  (p.payment_date - i.invoice_date) AS invoice_to_pay_days,
  CASE WHEN s.ship_date > o.promised_date THEN true ELSE false END AS is_delivery_sla_breached,
  CASE WHEN (s.ship_date - o.order_date) > 7 THEN true ELSE false END AS is_fulfillment_delayed,
  CASE WHEN (i.invoice_date - s.ship_date) > 3 THEN true ELSE false END AS is_billing_delayed,
  CASE WHEN p.payment_date > i.due_date THEN true ELSE false END AS is_payment_overdue
FROM o2c.sales_order o
LEFT JOIN o2c.quote q ON o.quote_id = q.quote_id
LEFT JOIN o2c.shipment s ON o.order_id = s.order_id
LEFT JOIN o2c.invoice i ON o.order_id = i.order_id
LEFT JOIN o2c.payment_allocation pa ON i.invoice_id = pa.invoice_id
LEFT JOIN o2c.payment p ON pa.payment_id = p.payment_id;

-- 5. UNALLOCATED PAYMENTS VIEW
CREATE OR REPLACE VIEW analytics.v_unallocated_payments AS
SELECT
  p.payment_id,
  p.account_id,
  p.payment_date,
  p.amount AS payment_amount,
  COALESCE(SUM(pa.allocated_amount), 0.00) AS total_allocated_amount,
  (p.amount - COALESCE(SUM(pa.allocated_amount), 0.00)) AS unallocated_amount
FROM o2c.payment p
LEFT JOIN o2c.payment_allocation pa ON p.payment_id = pa.payment_id
GROUP BY p.payment_id, p.account_id, p.payment_date, p.amount
HAVING (p.amount - COALESCE(SUM(pa.allocated_amount), 0.00)) > 0.00;

-- 6. OPEN DISPUTES VS RECEIVABLES VIEW
CREATE OR REPLACE VIEW analytics.v_open_disputes_vs_receivables AS
SELECT
  d.dispute_id,
  d.invoice_id,
  d.status AS dispute_status,
  d.opened_at,
  d.disputed_amount,
  i.balance_amount AS invoice_balance,
  i.total_amount AS invoice_total,
  i.status AS invoice_status,
  a.account_id,
  a.name AS account_name,
  CASE WHEN i.balance_amount <= 0.00 THEN true ELSE false END AS is_dispute_against_paid_invoice
FROM o2c.dispute d
JOIN o2c.invoice i ON d.invoice_id = i.invoice_id
JOIN o2c.account a ON i.account_id = a.account_id
WHERE d.status IN ('OPEN', 'UNDER_REVIEW');

-- Permissions
GRANT EXECUTE ON FUNCTION analytics.fn_aging(DATE) TO authenticated, anon;
GRANT SELECT ON analytics.v_ar_aging_summary TO authenticated, anon;
GRANT SELECT ON analytics.v_revenue_leakage TO authenticated, anon;
GRANT SELECT ON analytics.v_cycle_time_delays TO authenticated, anon;
GRANT SELECT ON analytics.v_unallocated_payments TO authenticated, anon;
GRANT SELECT ON analytics.v_open_disputes_vs_receivables TO authenticated, anon;

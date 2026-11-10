-- ==============================================================================
-- Migration: 0009_analytics_views_stubs.sql
-- Description: Analytical placeholder views for AR Aging, Revenue Leakage,
--              Process Bottlenecks/Delays, and Fulfillment Gap Analysis.
-- Concern: Analytics Layer Stubs (Detailed implementation in Step 4)
-- Idempotent: Yes
-- ==============================================================================

-- 1. AR AGING SUMMARY VIEW (STUB)
-- TODO (Step 4): Implement aging buckets (current, 1-30, 31-60, 61-90, 91+) by account
CREATE OR REPLACE VIEW analytics.v_ar_aging_summary AS
SELECT
  i.account_id,
  a.name AS account_name,
  a.segment,
  COUNT(i.invoice_id) AS total_invoices,
  COALESCE(SUM(i.balance_amount), 0.00) AS total_outstanding_balance,
  COALESCE(SUM(CASE WHEN i.due_date >= CURRENT_DATE THEN i.balance_amount ELSE 0 END), 0.00) AS current_balance,
  COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN i.balance_amount ELSE 0 END), 0.00) AS bucket_1_30_days,
  COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE - INTERVAL '30 days' AND i.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN i.balance_amount ELSE 0 END), 0.00) AS bucket_31_60_days,
  COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE - INTERVAL '60 days' AND i.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN i.balance_amount ELSE 0 END), 0.00) AS bucket_61_90_days,
  COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE - INTERVAL '90 days' THEN i.balance_amount ELSE 0 END), 0.00) AS bucket_91_plus_days
FROM o2c.invoice i
JOIN o2c.account a ON i.account_id = a.account_id
WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
GROUP BY i.account_id, a.name, a.segment;

COMMENT ON VIEW analytics.v_ar_aging_summary IS 'Placeholder view aggregating accounts receivable aging across standard 30-day cohorts';

-- 2. REVENUE LEAKAGE DETECTION VIEW (STUB)
-- TODO (Step 4): Cross-correlate operational discrepancies (underbilled, duplicate invoices, unpaid closed orders)
CREATE OR REPLACE VIEW analytics.v_revenue_leakage_summary AS
SELECT
  'DUPLICATE_INVOICES' AS leakage_category,
  COUNT(i.invoice_id) AS incident_count,
  COALESCE(SUM(i.total_amount), 0.00) AS estimated_leakage_amount
FROM o2c.invoice i
WHERE i.dup_of_invoice_id IS NOT NULL
UNION ALL
SELECT
  'UNPAID_CLOSED_ORDERS' AS leakage_category,
  COUNT(o.order_id) AS incident_count,
  COALESCE(SUM(o.total_amount), 0.00) AS estimated_leakage_amount
FROM o2c.sales_order o
WHERE o.status = 'CLOSED'
  AND EXISTS (
    SELECT 1 FROM o2c.invoice inv
    WHERE inv.order_id = o.order_id AND inv.balance_amount > 0
  );

COMMENT ON VIEW analytics.v_revenue_leakage_summary IS 'Placeholder view consolidating high-risk revenue leakage across operational transactions';

-- 3. PROCESS DELAYS & CYCLE TIME VIEW (STUB)
-- TODO (Step 4): Compute milestone cycle times (Quote-to-Order, Order-to-Ship, Ship-to-Invoice)
CREATE OR REPLACE VIEW analytics.v_process_cycle_time_delays AS
SELECT
  o.order_id,
  o.account_id,
  o.order_date,
  s.ship_date,
  i.invoice_date,
  CASE WHEN s.ship_date IS NOT NULL THEN (s.ship_date - o.order_date) ELSE NULL END AS days_order_to_ship,
  CASE WHEN i.invoice_date IS NOT NULL AND s.ship_date IS NOT NULL THEN (i.invoice_date - s.ship_date) ELSE NULL END AS days_ship_to_invoice,
  CASE WHEN o.promised_date < s.ship_date THEN true ELSE false END AS is_shipment_delayed
FROM o2c.sales_order o
LEFT JOIN o2c.shipment s ON o.order_id = s.order_id
LEFT JOIN o2c.invoice i ON o.order_id = i.order_id;

COMMENT ON VIEW analytics.v_process_cycle_time_delays IS 'Placeholder view measuring lead times and SLA breaches between order, fulfillment, and billing';

-- 4. ORDER FULFILLMENT RECONCILIATION VIEW (STUB)
-- TODO (Step 4): Reconcile ordered vs shipped vs invoiced quantities per order line
CREATE OR REPLACE VIEW analytics.v_fulfillment_reconciliation AS
SELECT
  ol.order_line_id,
  ol.order_id,
  ol.sku,
  ol.ordered_qty,
  COALESCE(SUM(sl.shipped_qty), 0) AS total_shipped_qty,
  COALESCE(SUM(il.billed_qty), 0) AS total_billed_qty,
  (ol.ordered_qty - COALESCE(SUM(sl.shipped_qty), 0)) AS unfulfilled_qty,
  (COALESCE(SUM(sl.shipped_qty), 0) - COALESCE(SUM(il.billed_qty), 0)) AS unbilled_shipped_qty
FROM o2c.order_line ol
LEFT JOIN o2c.shipment_line sl ON ol.order_line_id = sl.order_line_id
LEFT JOIN o2c.invoice_line il ON ol.order_line_id = il.order_line_id
GROUP BY ol.order_line_id, ol.order_id, ol.sku, ol.ordered_qty;

COMMENT ON VIEW analytics.v_fulfillment_reconciliation IS 'Placeholder view auditing quantity alignment across order, fulfillment, and invoice stages';

-- 5. UNALLOCATED CASH VIEW (STUB)
CREATE OR REPLACE VIEW analytics.v_unallocated_payments AS
SELECT
  p.payment_id,
  p.account_id,
  p.payment_date,
  p.amount AS total_payment_amount,
  COALESCE(SUM(pa.allocated_amount), 0) AS total_allocated_amount,
  (p.amount - COALESCE(SUM(pa.allocated_amount), 0)) AS unallocated_balance
FROM o2c.payment p
LEFT JOIN o2c.payment_allocation pa ON p.payment_id = pa.payment_id
GROUP BY p.payment_id, p.account_id, p.payment_date, p.amount
HAVING (p.amount - COALESCE(SUM(pa.allocated_amount), 0)) > 0;

COMMENT ON VIEW analytics.v_unallocated_payments IS 'Placeholder view identifying cash receipts unallocated to receivables';

-- Grant access on views to analytical roles
GRANT SELECT ON analytics.v_ar_aging_summary TO authenticated, anon;
GRANT SELECT ON analytics.v_revenue_leakage_summary TO authenticated, anon;
GRANT SELECT ON analytics.v_process_cycle_time_delays TO authenticated, anon;
GRANT SELECT ON analytics.v_fulfillment_reconciliation TO authenticated, anon;
GRANT SELECT ON analytics.v_unallocated_payments TO authenticated, anon;


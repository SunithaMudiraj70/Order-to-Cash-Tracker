-- ==============================================================================
-- Query: delays.sql
-- Description: Process delay analysis and SLA breach tracking
-- TODO (Step 4): Incorporate holiday calendars and working day calculations
-- ==============================================================================

SELECT
  o.order_id,
  o.account_id,
  o.order_date,
  o.promised_date,
  s.ship_date,
  i.invoice_date,
  p.payment_date,
  (s.ship_date - o.order_date) AS fulfillment_lead_time_days,
  (i.invoice_date - s.ship_date) AS billing_lag_days,
  (p.payment_date - i.due_date) AS collection_overdue_days,
  CASE
    WHEN s.ship_date > o.promised_date THEN 'SLA_BREACH_DELIVERY'
    WHEN (i.invoice_date - s.ship_date) > 5 THEN 'SLA_BREACH_BILLING_DELAY'
    WHEN p.payment_date > i.due_date THEN 'PAYMENT_OVERDUE'
    ELSE 'ON_TIME'
  END AS delay_category
FROM o2c.sales_order o
LEFT JOIN o2c.shipment s ON o.order_id = s.order_id
LEFT JOIN o2c.invoice i ON o.order_id = i.order_id
LEFT JOIN o2c.payment_allocation pa ON i.invoice_id = pa.invoice_id
LEFT JOIN o2c.payment p ON pa.payment_id = p.payment_id;


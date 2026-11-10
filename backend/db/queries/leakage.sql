-- ==============================================================================
-- Query: leakage.sql
-- Description: Revenue leakage detection across order fulfillment and billing
-- TODO (Step 4): Cross-reference against gt.ground_truth benchmark rules
-- ==============================================================================

-- 1. Invoices exceeding shipped quantities (Overbilling / fulfillment mismatch)
SELECT
  'INVOICE_EXCEEDS_FULFILLED' AS issue_type,
  ol.order_id,
  ol.order_line_id,
  ol.sku,
  ol.ordered_qty,
  COALESCE(SUM(DISTINCT sl.shipped_qty), 0) AS total_shipped,
  COALESCE(SUM(DISTINCT il.billed_qty), 0) AS total_billed,
  (COALESCE(SUM(DISTINCT il.billed_qty), 0) - COALESCE(SUM(DISTINCT sl.shipped_qty), 0)) * ol.unit_price AS potential_leakage_amount
FROM o2c.order_line ol
LEFT JOIN o2c.shipment_line sl ON ol.order_line_id = sl.order_line_id
LEFT JOIN o2c.invoice_line il ON ol.order_line_id = il.order_line_id
GROUP BY ol.order_id, ol.order_line_id, ol.sku, ol.ordered_qty, ol.unit_price
HAVING COALESCE(SUM(DISTINCT il.billed_qty), 0) > COALESCE(SUM(DISTINCT sl.shipped_qty), 0);


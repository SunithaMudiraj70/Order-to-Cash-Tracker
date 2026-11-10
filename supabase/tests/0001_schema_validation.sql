-- ==============================================================================
-- pgTAP Test Suite: Schema and Integrity Validation
-- Run via: supabase test db
-- ==============================================================================

BEGIN;
SELECT plan(22);

-- 1. Schema Existence
SELECT has_schema('o2c', 'Schema o2c should exist');
SELECT has_schema('gt', 'Schema gt should exist');
SELECT has_schema('analytics', 'Schema analytics should exist');

-- 2. Core Operational Tables Existence
SELECT has_table('o2c', 'account', 'Table o2c.account should exist');
SELECT has_table('o2c', 'quote', 'Table o2c.quote should exist');
SELECT has_table('o2c', 'quote_line', 'Table o2c.quote_line should exist');
SELECT has_table('o2c', 'sales_order', 'Table o2c.sales_order should exist');
SELECT has_table('o2c', 'order_line', 'Table o2c.order_line should exist');
SELECT has_table('o2c', 'shipment', 'Table o2c.shipment should exist');
SELECT has_table('o2c', 'shipment_line', 'Table o2c.shipment_line should exist');
SELECT has_table('o2c', 'invoice', 'Table o2c.invoice should exist');
SELECT has_table('o2c', 'invoice_line', 'Table o2c.invoice_line should exist');
SELECT has_table('o2c', 'payment', 'Table o2c.payment should exist');
SELECT has_table('o2c', 'payment_allocation', 'Table o2c.payment_allocation should exist');
SELECT has_table('o2c', 'dispute', 'Table o2c.dispute should exist');
SELECT has_table('o2c', 'status_event', 'Table o2c.status_event should exist');

-- 3. Ground Truth Table Existence
SELECT has_table('gt', 'ground_truth', 'Table gt.ground_truth should exist');

-- 4. Analytical Views Existence
SELECT has_view('analytics', 'v_ar_aging_summary', 'View analytics.v_ar_aging_summary should exist');
SELECT has_view('analytics', 'v_revenue_leakage_summary', 'View analytics.v_revenue_leakage_summary should exist');
SELECT has_view('analytics', 'v_process_cycle_time_delays', 'View analytics.v_process_cycle_time_delays should exist');

-- 5. Primary Keys Verification
SELECT col_is_pk('o2c', 'account', 'account_id', 'o2c.account PK should be account_id');
SELECT col_is_pk('o2c', 'sales_order', 'order_id', 'o2c.sales_order PK should be order_id');

SELECT * FROM finish();
ROLLBACK;


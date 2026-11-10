-- ==============================================================================
-- Supabase Local Development Seed Script
-- Purpose: Initial baseline seed data for local testing and developer bootstrap
-- Note: Synthetic large-scale data generation is handled by backend/pipeline/src/pipeline/datagen
-- ==============================================================================

-- 1. BASELINE TEST ACCOUNTS
INSERT INTO o2c.account (account_id, name, segment, region, credit_limit, payment_terms_days, status)
VALUES
  ('ACC-000001', 'Acme Global Logistics', 'Enterprise', 'NA', 500000.00, 30, 'ACTIVE'),
  ('ACC-000002', 'Starlight Retailers Inc', 'Mid-Market', 'EMEA', 150000.00, 45, 'ACTIVE'),
  ('ACC-000003', 'Apex Industrial Supplies', 'Enterprise', 'APAC', 750000.00, 60, 'ACTIVE'),
  ('ACC-000004', 'Vanguard Medical Devices', 'Mid-Market', 'NA', 200000.00, 30, 'ACTIVE'),
  ('ACC-000005', 'Horizon Tech Ventures', 'SMB', 'LATAM', 50000.00, 15, 'ACTIVE')
ON CONFLICT (account_id) DO NOTHING;

-- 2. BASELINE SAMPLE QUOTE & SALES ORDER
INSERT INTO o2c.quote (quote_id, account_id, status, quote_date, valid_until, total_amount, currency)
VALUES
  ('QTE-2026-000001', 'ACC-000001', 'ACCEPTED', CURRENT_DATE - 15, CURRENT_DATE + 15, 25000.00, 'USD')
ON CONFLICT (quote_id) DO NOTHING;

INSERT INTO o2c.quote_line (quote_line_id, quote_id, line_no, sku, description, qty, unit_price, discount_pct, line_total)
VALUES
  ('QL-000001', 'QTE-2026-000001', 1, 'SKU-SER-001', 'Enterprise Server Appliance X1', 5.000, 5000.00, 0.00, 25000.00)
ON CONFLICT (quote_line_id) DO NOTHING;

INSERT INTO o2c.sales_order (order_id, quote_id, account_id, status, order_date, promised_date, total_amount, currency)
VALUES
  ('SO-2026-000001', 'QTE-2026-000001', 'ACC-000001', 'CONFIRMED', CURRENT_DATE - 10, CURRENT_DATE + 5, 25000.00, 'USD')
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO o2c.order_line (order_line_id, order_id, quote_line_id, line_no, sku, ordered_qty, unit_price, line_total)
VALUES
  ('OL-000001', 'SO-2026-000001', 'QL-000001', 1, 'SKU-SER-001', 5.000, 5000.00, 25000.00)
ON CONFLICT (order_line_id) DO NOTHING;


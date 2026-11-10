-- ==============================================================================
-- Migration: 0007_rls_roles.sql
-- Description: Implement Row-Level Security (RLS) with 5 distinct business roles
--              (customer, sales_ops, support_agent, analyst, admin) mapped via
--              o2c.profiles to auth.users. Isolates gt schema to analyst/admin.
-- Concern: Security, Authentication, RBAC, and Row-Level Security
-- Idempotent: Yes
-- ==============================================================================

-- 1. USER PROFILES TABLE LINKED TO AUTH.USERS
CREATE TABLE IF NOT EXISTS o2c.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer',
  account_id VARCHAR(32) NULL REFERENCES o2c.account(account_id) ON DELETE SET NULL,
  full_name TEXT NULL,
  email TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_profile_role CHECK (
    role IN ('customer', 'sales_ops', 'support_agent', 'analyst', 'admin')
  )
);

COMMENT ON TABLE o2c.profiles IS 'System user profiles linking Supabase auth.users to specific O2C operational roles';
COMMENT ON COLUMN o2c.profiles.role IS 'Role authorization level: customer, sales_ops, support_agent, analyst, admin';
COMMENT ON COLUMN o2c.profiles.account_id IS 'Associated customer account for tenant isolation (for customer role)';

-- 2. SECURITY HELPER FUNCTIONS (STABLE, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION o2c.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM o2c.profiles WHERE id = auth.uid()),
    'anon'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION o2c.current_user_account_id()
RETURNS VARCHAR(32) AS $$
  SELECT account_id FROM o2c.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION o2c.is_admin()
RETURNS BOOLEAN AS $$
  SELECT o2c.current_user_role() = 'admin';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION o2c.is_analyst_or_admin()
RETURNS BOOLEAN AS $$
  SELECT o2c.current_user_role() IN ('analyst', 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION o2c.is_internal_staff()
RETURNS BOOLEAN AS $$
  SELECT o2c.current_user_role() IN ('sales_ops', 'support_agent', 'analyst', 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
ALTER TABLE o2c.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.quote ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.quote_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.sales_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.order_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.shipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.shipment_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.invoice_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.payment_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.dispute ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2c.status_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE gt.ground_truth ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR GROUND TRUTH (STRICTLY ANALYST & ADMIN ONLY)
DROP POLICY IF EXISTS p_gt_select ON gt.ground_truth;
CREATE POLICY p_gt_select ON gt.ground_truth
  FOR SELECT
  TO authenticated
  USING (o2c.is_analyst_or_admin());

DROP POLICY IF EXISTS p_gt_all_admin ON gt.ground_truth;
CREATE POLICY p_gt_all_admin ON gt.ground_truth
  FOR ALL
  TO authenticated
  USING (o2c.is_admin())
  WITH CHECK (o2c.is_admin());

-- 5. RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS p_profiles_read ON o2c.profiles;
CREATE POLICY p_profiles_read ON o2c.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR o2c.is_internal_staff());

DROP POLICY IF EXISTS p_profiles_manage_admin ON o2c.profiles;
CREATE POLICY p_profiles_manage_admin ON o2c.profiles
  FOR ALL
  TO authenticated
  USING (o2c.is_admin())
  WITH CHECK (o2c.is_admin());

-- 6. RLS POLICIES FOR ACCOUNTS
DROP POLICY IF EXISTS p_account_select ON o2c.account;
CREATE POLICY p_account_select ON o2c.account
  FOR SELECT
  TO authenticated
  USING (o2c.is_internal_staff() OR account_id = o2c.current_user_account_id());

DROP POLICY IF EXISTS p_account_modify ON o2c.account;
CREATE POLICY p_account_modify ON o2c.account
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

-- 7. RLS POLICIES FOR QUOTES & QUOTE LINES
DROP POLICY IF EXISTS p_quote_select ON o2c.quote;
CREATE POLICY p_quote_select ON o2c.quote
  FOR SELECT
  TO authenticated
  USING (o2c.is_internal_staff() OR account_id = o2c.current_user_account_id());

DROP POLICY IF EXISTS p_quote_modify ON o2c.quote;
CREATE POLICY p_quote_modify ON o2c.quote
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

DROP POLICY IF EXISTS p_quote_line_select ON o2c.quote_line;
CREATE POLICY p_quote_line_select ON o2c.quote_line
  FOR SELECT
  TO authenticated
  USING (
    o2c.is_internal_staff() OR
    EXISTS (SELECT 1 FROM o2c.quote q WHERE q.quote_id = quote_line.quote_id AND q.account_id = o2c.current_user_account_id())
  );

DROP POLICY IF EXISTS p_quote_line_modify ON o2c.quote_line;
CREATE POLICY p_quote_line_modify ON o2c.quote_line
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

-- 8. RLS POLICIES FOR ORDERS & ORDER LINES
DROP POLICY IF EXISTS p_order_select ON o2c.sales_order;
CREATE POLICY p_order_select ON o2c.sales_order
  FOR SELECT
  TO authenticated
  USING (o2c.is_internal_staff() OR account_id = o2c.current_user_account_id());

DROP POLICY IF EXISTS p_order_modify ON o2c.sales_order;
CREATE POLICY p_order_modify ON o2c.sales_order
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

DROP POLICY IF EXISTS p_order_line_select ON o2c.order_line;
CREATE POLICY p_order_line_select ON o2c.order_line
  FOR SELECT
  TO authenticated
  USING (
    o2c.is_internal_staff() OR
    EXISTS (SELECT 1 FROM o2c.sales_order o WHERE o.order_id = order_line.order_id AND o.account_id = o2c.current_user_account_id())
  );

DROP POLICY IF EXISTS p_order_line_modify ON o2c.order_line;
CREATE POLICY p_order_line_modify ON o2c.order_line
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

-- 9. RLS POLICIES FOR SHIPMENTS & SHIPMENT LINES
DROP POLICY IF EXISTS p_shipment_select ON o2c.shipment;
CREATE POLICY p_shipment_select ON o2c.shipment
  FOR SELECT
  TO authenticated
  USING (
    o2c.is_internal_staff() OR
    EXISTS (SELECT 1 FROM o2c.sales_order o WHERE o.order_id = shipment.order_id AND o.account_id = o2c.current_user_account_id())
  );

DROP POLICY IF EXISTS p_shipment_modify ON o2c.shipment;
CREATE POLICY p_shipment_modify ON o2c.shipment
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

DROP POLICY IF EXISTS p_shipment_line_select ON o2c.shipment_line;
CREATE POLICY p_shipment_line_select ON o2c.shipment_line
  FOR SELECT
  TO authenticated
  USING (
    o2c.is_internal_staff() OR
    EXISTS (SELECT 1 FROM o2c.shipment s JOIN o2c.sales_order o ON s.order_id = o.order_id WHERE s.shipment_id = shipment_line.shipment_id AND o.account_id = o2c.current_user_account_id())
  );

DROP POLICY IF EXISTS p_shipment_line_modify ON o2c.shipment_line;
CREATE POLICY p_shipment_line_modify ON o2c.shipment_line
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

-- 10. RLS POLICIES FOR INVOICES & INVOICE LINES
DROP POLICY IF EXISTS p_invoice_select ON o2c.invoice;
CREATE POLICY p_invoice_select ON o2c.invoice
  FOR SELECT
  TO authenticated
  USING (o2c.is_internal_staff() OR account_id = o2c.current_user_account_id());

DROP POLICY IF EXISTS p_invoice_modify ON o2c.invoice;
CREATE POLICY p_invoice_modify ON o2c.invoice
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

DROP POLICY IF EXISTS p_invoice_line_select ON o2c.invoice_line;
CREATE POLICY p_invoice_line_select ON o2c.invoice_line
  FOR SELECT
  TO authenticated
  USING (
    o2c.is_internal_staff() OR
    EXISTS (SELECT 1 FROM o2c.invoice i WHERE i.invoice_id = invoice_line.invoice_id AND i.account_id = o2c.current_user_account_id())
  );

DROP POLICY IF EXISTS p_invoice_line_modify ON o2c.invoice_line;
CREATE POLICY p_invoice_line_modify ON o2c.invoice_line
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

-- 11. RLS POLICIES FOR PAYMENTS & ALLOCATIONS
DROP POLICY IF EXISTS p_payment_select ON o2c.payment;
CREATE POLICY p_payment_select ON o2c.payment
  FOR SELECT
  TO authenticated
  USING (o2c.is_internal_staff() OR account_id = o2c.current_user_account_id());

DROP POLICY IF EXISTS p_payment_modify ON o2c.payment;
CREATE POLICY p_payment_modify ON o2c.payment
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

DROP POLICY IF EXISTS p_payment_allocation_select ON o2c.payment_allocation;
CREATE POLICY p_payment_allocation_select ON o2c.payment_allocation
  FOR SELECT
  TO authenticated
  USING (
    o2c.is_internal_staff() OR
    EXISTS (SELECT 1 FROM o2c.payment p WHERE p.payment_id = payment_allocation.payment_id AND p.account_id = o2c.current_user_account_id())
  );

DROP POLICY IF EXISTS p_payment_allocation_modify ON o2c.payment_allocation;
CREATE POLICY p_payment_allocation_modify ON o2c.payment_allocation
  FOR ALL
  TO authenticated
  USING (o2c.current_user_role() IN ('sales_ops', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('sales_ops', 'admin'));

-- 12. RLS POLICIES FOR DISPUTES
DROP POLICY IF EXISTS p_dispute_select ON o2c.dispute;
CREATE POLICY p_dispute_select ON o2c.dispute
  FOR SELECT
  TO authenticated
  USING (
    o2c.is_internal_staff() OR
    EXISTS (SELECT 1 FROM o2c.invoice i WHERE i.invoice_id = dispute.invoice_id AND i.account_id = o2c.current_user_account_id())
  );

DROP POLICY IF EXISTS p_dispute_insert ON o2c.dispute;
CREATE POLICY p_dispute_insert ON o2c.dispute
  FOR INSERT
  TO authenticated
  WITH CHECK (
    o2c.current_user_role() IN ('customer', 'support_agent', 'admin') AND
    (
      o2c.is_internal_staff() OR
      EXISTS (SELECT 1 FROM o2c.invoice i WHERE i.invoice_id = invoice_id AND i.account_id = o2c.current_user_account_id())
    )
  );

DROP POLICY IF EXISTS p_dispute_modify ON o2c.dispute;
CREATE POLICY p_dispute_modify ON o2c.dispute
  FOR UPDATE
  TO authenticated
  USING (o2c.current_user_role() IN ('support_agent', 'admin'))
  WITH CHECK (o2c.current_user_role() IN ('support_agent', 'admin'));

-- 13. RLS POLICIES FOR STATUS EVENTS (AUDIT STREAM)
DROP POLICY IF EXISTS p_status_event_select ON o2c.status_event;
CREATE POLICY p_status_event_select ON o2c.status_event
  FOR SELECT
  TO authenticated
  USING (o2c.is_internal_staff());

DROP POLICY IF EXISTS p_status_event_insert ON o2c.status_event;
CREATE POLICY p_status_event_insert ON o2c.status_event
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 14. TABLE LEVEL PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA o2c TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA o2c TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA o2c TO anon;

GRANT ALL ON ALL TABLES IN SCHEMA gt TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA gt TO authenticated;


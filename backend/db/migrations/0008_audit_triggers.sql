-- ==============================================================================
-- Migration: 0008_audit_triggers.sql
-- Description: Automated trigger helpers writing status transition audit records
--              into the immutable o2c.status_event ledger.
-- Concern: Automated Auditability & Status Event Capture
-- Idempotent: Yes
-- ==============================================================================

-- 1. SEQUENCE FOR EVENT ID GENERATION
CREATE SEQUENCE IF NOT EXISTS o2c.seq_status_event_id START 1;
GRANT USAGE, SELECT ON SEQUENCE o2c.seq_status_event_id TO postgres, authenticated, service_role;

-- 2. STATUS AUDIT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION o2c.fn_audit_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_type o2c.entity_type;
  v_entity_id VARCHAR(32);
  v_from_status TEXT;
  v_to_status TEXT;
  v_event_id VARCHAR(32);
  v_actor TEXT;
BEGIN
  -- Determine from and to status
  IF TG_OP = 'INSERT' THEN
    v_from_status := NULL;
    v_to_status := NEW.status::text;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
      RETURN NEW;
    END IF;
    v_from_status := OLD.status::text;
    v_to_status := NEW.status::text;
  ELSE
    RETURN NULL;
  END IF;

  -- Map table to entity_type and entity_id
  CASE TG_TABLE_NAME
    WHEN 'quote' THEN
      v_entity_type := 'QUOTE'::o2c.entity_type;
      v_entity_id := NEW.quote_id;
    WHEN 'sales_order' THEN
      v_entity_type := 'SALES_ORDER'::o2c.entity_type;
      v_entity_id := NEW.order_id;
    WHEN 'shipment' THEN
      v_entity_type := 'SHIPMENT'::o2c.entity_type;
      v_entity_id := NEW.shipment_id;
    WHEN 'invoice' THEN
      v_entity_type := 'INVOICE'::o2c.entity_type;
      v_entity_id := NEW.invoice_id;
    WHEN 'payment' THEN
      v_entity_type := 'PAYMENT'::o2c.entity_type;
      v_entity_id := NEW.payment_id;
    WHEN 'dispute' THEN
      v_entity_type := 'DISPUTE'::o2c.entity_type;
      v_entity_id := NEW.dispute_id;
    ELSE
      RAISE EXCEPTION 'Unsupported table for status audit: %', TG_TABLE_NAME;
  END CASE;

  -- Generate formatted event ID: EVT-000001
  v_event_id := 'EVT-' || LPAD(nextval('o2c.seq_status_event_id')::text, 6, '0');

  -- Capture calling actor or fallback
  v_actor := COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    SESSION_USER,
    'system'
  );

  -- Insert immutable audit log entry
  INSERT INTO o2c.status_event (
    event_id,
    entity_type,
    entity_id,
    from_status,
    to_status,
    event_ts,
    actor,
    source,
    payload
  ) VALUES (
    v_event_id,
    v_entity_type,
    v_entity_id,
    v_from_status,
    v_to_status,
    timezone('utc', now()),
    v_actor,
    'db_trigger_' || TG_TABLE_NAME,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'recorded_at', timezone('utc', now())
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. BIND STATUS AUDIT TRIGGERS TO ALL CORE STATEFUL TABLES

-- Quote Trigger
DROP TRIGGER IF EXISTS trg_audit_quote_status ON o2c.quote;
CREATE TRIGGER trg_audit_quote_status
  AFTER INSERT OR UPDATE OF status ON o2c.quote
  FOR EACH ROW
  EXECUTE FUNCTION o2c.fn_audit_status_change();

-- Sales Order Trigger
DROP TRIGGER IF EXISTS trg_audit_order_status ON o2c.sales_order;
CREATE TRIGGER trg_audit_order_status
  AFTER INSERT OR UPDATE OF status ON o2c.sales_order
  FOR EACH ROW
  EXECUTE FUNCTION o2c.fn_audit_status_change();

-- Shipment Trigger
DROP TRIGGER IF EXISTS trg_audit_shipment_status ON o2c.shipment;
CREATE TRIGGER trg_audit_shipment_status
  AFTER INSERT OR UPDATE OF status ON o2c.shipment
  FOR EACH ROW
  EXECUTE FUNCTION o2c.fn_audit_status_change();

-- Invoice Trigger
DROP TRIGGER IF EXISTS trg_audit_invoice_status ON o2c.invoice;
CREATE TRIGGER trg_audit_invoice_status
  AFTER INSERT OR UPDATE OF status ON o2c.invoice
  FOR EACH ROW
  EXECUTE FUNCTION o2c.fn_audit_status_change();

-- Payment Trigger
DROP TRIGGER IF EXISTS trg_audit_payment_status ON o2c.payment;
CREATE TRIGGER trg_audit_payment_status
  AFTER INSERT OR UPDATE OF status ON o2c.payment
  FOR EACH ROW
  EXECUTE FUNCTION o2c.fn_audit_status_change();

-- Dispute Trigger
DROP TRIGGER IF EXISTS trg_audit_dispute_status ON o2c.dispute;
CREATE TRIGGER trg_audit_dispute_status
  AFTER INSERT OR UPDATE OF status ON o2c.dispute
  FOR EACH ROW
  EXECUTE FUNCTION o2c.fn_audit_status_change();

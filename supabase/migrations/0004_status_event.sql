-- ==============================================================================
-- Migration: 0004_status_event.sql
-- Description: Define append-only status_event ledger and enforcement trigger
--              prohibiting any UPDATE or DELETE operations.
-- Concern: Auditability & Event Stream
-- Idempotent: Yes
-- ==============================================================================

-- 1. STATUS_EVENT TABLE
CREATE TABLE IF NOT EXISTS o2c.status_event (
  event_id VARCHAR(32) PRIMARY KEY,
  entity_type o2c.entity_type NOT NULL,
  entity_id VARCHAR(32) NOT NULL,
  from_status TEXT NULL,
  to_status TEXT NOT NULL,
  event_ts TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  actor TEXT NOT NULL DEFAULT 'system',
  source TEXT NOT NULL DEFAULT 'o2c_service',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_status_event_id_format CHECK (event_id ~ '^EVT-[0-9]{6,}$')
);

COMMENT ON TABLE o2c.status_event IS 'Append-only immutable event ledger capturing every state change across operational entities';
COMMENT ON COLUMN o2c.status_event.event_id IS 'Unique event identifier formatted as EVT-XXXXXX';
COMMENT ON COLUMN o2c.status_event.entity_id IS 'Target entity identifier (polymorphic reference to quote, order, shipment, invoice, payment, dispute)';
COMMENT ON COLUMN o2c.status_event.payload IS 'Metadata context at event firing (deltas, user context, request headers)';

-- 2. TRIGGER FUNCTION: PREVENT UPDATE OR DELETE ON STATUS_EVENT
CREATE OR REPLACE FUNCTION o2c.fn_prevent_status_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'status_event is an immutable append-only ledger; % operations are strictly prohibited.', TG_OP
    USING ERRCODE = '55000'; -- Object not in prerequisite state / feature not supported
END;
$$ LANGUAGE plpgsql;

-- 3. BIND MUTATION PREVENTION TRIGGER
DROP TRIGGER IF EXISTS trg_prevent_status_event_update ON o2c.status_event;
CREATE TRIGGER trg_prevent_status_event_update
  BEFORE UPDATE OR DELETE ON o2c.status_event
  FOR EACH ROW
  EXECUTE FUNCTION o2c.fn_prevent_status_event_mutation();


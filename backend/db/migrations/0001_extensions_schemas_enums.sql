-- ==============================================================================
-- Migration: 0001_extensions_schemas_enums.sql
-- Description: Enable required PostgreSQL extensions, create isolated schemas
--              (o2c, gt, analytics), and define core Order-to-Cash enum types.
-- Concern: Schemas, Extensions, and Enumerations
-- Idempotent: Yes
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- 2. SCHEMAS
-- o2c: Operational core schema housing master and transactional entities
CREATE SCHEMA IF NOT EXISTS o2c;

-- gt: Isolated ground-truth schema for anomaly evaluation (no FKs into o2c)
CREATE SCHEMA IF NOT EXISTS gt;

-- analytics: Aggregated metrics, aging buckets, and leakage reporting views
CREATE SCHEMA IF NOT EXISTS analytics;

-- Ensure schema usage privileges
GRANT USAGE ON SCHEMA o2c TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA gt TO postgres, authenticated, service_role;
GRANT USAGE ON SCHEMA analytics TO postgres, anon, authenticated, service_role;

-- 3. ENUM TYPES (in o2c schema)

-- Quote lifecycle states
DO $$ BEGIN
  CREATE TYPE o2c.quote_status AS ENUM (
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Sales Order lifecycle states
DO $$ BEGIN
  CREATE TYPE o2c.order_status AS ENUM (
    'CREATED',
    'CONFIRMED',
    'PARTIALLY_FULFILLED',
    'FULFILLED',
    'INVOICED',
    'PAID',
    'CLOSED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Fulfillment / Shipment lifecycle states
DO $$ BEGIN
  CREATE TYPE o2c.shipment_status AS ENUM (
    'PLANNED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Invoicing / Billing lifecycle states
DO $$ BEGIN
  CREATE TYPE o2c.invoice_status AS ENUM (
    'DRAFT',
    'ISSUED',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'DISPUTED',
    'VOID'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment lifecycle states
DO $$ BEGIN
  CREATE TYPE o2c.payment_status AS ENUM (
    'RECEIVED',
    'ALLOCATED',
    'PARTIALLY_ALLOCATED',
    'REVERSED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Dispute lifecycle states
DO $$ BEGIN
  CREATE TYPE o2c.dispute_status AS ENUM (
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED_CREDIT',
    'RESOLVED_REJECTED',
    'CLOSED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Entity classification for events and audit tracking
DO $$ BEGIN
  CREATE TYPE o2c.entity_type AS ENUM (
    'ACCOUNT',
    'QUOTE',
    'QUOTE_LINE',
    'SALES_ORDER',
    'ORDER_LINE',
    'SHIPMENT',
    'SHIPMENT_LINE',
    'INVOICE',
    'INVOICE_LINE',
    'PAYMENT',
    'PAYMENT_ALLOCATION',
    'DISPUTE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Revenue leakage & anomaly taxonomy (used in ground-truth and analytics)
DO $$ BEGIN
  CREATE TYPE o2c.issue_type AS ENUM (
    'INVOICE_EXCEEDS_FULFILLED',
    'PAYMENT_ALLOCATED_TWICE',
    'ORDER_CLOSED_UNPAID',
    'STATUS_EVENT_SKIPPED_STATE',
    'DISPUTE_NOT_IN_RECEIVABLES',
    'PARTIAL_SHIPMENT',
    'UNDERBILLING',
    'DUPLICATE_INVOICE',
    'SHORT_PAYMENT',
    'LONG_OVERDUE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Comments
COMMENT ON SCHEMA o2c IS 'Order-to-Cash operational schema for core entities and transactions';
COMMENT ON SCHEMA gt IS 'Isolated Ground-Truth benchmark schema storing synthetic injected anomalies';
COMMENT ON SCHEMA analytics IS 'Read-only reporting and analytical layer for process aging and leakage metrics';


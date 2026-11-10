-- ==============================================================================
-- Migration: 0012_secure_tracker_and_rls.sql
-- Description: Move migration tracker to o2c.migrations, enable RLS with no policies,
--              and revoke all table privileges from anon and authenticated roles.
-- Concern: Security hardening, RLS enforcement, and exposure elimination
-- Idempotent: Yes
-- ==============================================================================

-- 1. ENSURE O2C SCHEMA EXISTS
CREATE SCHEMA IF NOT EXISTS o2c;

-- 2. CREATE SECURE MIGRATION TRACKER IN O2C SCHEMA
CREATE TABLE IF NOT EXISTS o2c.migrations (
    version TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. MIGRATE DATA FROM PUBLIC.O2C_MIGRATIONS IF PRESENT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'o2c_migrations'
    ) THEN
        INSERT INTO o2c.migrations (version, checksum, applied_at)
        SELECT version, checksum, applied_at 
        FROM public.o2c_migrations
        ON CONFLICT (version) DO UPDATE SET
            checksum = EXCLUDED.checksum,
            applied_at = EXCLUDED.applied_at;

        -- Revoke all access and drop the exposed public tracker
        REVOKE ALL ON TABLE public.o2c_migrations FROM anon, authenticated, public;
        DROP TABLE IF EXISTS public.o2c_migrations CASCADE;
    END IF;
END $$;

-- 4. ENABLE RLS ON TRACKER AND ANALYTICS TABLES
ALTER TABLE o2c.migrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'analytics' AND table_name = 'detector_findings'
    ) THEN
        ALTER TABLE analytics.detector_findings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. REVOKE ALL PRIVILEGES ACROSS SCHEMAS O2C, GT, AND ANALYTICS FROM ANON AND AUTHENTICATED
DO $$
DECLARE
    t RECORD;
BEGIN
    -- Revoke schema usage from anon and authenticated
    REVOKE ALL ON SCHEMA o2c FROM anon, authenticated, public;
    REVOKE ALL ON SCHEMA gt FROM anon, authenticated, public;
    REVOKE ALL ON SCHEMA analytics FROM anon, authenticated, public;

    -- Revoke all table privileges in target schemas
    FOR t IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname IN ('o2c', 'gt', 'analytics')
    LOOP
        EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM anon, authenticated, public;', t.schemaname, t.tablename);
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', t.schemaname, t.tablename);
    END LOOP;

    -- Revoke on any views in analytics schema
    FOR t IN 
        SELECT table_schema, table_name 
        FROM information_schema.views 
        WHERE table_schema IN ('analytics', 'o2c', 'gt')
    LOOP
        EXECUTE format('REVOKE ALL ON %I.%I FROM anon, authenticated, public;', t.table_schema, t.table_name);
    END LOOP;
END $$;

-- 6. REVOKE DEFAULT PRIVILEGES FOR ANY FUTURE OBJECTS
ALTER DEFAULT PRIVILEGES IN SCHEMA o2c REVOKE ALL ON TABLES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA gt REVOKE ALL ON TABLES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics REVOKE ALL ON TABLES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA o2c REVOKE ALL ON SEQUENCES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA gt REVOKE ALL ON SEQUENCES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics REVOKE ALL ON SEQUENCES FROM anon, authenticated, public;

-- 7. ENSURE SERVICE_ROLE AND POSTGRES RETAIN FULL PRIVILEGES
GRANT USAGE ON SCHEMA o2c, gt, analytics TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA o2c, gt, analytics TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA o2c, gt, analytics TO service_role;


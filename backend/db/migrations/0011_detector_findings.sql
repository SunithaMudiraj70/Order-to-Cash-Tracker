-- ==============================================================================
-- Migration: 0011_detector_findings.sql
-- Description: Table for storing evaluated detector findings and rule outputs.
-- Concern: Detector Findings & Evaluation Schema
-- Idempotent: Yes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS analytics.detector_findings (
  finding_id VARCHAR(32) PRIMARY KEY,
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(32) NOT NULL,
  issue_type VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'HIGH',
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_detector_findings_lookup
  ON analytics.detector_findings (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_detector_findings_issue
  ON analytics.detector_findings (issue_type);

GRANT ALL ON TABLE analytics.detector_findings TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE analytics.detector_findings TO authenticated, anon;

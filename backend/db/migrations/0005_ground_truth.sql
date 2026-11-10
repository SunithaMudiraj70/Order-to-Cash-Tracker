-- ==============================================================================
-- Migration: 0005_ground_truth.sql
-- Description: Define isolated gt.ground_truth table storing injected synthetic
--              anomalies for ML/rule-engine benchmark validation.
-- Concern: Ground Truth / Anomaly Isolation (Strictly NO foreign keys to o2c)
-- Idempotent: Yes
-- ==============================================================================

-- 1. GROUND TRUTH TABLE
CREATE TABLE IF NOT EXISTS gt.ground_truth (
  gt_id VARCHAR(32) PRIMARY KEY,
  entity_type o2c.entity_type NOT NULL,
  entity_id VARCHAR(32) NOT NULL,
  issue_type o2c.issue_type NOT NULL,
  expected_decision TEXT NOT NULL,
  injected_rule TEXT NOT NULL,
  notes TEXT NULL,
  severity TEXT NOT NULL DEFAULT 'HIGH',
  detected BOOLEAN NOT NULL DEFAULT FALSE,
  detected_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT chk_gt_id_format CHECK (gt_id ~ '^GT-[0-9]{6}$'),
  CONSTRAINT chk_gt_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

COMMENT ON TABLE gt.ground_truth IS 'Benchmark repository of synthetic injected anomalies. STRICT ISOLATION: No FKs into o2c operational schema to prevent data leakage into ML feature stores.';
COMMENT ON COLUMN gt.ground_truth.gt_id IS 'Unique ground truth anomaly identifier formatted as GT-XXXXXX';
COMMENT ON COLUMN gt.ground_truth.entity_id IS 'Unconstrained operational entity identifier matching the target anomaly instance';
COMMENT ON COLUMN gt.ground_truth.injected_rule IS 'Code of the generator rule responsible for synthetic perturbation';
COMMENT ON COLUMN gt.ground_truth.expected_decision IS 'Canonical decision or remediation action expected from detector systems';


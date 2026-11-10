/**
 * PURPOSE: Data access repository querying detector findings and persisting triage records
 * INPUT: whereSql, limit, findingId, status, actor, note
 * RETURNS: Promise<FindingRecord[]>, Promise<FindingRecord | null>, Promise<TriageRecord>
 * ERRORS: throws Error on database failure
 */

import crypto from 'crypto';
import { sql } from '../../db/client.js';

export interface FindingRecord {
  finding_id: string;
  entity_type: string;
  entity_id: string;
  issue_type: string;
  severity: string;
  evidence: Record<string, unknown>;
  detected_at: string;
}

export interface TriageRecord {
  triage_id: string;
  finding_id: string;
  status: string;
  note: string | null;
  actor: string;
  updated_at: string;
}

/**
 * PURPOSE: Query detector findings with custom where clause and pagination limit
 * INPUT: whereSql: string, limit: number
 * RETURNS: Promise<FindingRecord[]>
 * ERRORS: throws on database failure
 */
export async function queryExceptionRows(
  whereSql: string,
  limit: number
): Promise<FindingRecord[]> {
  return sql.unsafe<FindingRecord[]>(
    `SELECT finding_id, entity_type, entity_id, issue_type, severity, evidence, detected_at
     FROM analytics.detector_findings
     ${whereSql}
     ORDER BY finding_id ASC
     LIMIT ${limit}`
  );
}

/**
 * PURPOSE: Query single detector finding record by finding_id
 * INPUT: id: string
 * RETURNS: Promise<FindingRecord | null>
 * ERRORS: throws on database failure
 */
export async function queryExceptionRowById(
  id: string
): Promise<FindingRecord | null> {
  const [row] = await sql<FindingRecord[]>`
    SELECT finding_id, entity_type, entity_id, issue_type, severity, evidence, detected_at
    FROM analytics.detector_findings
    WHERE finding_id = ${id}
    LIMIT 1
  `;
  return row || null;
}

/**
 * PURPOSE: Insert new triage decision audit row for an exception finding
 * INPUT: findingId: string, status: string, note: string | null, actor: string
 * RETURNS: Promise<TriageRecord>
 * ERRORS: throws Error on database failure
 */
export async function insertTriageRecord(
  findingId: string,
  status: string,
  note: string | null,
  actor: string
): Promise<TriageRecord> {
  const [row] = await sql<TriageRecord[]>`
    INSERT INTO analytics.exception_triage (finding_id, status, note, actor)
    VALUES (${findingId}, ${status}, ${note || null}, ${actor})
    RETURNING triage_id, finding_id, status, note, actor, updated_at
  `;
  return row;
}

/**
 * PURPOSE: Insert audit status event into immutable o2c.status_event ledger
 * INPUT: entityType: string, entityId: string, toStatus: string, actor: string, payload: object
 * RETURNS: Promise<void>
 * ERRORS: throws Error on database failure
 */
export async function insertStatusEvent(
  entityType: string,
  entityId: string,
  toStatus: string,
  actor: string,
  payload: Record<string, unknown>
): Promise<void> {
  const payloadStr = JSON.stringify(payload);
  await sql`
    INSERT INTO o2c.status_event (event_id, entity_type, entity_id, to_status, actor, payload)
    VALUES (
      'EVT-' || LPAD(nextval('o2c.seq_status_event_id')::text, 6, '0'),
      ${entityType},
      ${entityId},
      ${toStatus},
      ${actor},
      ${payloadStr}::jsonb
    )
  `;
}

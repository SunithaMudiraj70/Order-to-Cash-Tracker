/**
 * PURPOSE: Data access repository querying detector findings from analytics.detector_findings
 * INPUT: whereSql, limit, findingId
 * RETURNS: Promise<FindingRecord[]>, Promise<FindingRecord | null>
 * ERRORS: throws Error on database failure
 */

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

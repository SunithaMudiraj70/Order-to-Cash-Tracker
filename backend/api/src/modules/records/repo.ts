/**
 * PURPOSE: Data access repository executing raw SQL queries for operational records
 * INPUT: table name, pk, whereSql, limits, entity IDs
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws Error on database failure
 */

import { sql } from '../../db/client.js';

/**
 * PURPOSE: Query entity rows dynamically with filter clauses and limit
 * INPUT: table: string, pk: string, whereSql: string, limit: number
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws on database failure
 */
export async function queryEntityRows(
  table: string,
  pk: string,
  whereSql: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  return sql.unsafe<Record<string, unknown>[]>(
    `SELECT * FROM ${table} ${whereSql} ORDER BY ${pk} ASC LIMIT ${limit}`
  );
}

/**
 * PURPOSE: Query single entity row by primary key
 * INPUT: table: string, pk: string, id: string
 * RETURNS: Promise<Record<string, unknown> | null>
 * ERRORS: throws on database failure
 */
export async function queryEntityRowById(
  table: string,
  pk: string,
  id: string
): Promise<Record<string, unknown> | null> {
  const rows = await sql.unsafe<Record<string, unknown>[]>(
    `SELECT * FROM ${table} WHERE ${pk} = '${id}' LIMIT 1`
  );
  return rows[0] || null;
}

/**
 * PURPOSE: Query chronological status change events for an entity ID
 * INPUT: entityId: string
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws on database failure
 */
export async function queryEntityTimeline(
  entityId: string
): Promise<Record<string, unknown>[]> {
  return sql<Record<string, unknown>[]>`
    SELECT event_id, entity_type, entity_id, from_status, to_status, event_ts, actor, source, payload
    FROM o2c.status_event
    WHERE entity_id = ${entityId}
    ORDER BY event_ts ASC
  `;
}


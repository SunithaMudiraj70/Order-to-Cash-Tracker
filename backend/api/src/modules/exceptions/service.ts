/**
 * PURPOSE: Service layer orchestrating exception filtering, pagination, and evaluation loading
 * INPUT: ExceptionsQuery, ID
 * RETURNS: Promise<{ items, next_cursor }>, Promise<FindingRecord | null>, Promise<unknown[]>
 * ERRORS: throws Error on database error or file not found
 */

import fs from 'fs/promises';
import path from 'path';
import {
  FindingRecord,
  queryExceptionRowById,
  queryExceptionRows
} from './repo.js';
import { ExceptionsQuery } from './schemas.js';

/**
 * PURPOSE: Build dynamic WHERE sql clause from filter parameters
 * INPUT: query: ExceptionsQuery
 * RETURNS: string
 * ERRORS: none
 */
function buildExceptionWhereClause(query: ExceptionsQuery): string {
  const clauses: string[] = [];
  if (query.issue_type) clauses.push(`issue_type = '${query.issue_type}'`);
  if (query.severity) clauses.push(`severity = '${query.severity}'`);
  if (query.entity_type) clauses.push(`entity_type = '${query.entity_type}'`);
  if (query.cursor) clauses.push(`finding_id > '${query.cursor}'`);
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

/**
 * PURPOSE: Query detector findings with optional filtering and pagination
 * INPUT: query: ExceptionsQuery
 * RETURNS: Promise<{ items: FindingRecord[]; next_cursor: string | null }>
 * ERRORS: throws Error on database query failure
 */
export async function listExceptions(
  query: ExceptionsQuery
): Promise<{ items: FindingRecord[]; next_cursor: string | null }> {
  const whereSql = buildExceptionWhereClause(query);
  const rows = await queryExceptionRows(whereSql, query.limit + 1);

  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  const next_cursor = hasMore && items.length > 0 ? items[items.length - 1].finding_id : null;
  return { items, next_cursor };
}

/**
 * PURPOSE: Fetch single exception finding by unique ID
 * INPUT: id: string
 * RETURNS: Promise<FindingRecord | null>
 * ERRORS: throws Error on database query failure
 */
export async function getExceptionById(id: string): Promise<FindingRecord | null> {
  return queryExceptionRowById(id);
}

/**
 * PURPOSE: Read detector evaluation benchmark metrics from disk manifest
 * INPUT: none
 * RETURNS: Promise<unknown[]>
 * ERRORS: throws Error if manifest file missing or corrupt
 */
export async function getEvaluationManifest(): Promise<unknown[]> {
  const candidates = [
    path.resolve(process.cwd(), 'data/manifests/detector_eval.json'),
    path.resolve(process.cwd(), '../../data/manifests/detector_eval.json'),
    path.resolve(__dirname, '../../../../data/manifests/detector_eval.json')
  ];
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, 'utf-8');
      return JSON.parse(raw);
    } catch {
      continue;
    }
  }
  throw new Error('Evaluation manifest detector_eval.json not found');
}

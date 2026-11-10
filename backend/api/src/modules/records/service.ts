/**
 * PURPOSE: Service layer orchestrating entity retrieval, pagination, and customer row scoping
 * INPUT: EntityName, RecordsQuery, UserSession
 * RETURNS: Promise<{ items, next_cursor }> or Record
 * ERRORS: throws Error on database error or forbidden access
 */

import { UserSession } from '../../middlewares/auth.middleware.js';
import { queryEntityRowById, queryEntityRows, queryEntityTimeline } from './repo.js';
import { EntityName, RecordsQuery } from './schemas.js';

interface EntityMeta {
  table: string;
  pk: string;
  hasAccount: boolean;
}

const META: Record<EntityName, EntityMeta> = {
  account: { table: 'o2c.account', pk: 'account_id', hasAccount: true },
  quote: { table: 'o2c.quote', pk: 'quote_id', hasAccount: true },
  order: { table: 'o2c.sales_order', pk: 'order_id', hasAccount: true },
  shipment: { table: 'o2c.shipment', pk: 'shipment_id', hasAccount: true },
  invoice: { table: 'o2c.invoice', pk: 'invoice_id', hasAccount: true },
  payment: { table: 'o2c.payment', pk: 'payment_id', hasAccount: true },
  dispute: { table: 'o2c.dispute', pk: 'dispute_id', hasAccount: false },
  status_event: { table: 'o2c.status_event', pk: 'event_id', hasAccount: false }
};

/**
 * PURPOSE: Build dynamic WHERE filter sql string for query
 * INPUT: meta: EntityMeta, query: RecordsQuery, accFilter?: string | null
 * RETURNS: string
 * ERRORS: none
 */
function buildWhereClause(meta: EntityMeta, query: RecordsQuery, accFilter?: string | null): string {
  const clauses: string[] = [];
  if (meta.hasAccount && accFilter) clauses.push(`account_id = '${accFilter}'`);
  if (query.cursor) clauses.push(`${meta.pk} > '${query.cursor}'`);
  if (query.status) clauses.push(`status = '${query.status}'`);
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

/**
 * PURPOSE: Retrieve paginated rows for an entity with role-based scoping
 * INPUT: entity: EntityName, query: RecordsQuery, user: UserSession
 * RETURNS: Promise<{ items: Record<string, unknown>[]; next_cursor: string | null }>
 * ERRORS: throws Error on query failure
 */
export async function listRecords(
  entity: EntityName,
  query: RecordsQuery,
  user: UserSession
): Promise<{ items: Record<string, unknown>[]; next_cursor: string | null }> {
  const meta = META[entity];
  const accFilter = user.role === 'customer' ? user.account_id : query.account_id;
  const whereSql = buildWhereClause(meta, query, accFilter);

  const rows = await queryEntityRows(meta.table, meta.pk, whereSql, query.limit + 1);
  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  const next_cursor = hasMore && items.length > 0 ? String(items[items.length - 1][meta.pk]) : null;

  return { items, next_cursor };
}

/**
 * PURPOSE: Retrieve a single record by primary key with role security check
 * INPUT: entity: EntityName, id: string, user: UserSession
 * RETURNS: Promise<Record<string, unknown> | null>
 * ERRORS: throws Error if customer accesses another account's record
 */
export async function getRecordById(
  entity: EntityName,
  id: string,
  user: UserSession
): Promise<Record<string, unknown> | null> {
  const meta = META[entity];
  const record = await queryEntityRowById(meta.table, meta.pk, id);
  if (!record) return null;

  if (user.role === 'customer' && meta.hasAccount && record.account_id !== user.account_id) {
    throw new Error('Forbidden: access to record denied');
  }
  return record;
}

/**
 * PURPOSE: Retrieve chronological event timeline for any O2C entity
 * INPUT: entityId: string
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws Error on query failure
 */
export async function getTimelineForEntity(entityId: string): Promise<Record<string, unknown>[]> {
  return queryEntityTimeline(entityId);
}

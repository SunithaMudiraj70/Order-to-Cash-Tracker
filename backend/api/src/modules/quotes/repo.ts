/**
 * PURPOSE: Data access repository for quote state updates, conversion, and order creation
 * INPUT: quoteId, orderData, actor
 * RETURNS: Promise<QuoteRecord | null>, Promise<SalesOrderRecord>
 * ERRORS: throws on database failure
 */

import { sql } from '../../db/client.js';

export interface QuoteRecord {
  quote_id: string;
  account_id: string;
  status: string;
  quote_date: string;
  valid_until: string;
  total_amount: string;
  currency: string;
}

export interface SalesOrderRecord {
  order_id: string;
  quote_id: string;
  account_id: string;
  status: string;
  order_date: string;
  promised_date: string;
  total_amount: string;
  currency: string;
}

export async function findQuoteById(quoteId: string): Promise<QuoteRecord | null> {
  const [row] = await sql<QuoteRecord[]>`
    SELECT quote_id, account_id, status, quote_date, valid_until, total_amount, currency
    FROM o2c.quote
    WHERE quote_id = ${quoteId}
    LIMIT 1
  `;
  return row || null;
}

export async function getNextOrderId(): Promise<string> {
  const [row] = await sql<{ max_id: string | null }[]>`
    SELECT MAX(order_id) as max_id FROM o2c.sales_order
  `;
  if (!row?.max_id) return 'SO-2026-007011';
  const num = parseInt(row.max_id.replace(/[^0-9]/g, '').slice(-6), 10) || 7010;
  return `SO-2026-${String(num + 1).padStart(6, '0')}`;
}

export async function findOrderByQuoteId(quoteId: string): Promise<SalesOrderRecord | null> {
  const [row] = await sql<SalesOrderRecord[]>`
    SELECT order_id, quote_id, account_id, status, order_date, promised_date, total_amount, currency
    FROM o2c.sales_order
    WHERE quote_id = ${quoteId}
    LIMIT 1
  `;
  return row || null;
}

export async function updateQuoteStatus(quoteId: string, status: string): Promise<QuoteRecord> {
  const [row] = await sql<QuoteRecord[]>`
    UPDATE o2c.quote
    SET status = ${status}
    WHERE quote_id = ${quoteId}
    RETURNING quote_id, account_id, status, quote_date, valid_until, total_amount, currency
  `;
  return row;
}

export async function createOrderFromQuote(
  orderId: string,
  quote: QuoteRecord,
  promisedDate: string
): Promise<SalesOrderRecord> {
  const [order] = await sql<SalesOrderRecord[]>`
    INSERT INTO o2c.sales_order (
      order_id, quote_id, account_id, status, order_date, promised_date, total_amount, currency
    )
    VALUES (
      ${orderId}, ${quote.quote_id}, ${quote.account_id}, 'CONFIRMED',
      ${quote.valid_until}, ${promisedDate}, ${quote.total_amount}, ${quote.currency}
    )
    RETURNING order_id, quote_id, account_id, status, order_date, promised_date, total_amount, currency
  `;

  await sql`
    INSERT INTO o2c.order_line (order_line_id, order_id, quote_line_id, line_no, sku, ordered_qty, unit_price, line_total)
    SELECT
      'OL-' || substr(quote_line_id, 4),
      ${orderId},
      quote_line_id,
      line_no,
      sku,
      qty,
      unit_price,
      line_total
    FROM o2c.quote_line
    WHERE quote_id = ${quote.quote_id}
    ON CONFLICT (order_line_id) DO NOTHING
  `;

  return order;
}

export async function insertQuoteStatusEvent(
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

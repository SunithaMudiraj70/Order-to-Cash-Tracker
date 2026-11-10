/**
 * PURPOSE: Service layer orchestrating quote acceptance, order conversion, and idempotency checks
 * INPUT: quoteId, input, actor
 * RETURNS: Promise<QuoteRecord>, Promise<SalesOrderRecord>
 * ERRORS: throws 404 (not found), 409 (conflict/already converted)
 */

import {
  QuoteRecord,
  SalesOrderRecord,
  createOrderFromQuote,
  findOrderByQuoteId,
  findQuoteById,
  getNextOrderId,
  insertQuoteStatusEvent,
  updateQuoteStatus
} from './repo.js';
import { QuoteAcceptInput, QuoteConvertInput } from './schemas.js';

export class ConflictError extends Error {
  code = 'CONFLICT';
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  code = 'NOT_FOUND';
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export async function acceptQuote(
  id: string,
  input: QuoteAcceptInput,
  actor: string
): Promise<QuoteRecord> {
  const quote = await findQuoteById(id);
  if (!quote) throw new NotFoundError(`Quote ${id} not found`);
  if (quote.status === 'ACCEPTED') {
    throw new ConflictError(`Quote ${id} has already been accepted`);
  }

  const updated = await updateQuoteStatus(id, 'ACCEPTED');
  await insertQuoteStatusEvent('QUOTE', id, 'ACCEPTED', actor, {
    note: input.note,
    previous_status: quote.status
  });
  return updated;
}

export async function convertQuoteToOrder(
  id: string,
  input: QuoteConvertInput,
  actor: string
): Promise<SalesOrderRecord> {
  const quote = await findQuoteById(id);
  if (!quote) throw new NotFoundError(`Quote ${id} not found`);

  const existingOrder = await findOrderByQuoteId(id);
  if (existingOrder) {
    throw new ConflictError(`Quote ${id} has already been converted into order ${existingOrder.order_id}`);
  }

  if (quote.status !== 'ACCEPTED') {
    await updateQuoteStatus(id, 'ACCEPTED');
  }

  const orderId = await getNextOrderId();
  const promisedDate = input.promised_date || quote.valid_until;

  const order = await createOrderFromQuote(orderId, quote, promisedDate);
  await insertQuoteStatusEvent('SALES_ORDER', order.order_id, 'CONFIRMED', actor, {
    quote_id: id,
    note: input.note
  });
  return order;
}

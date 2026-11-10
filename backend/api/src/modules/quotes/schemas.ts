/**
 * PURPOSE: Zod validation schemas for quote action endpoints (accept, convert)
 * INPUT: request body params
 * RETURNS: Validated types
 * ERRORS: ZodError
 */

import { z } from 'zod';

export const quoteAcceptSchema = z.object({
  note: z.string().optional()
});

export const quoteConvertSchema = z.object({
  promised_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  note: z.string().optional()
});

export type QuoteAcceptInput = z.infer<typeof quoteAcceptSchema>;
export type QuoteConvertInput = z.infer<typeof quoteConvertSchema>;


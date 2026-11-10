/**
 * PURPOSE: Zod validation schemas for generic records query and entity routing
 * INPUT: query parameters and url params
 * RETURNS: Validated types
 * ERRORS: ZodError
 */

import { z } from 'zod';

export const entityNameSchema = z.enum([
  'account',
  'quote',
  'order',
  'shipment',
  'invoice',
  'payment',
  'dispute',
  'status_event'
]);

export type EntityName = z.infer<typeof entityNameSchema>;

export const recordsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  status: z.string().optional(),
  account_id: z.string().optional()
});

export type RecordsQuery = z.infer<typeof recordsQuerySchema>;

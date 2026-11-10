/**
 * PURPOSE: Zod validation schemas for exception filtering and evaluation endpoints
 * INPUT: query parameters, triage input, and url parameters
 * RETURNS: Validated types
 * ERRORS: ZodError
 */

import { z } from 'zod';

export const exceptionsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(200).default(50),
  cursor: z.string().optional(),
  issue_type: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  entity_type: z.string().optional()
});

export const triageSchema = z.object({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE']),
  note: z.string().optional()
});

export type ExceptionsQuery = z.infer<typeof exceptionsQuerySchema>;
export type TriageInput = z.infer<typeof triageSchema>;

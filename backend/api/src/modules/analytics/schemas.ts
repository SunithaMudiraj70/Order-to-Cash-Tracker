/**
 * PURPOSE: Zod validation schemas for analytics query parameters
 * INPUT: query parameters
 * RETURNS: Validated types
 * ERRORS: ZodError
 */

import { z } from 'zod';

export const agingQuerySchema = z.object({
  cutoff: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Cutoff date must be in YYYY-MM-DD format')
    .default('2026-10-22')
});

export type AgingQuery = z.infer<typeof agingQuerySchema>;

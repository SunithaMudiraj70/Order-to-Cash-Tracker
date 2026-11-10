/**
 * PURPOSE: Zod validation schemas for administrative user management
 * INPUT: request body params
 * RETURNS: Validated types
 * ERRORS: ZodError
 */

import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'analyst', 'sales_ops', 'support_agent', 'customer'])
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;


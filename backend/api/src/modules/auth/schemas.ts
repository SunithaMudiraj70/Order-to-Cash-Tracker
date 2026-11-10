/**
 * PURPOSE: Zod validation schemas for auth endpoints
 * INPUT: request bodies / parameters
 * RETURNS: Validated types
 * ERRORS: ZodError
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type LoginInput = z.infer<typeof loginSchema>;

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['customer', 'sales_ops', 'support_agent', 'analyst', 'admin']),
  full_name: z.string().nullable().optional(),
  account_id: z.string().nullable().optional()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

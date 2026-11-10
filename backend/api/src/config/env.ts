/**
 * PURPOSE: Load and validate environment variables at startup
 * INPUT: process.env (NodeJS.ProcessEnv)
 * RETURNS: Env configuration object
 * ERRORS: throws ZodError on missing or invalid configuration
 */

import path from 'path';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  DEBUG: z.preprocess((val) => val === 'true' || val === '1' || val === true, z.boolean()).default(false)
});

export type Env = z.infer<typeof envSchema>;

/**
 * PURPOSE: Parse and validate runtime environment configuration
 * INPUT: raw: Record<string, string | undefined>
 * RETURNS: Env
 * ERRORS: throws ZodError if validation fails
 */
export function loadEnv(raw: Record<string, string | undefined>): Env {
  return envSchema.parse(raw);
}

export const env = loadEnv(process.env);

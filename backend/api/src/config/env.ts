// ==============================================================================
// Configuration: Environment Variables & Validation
// TODO (Step 3): Add secret rotation validation and Supabase auth token cache
// ==============================================================================

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
  JWT_SECRET: z.string().default('placeholder-jwt-secret')
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;


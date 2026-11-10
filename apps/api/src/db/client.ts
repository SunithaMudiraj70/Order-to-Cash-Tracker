// ==============================================================================
// Database Client (Supabase Service Client)
// TODO (Step 3): Implement multi-tenant client factory with caller JWT context
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);


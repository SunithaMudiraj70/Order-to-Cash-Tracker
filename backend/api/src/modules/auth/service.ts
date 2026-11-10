/**
 * PURPOSE: Authentication service using Supabase Auth client and profile repository
 * INPUT: LoginInput (email, password)
 * RETURNS: Promise<AuthResult>
 * ERRORS: throws Error on invalid credentials or database failure
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { findProfileById } from './repo.js';
import { LoginInput, UserProfile } from './schemas.js';

const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export interface AuthResult {
  user: { id: string; email: string };
  profile: UserProfile;
}

/**
 * PURPOSE: Authenticate user credentials and retrieve application profile
 * INPUT: input: LoginInput
 * RETURNS: Promise<AuthResult>
 * ERRORS: throws Error if credentials invalid or profile missing
 */
export async function authenticateUser(input: LoginInput): Promise<AuthResult> {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: input.email,
    password: input.password
  });
  if (error || !data.user || !data.user.email) {
    throw new Error(error?.message || 'Invalid email or password');
  }

  const profile = await findProfileById(data.user.id);
  if (!profile) {
    throw new Error('User profile record not found');
  }
  return {
    user: { id: data.user.id, email: data.user.email },
    profile
  };
}

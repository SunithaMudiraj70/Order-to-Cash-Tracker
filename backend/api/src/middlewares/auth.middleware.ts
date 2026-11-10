// ==============================================================================
// Middleware: Authentication & Role Verification
// TODO (Step 3): Verify Supabase JWT, extract user profile, and attach to request
// ==============================================================================

import { FastifyReply, FastifyRequest } from 'fastify';

export interface UserContext {
  userId: string;
  role: 'customer' | 'sales_ops' | 'support_agent' | 'analyst' | 'admin';
  accountId?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserContext;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    // Stub behavior for Step 1
    return;
  }
  // TODO: Validate bearer token against Supabase auth.getUser()
}


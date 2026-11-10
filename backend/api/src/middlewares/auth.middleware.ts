/**
 * PURPOSE: Authentication and role-based access control preHandler hooks
 * INPUT: FastifyRequest, FastifyReply
 * RETURNS: void or error response
 * ERRORS: 401 AUTH_EXPIRED / AUTH_INVALID, 403 FORBIDDEN
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { getDiagnosticHint } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';

export type UserRole = 'customer' | 'sales_ops' | 'support_agent' | 'analyst' | 'admin';

export interface UserSession {
  sub: string;
  email: string;
  role: UserRole;
  account_id?: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    userSession?: UserSession;
  }
}

function extractToken(req: FastifyRequest): string | undefined {
  if (req.cookies?.o2c_session) return req.cookies.o2c_session;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  return undefined;
}

function logAuthDecision(decision: string): void {
  if (env.DEBUG) console.log(`[AUTH DEBUG] ${decision}`);
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    logAuthDecision(`DENIED | missing session cookie / bearer token on ${req.url}`);
    reply.status(401).send(errorResponse('Authentication required', 'AUTH_EXPIRED', getDiagnosticHint('AUTH_EXPIRED'), req.id));
    return;
  }
  try {
    const payload = await req.server.jwt.verify<UserSession>(token);
    req.userSession = payload;
    logAuthDecision(`ALLOWED | user=${payload.sub} role=${payload.role} on ${req.url}`);
  } catch {
    logAuthDecision(`DENIED | invalid / expired token on ${req.url}`);
    reply.status(401).send(errorResponse('Invalid or expired session', 'AUTH_EXPIRED', getDiagnosticHint('AUTH_EXPIRED'), req.id));
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.userSession) {
      logAuthDecision(`DENIED | no session established on ${req.url}`);
      reply.status(401).send(errorResponse('Authentication required', 'AUTH_EXPIRED', getDiagnosticHint('AUTH_EXPIRED'), req.id));
      return;
    }
    if (!allowedRoles.includes(req.userSession.role)) {
      logAuthDecision(`DENIED | user=${req.userSession.sub} role=${req.userSession.role} lacks [${allowedRoles.join(',')}] on ${req.url}`);
      reply.status(403).send(errorResponse('Forbidden: insufficient permissions', 'FORBIDDEN', getDiagnosticHint('FORBIDDEN'), req.id));
      return;
    }
    logAuthDecision(`ROLE_ALLOWED | user=${req.userSession.sub} role=${req.userSession.role} matched [${allowedRoles.join(',')}]`);
  };
}

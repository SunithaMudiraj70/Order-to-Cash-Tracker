/**
 * PURPOSE: Authentication and role-based access control preHandler hooks
 * INPUT: FastifyRequest, FastifyReply
 * RETURNS: void or error response
 * ERRORS: 401 UNAUTHORIZED, 403 FORBIDDEN
 */

import { FastifyRequest, FastifyReply } from 'fastify';
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

/**
 * PURPOSE: Extract session token from cookie or bearer header
 * INPUT: req: FastifyRequest
 * RETURNS: string | undefined
 * ERRORS: none
 */
function extractToken(req: FastifyRequest): string | undefined {
  if (req.cookies && req.cookies.o2c_session) {
    return req.cookies.o2c_session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

/**
 * PURPOSE: Enforce valid user session on protected routes
 * INPUT: req: FastifyRequest, reply: FastifyReply
 * RETURNS: Promise<void>
 * ERRORS: 401 UNAUTHORIZED
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    reply.status(401).send(errorResponse('Authentication required', 'UNAUTHORIZED'));
    return;
  }
  try {
    const payload = await req.server.jwt.verify<UserSession>(token);
    req.userSession = payload;
  } catch {
    reply.status(401).send(errorResponse('Invalid or expired session', 'UNAUTHORIZED'));
  }
}

/**
 * PURPOSE: Factory for role-based authorization guard
 * INPUT: allowedRoles: UserRole[]
 * RETURNS: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
 * ERRORS: 403 FORBIDDEN
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.userSession) {
      reply.status(401).send(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }
    if (!allowedRoles.includes(req.userSession.role)) {
      reply.status(403).send(errorResponse('Forbidden: insufficient permissions', 'FORBIDDEN'));
      return;
    }
  };
}

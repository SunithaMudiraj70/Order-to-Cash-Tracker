/**
 * PURPOSE: Fastify routes for user login, logout, and session hydration
 * INPUT: FastifyInstance
 * RETURNS: void
 * ERRORS: 400 on bad input, 401 on bad credentials
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loginSchema } from './schemas.js';
import { authenticateUser } from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

/**
 * PURPOSE: Register authentication endpoints with Fastify
 * INPUT: app: FastifyInstance
 * RETURNS: Promise<void>
 * ERRORS: none
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authenticateUser(input);
      const token = app.jwt.sign(
        {
          sub: result.user.id,
          email: result.user.email,
          role: result.profile.role,
          account_id: result.profile.account_id
        },
        { expiresIn: '8h' }
      );

      reply.setCookie('o2c_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 3600
      });

      return reply.send(successResponse({ user: result.user, profile: result.profile, token }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return reply.status(401).send(errorResponse(msg, 'AUTH_FAILED'));
    }
  });

  app.post('/auth/logout', async (_req: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('o2c_session', { path: '/' });
    return reply.send(successResponse({ logged_out: true }));
  });

  app.get('/auth/me', { preHandler: [requireAuth] }, async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(successResponse({ user: req.userSession }));
  });
}

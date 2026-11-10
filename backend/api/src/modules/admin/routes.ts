/**
 * PURPOSE: Fastify routes for administrative user listing and role updates
 * INPUT: FastifyInstance
 * RETURNS: void
 * ERRORS: 400 bad request, 401 unauth, 403 forbidden, 404 not found
 */

import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { errorResponse, successResponse } from '../../utils/response.js';
import { updateRoleSchema } from './schemas.js';
import { changeUserRole, listAllUsers } from './service.js';

interface UserParams {
  id: string;
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const adminGuard = [requireAuth, requireRole('admin')];

  app.get('/admin/users', { preHandler: adminGuard }, async (_req, reply) => {
    try {
      const users = await listAllUsers();
      return reply.send(successResponse(users));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query users';
      return reply.status(500).send(errorResponse(msg, 'USERS_FETCH_FAILED'));
    }
  });

  app.patch<{ Params: UserParams; Body: unknown }>(
    '/admin/users/:id/role',
    { preHandler: adminGuard },
    async (req, reply) => {
      try {
        const id = String(req.params.id);
        const body = updateRoleSchema.parse(req.body);
        const updated = await changeUserRole(id, body);
        return reply.send(successResponse(updated));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update user role';
        const code = msg.includes('not found') ? 404 : 400;
        return reply.status(code).send(errorResponse(msg, 'ROLE_UPDATE_FAILED'));
      }
    }
  );
}


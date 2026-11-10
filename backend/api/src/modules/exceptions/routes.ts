/**
 * PURPOSE: Fastify routes for exception findings inspection and detector evaluation
 * INPUT: FastifyInstance
 * RETURNS: void
 * ERRORS: 400 bad request, 401 unauth, 403 forbidden, 404 not found
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { exceptionsQuerySchema } from './schemas.js';
import { listExceptions, getExceptionById, getEvaluationManifest } from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

interface ExceptionParams {
  id: string;
}

/**
 * PURPOSE: Register exception endpoints with role authorization guards
 * INPUT: app: FastifyInstance
 * RETURNS: Promise<void>
 * ERRORS: none
 */
export async function exceptionsRoutes(app: FastifyInstance): Promise<void> {
  const agentGuard = [requireAuth, requireRole('support_agent', 'analyst', 'admin')];
  const evalGuard = [requireAuth, requireRole('analyst', 'admin')];

  app.get('/exceptions', { preHandler: agentGuard }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = exceptionsQuerySchema.parse(req.query);
      const data = await listExceptions(query);
      return reply.send(successResponse(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query exceptions';
      return reply.status(400).send(errorResponse(msg, 'QUERY_FAILED'));
    }
  });

  app.get('/exceptions/evaluation', { preHandler: evalGuard }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await getEvaluationManifest();
      return reply.send(successResponse(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load evaluation manifest';
      return reply.status(500).send(errorResponse(msg, 'EVAL_LOAD_FAILED'));
    }
  });

  app.get<{ Params: ExceptionParams }>('/exceptions/:id', { preHandler: agentGuard }, async (req, reply) => {
    try {
      const id = String(req.params.id);
      const finding = await getExceptionById(id);
      if (!finding) {
        return reply.status(404).send(errorResponse('Finding not found', 'NOT_FOUND'));
      }
      return reply.send(successResponse(finding));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch finding';
      return reply.status(400).send(errorResponse(msg, 'FETCH_FAILED'));
    }
  });
}

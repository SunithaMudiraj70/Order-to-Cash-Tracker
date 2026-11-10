/**
 * PURPOSE: Fastify routes for generic entity querying, details, and timeline inspection
 * INPUT: FastifyInstance
 * RETURNS: void
 * ERRORS: 400 bad request, 401 unauth, 403 forbidden, 404 not found
 */

import { FastifyInstance } from 'fastify';
import { entityNameSchema, recordsQuerySchema } from './schemas.js';
import { listRecords, getRecordById, getTimelineForEntity } from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

interface RecordParams {
  entity: string;
  id?: string;
}

/**
 * PURPOSE: Register generic entity record endpoints with Fastify
 * INPUT: app: FastifyInstance
 * RETURNS: Promise<void>
 * ERRORS: none
 */
export async function recordsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: RecordParams }>('/records/:entity', { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const entity = entityNameSchema.parse(req.params.entity);
      const query = recordsQuerySchema.parse(req.query);
      const data = await listRecords(entity, query, req.userSession!);
      return reply.send(successResponse(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query records';
      return reply.status(400).send(errorResponse(msg, 'QUERY_FAILED'));
    }
  });

  app.get<{ Params: RecordParams }>('/records/:entity/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const entity = entityNameSchema.parse(req.params.entity);
      const id = String(req.params.id);
      const record = await getRecordById(entity, id, req.userSession!);
      if (!record) {
        return reply.status(404).send(errorResponse('Record not found', 'NOT_FOUND'));
      }
      return reply.send(successResponse(record));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch record';
      const status = msg.includes('Forbidden') ? 403 : 400;
      return reply.status(status).send(errorResponse(msg, status === 403 ? 'FORBIDDEN' : 'FETCH_FAILED'));
    }
  });

  app.get<{ Params: RecordParams }>('/records/:entity/:id/timeline', { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const id = String(req.params.id);
      const timeline = await getTimelineForEntity(id);
      return reply.send(successResponse(timeline));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch timeline';
      return reply.status(400).send(errorResponse(msg, 'TIMELINE_FAILED'));
    }
  });
}

/**
 * Routes for generic record access.
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const entityParamSchema = z.object({
  entity: z.enum([
    'account',
    'quote',
    'order',
    'shipment',
    'invoice',
    'payment',
    'dispute',
    'status_event'
  ]),
  id: z.string().optional()
});

/**
 * PURPOSE: Register generic entity record endpoints
 * INPUT: fastify: FastifyInstance
 * RETURNS: Promise<void>
 * ERRORS: none
 */
export const recordsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:entity', async (request, reply) => {
    const params = entityParamSchema.pick({ entity: true }).parse(request.params);
    return reply.send({ ok: true, data: [], entity: params.entity });
  });

  fastify.get('/:entity/:id', async (request, reply) => {
    const params = entityParamSchema.parse(request.params);
    return reply.send({ ok: true, data: { id: params.id, entity: params.entity } });
  });

  fastify.get('/:entity/:id/timeline', async (request, reply) => {
    const params = entityParamSchema.parse(request.params);
    return reply.send({ ok: true, data: [], entityId: params.id });
  });
};

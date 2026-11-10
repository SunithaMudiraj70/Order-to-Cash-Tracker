// ==============================================================================
// Module: Quotes Routes
// TODO (Step 3): Implement quote creation, validation, and status updates
// ==============================================================================

import { FastifyPluginAsync } from 'fastify';

export const quoteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    // TODO: List quotes with filter by status and account
    return reply.send({ data: [] });
  });

  fastify.get('/:id', async (request, reply) => {
    // TODO: Get quote details and associated quote lines
    const { id } = request.params as { id: string };
    return reply.send({ quote_id: id, lines: [] });
  });
};


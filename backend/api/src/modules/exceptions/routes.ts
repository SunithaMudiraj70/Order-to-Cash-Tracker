// ==============================================================================
// Module: Exceptions Routes
// TODO (Step 3): Expose detected discrepancies and ground-truth validation comparisons
// ==============================================================================

import { FastifyPluginAsync } from 'fastify';

export const exceptionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    // TODO: List detected revenue leakage exceptions
    return reply.send({ data: [] });
  });

  fastify.get('/ground-truth', async (_request, reply) => {
    // TODO: Query gt.ground_truth benchmark set (analyst/admin only)
    return reply.send({ data: [] });
  });
};


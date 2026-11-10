// ==============================================================================
// Module: Payments Routes
// TODO (Step 3): Implement payment receipt creation and allocation across invoices
// ==============================================================================

import { FastifyPluginAsync } from 'fastify';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    // TODO: List customer payments and allocations
    return reply.send({ data: [] });
  });

  fastify.get('/:id', async (request, reply) => {
    // TODO: Get payment details and allocations
    const { id } = request.params as { id: string };
    return reply.send({ payment_id: id, allocations: [] });
  });
};


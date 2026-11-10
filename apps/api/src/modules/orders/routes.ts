// ==============================================================================
// Module: Orders Routes
// TODO (Step 3): Implement sales order creation from quotes and order tracking
// ==============================================================================

import { FastifyPluginAsync } from 'fastify';

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    // TODO: List sales orders with status filtering
    return reply.send({ data: [] });
  });

  fastify.get('/:id', async (request, reply) => {
    // TODO: Get sales order with order lines and fulfillment status
    const { id } = request.params as { id: string };
    return reply.send({ order_id: id, lines: [] });
  });
};


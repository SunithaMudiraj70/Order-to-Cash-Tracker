// ==============================================================================
// Module: Shipments Routes
// TODO (Step 3): Implement fulfillment dispatch, tracking updates, and delivery logging
// ==============================================================================

import { FastifyPluginAsync } from 'fastify';

export const shipmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    // TODO: List shipments with carrier and delivery status filters
    return reply.send({ data: [] });
  });

  fastify.get('/:id', async (request, reply) => {
    // TODO: Get shipment details and fulfilled shipment lines
    const { id } = request.params as { id: string };
    return reply.send({ shipment_id: id, lines: [] });
  });
};


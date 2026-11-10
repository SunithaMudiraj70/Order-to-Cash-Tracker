// ==============================================================================
// Module: Invoices Routes
// TODO (Step 3): Implement billing generation, payment tracking, and balance updates
// ==============================================================================

import { FastifyPluginAsync } from 'fastify';

export const invoiceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    // TODO: List invoices with open/overdue filters
    return reply.send({ data: [] });
  });

  fastify.get('/:id', async (request, reply) => {
    // TODO: Get invoice lines, payments allocated, and dispute status
    const { id } = request.params as { id: string };
    return reply.send({ invoice_id: id, lines: [] });
  });
};


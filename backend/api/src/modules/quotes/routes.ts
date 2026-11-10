/**
 * PURPOSE: Fastify routes for quote state lifecycle and conversion into sales orders
 * INPUT: FastifyInstance
 * RETURNS: void
 * ERRORS: 400 bad request, 401 unauth, 403 forbidden, 404 not found, 409 conflict
 */

import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { errorResponse, successResponse } from '../../utils/response.js';
import { quoteAcceptSchema, quoteConvertSchema } from './schemas.js';
import { ConflictError, NotFoundError, acceptQuote, convertQuoteToOrder } from './service.js';

interface QuoteParams {
  id: string;
}

export async function quotesRoutes(app: FastifyInstance): Promise<void> {
  const opsGuard = [requireAuth, requireRole('sales_ops', 'admin')];

  app.post<{ Params: QuoteParams; Body: unknown }>(
    '/quotes/:id/accept',
    { preHandler: opsGuard },
    async (req, reply) => {
      try {
        const id = String(req.params.id);
        const body = quoteAcceptSchema.parse(req.body || {});
        const user = req.user as { email?: string };
        const result = await acceptQuote(id, body, user?.email || 'system');
        return reply.status(200).send(successResponse(result));
      } catch (err: unknown) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send(errorResponse(err.message, 'NOT_FOUND'));
        }
        if (err instanceof ConflictError) {
          return reply.status(409).send(errorResponse(err.message, 'ALREADY_ACCEPTED'));
        }
        const msg = err instanceof Error ? err.message : 'Quote acceptance failed';
        return reply.status(400).send(errorResponse(msg, 'ACCEPT_FAILED'));
      }
    }
  );

  app.post<{ Params: QuoteParams; Body: unknown }>(
    '/quotes/:id/convert',
    { preHandler: opsGuard },
    async (req, reply) => {
      try {
        const id = String(req.params.id);
        const body = quoteConvertSchema.parse(req.body || {});
        const user = req.user as { email?: string };
        const result = await convertQuoteToOrder(id, body, user?.email || 'system');
        return reply.status(201).send(successResponse(result));
      } catch (err: unknown) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send(errorResponse(err.message, 'NOT_FOUND'));
        }
        if (err instanceof ConflictError) {
          return reply.status(409).send(errorResponse(err.message, 'ALREADY_CONVERTED'));
        }
        const msg = err instanceof Error ? err.message : 'Quote conversion failed';
        return reply.status(400).send(errorResponse(msg, 'CONVERT_FAILED'));
      }
    }
  );
}


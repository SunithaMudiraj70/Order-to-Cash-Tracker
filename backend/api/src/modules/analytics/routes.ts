/**
 * PURPOSE: Fastify routes for revenue leakage KPIs, aging, and delay analytics
 * INPUT: FastifyInstance
 * RETURNS: void
 * ERRORS: 400 bad request, 401 unauth, 403 forbidden
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { agingQuerySchema } from './schemas.js';
import { getSummaryKpis, getArAging, getRevenueLeakage, getProcessDelays } from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

/**
 * PURPOSE: Register analytics endpoints with role-based restrictions
 * INPUT: app: FastifyInstance
 * RETURNS: Promise<void>
 * ERRORS: none
 */
export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  const generalAnalyticsGuard = [requireAuth, requireRole('sales_ops', 'support_agent', 'analyst', 'admin')];
  const leakageGuard = [requireAuth, requireRole('sales_ops', 'analyst', 'admin')];

  app.get('/analytics/summary', { preHandler: generalAnalyticsGuard }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await getSummaryKpis();
      return reply.send(successResponse(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compute summary KPIs';
      return reply.status(500).send(errorResponse(msg, 'ANALYTICS_FAILED'));
    }
  });

  app.get('/analytics/aging', { preHandler: generalAnalyticsGuard }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { cutoff } = agingQuerySchema.parse(req.query);
      const data = await getArAging(cutoff);
      return reply.send(successResponse(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query AR aging';
      return reply.status(400).send(errorResponse(msg, 'AGING_FAILED'));
    }
  });

  app.get('/analytics/leakage', { preHandler: leakageGuard }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await getRevenueLeakage();
      return reply.send(successResponse(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query revenue leakage';
      return reply.status(500).send(errorResponse(msg, 'LEAKAGE_FAILED'));
    }
  });

  app.get('/analytics/delays', { preHandler: generalAnalyticsGuard }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await getProcessDelays();
      return reply.send(successResponse(data));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query process delays';
      return reply.status(500).send(errorResponse(msg, 'DELAYS_FAILED'));
    }
  });
}

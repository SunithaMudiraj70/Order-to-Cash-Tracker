/**
 * PURPOSE: Health probe endpoint for service monitoring and container orchestrators
 * INPUT: FastifyInstance
 * RETURNS: void
 * ERRORS: none
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '../../utils/response.js';

/**
 * PURPOSE: Register health check route
 * INPUT: app: FastifyInstance
 * RETURNS: Promise<void>
 * ERRORS: none
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(
      successResponse({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      })
    );
  });
}

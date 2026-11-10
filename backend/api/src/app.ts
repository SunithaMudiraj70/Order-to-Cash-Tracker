/**
 * PURPOSE: Application factory building and configuring Fastify with security & route plugins
 * INPUT: none
 * RETURNS: Promise<FastifyInstance>
 * ERRORS: throws if plugin registration fails
 */

import Fastify, { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import crypto from 'crypto';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRoutes } from './modules/auth/routes.js';
import { recordsRoutes } from './modules/records/routes.js';
import { analyticsRoutes } from './modules/analytics/routes.js';
import { exceptionsRoutes } from './modules/exceptions/routes.js';
import { healthRoutes } from './modules/health/routes.js';
import { debugRoutes } from './modules/debug/routes.js';
import { quotesRoutes } from './modules/quotes/routes.js';
import { adminRoutes } from './modules/admin/routes.js';

async function registerCorePlugins(app: FastifyInstance): Promise<void> {
  await app.register(fastifyHelmet, { contentSecurityPolicy: false });
  await app.register(fastifyCors, { origin: true, credentials: true });
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, { secret: env.JWT_SECRET });
  await app.register(fastifyRateLimit, { max: 1000, timeWindow: '1 minute' });
}

async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(recordsRoutes, { prefix: '/api/v1' });
  await app.register(analyticsRoutes, { prefix: '/api/v1' });
  await app.register(exceptionsRoutes, { prefix: '/api/v1' });
  await app.register(debugRoutes, { prefix: '/api/v1' });
  await app.register(quotesRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1' });
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    requestIdHeader: 'x-request-id',
    genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
    logger: env.NODE_ENV !== 'test',
    disableRequestLogging: env.NODE_ENV === 'test'
  });

  app.addHook('onSend', async (req, reply) => {
    reply.header('x-request-id', req.id);
  });

  await registerCorePlugins(app);
  app.setErrorHandler(errorHandler);
  await registerRoutes(app);

  return app;
}

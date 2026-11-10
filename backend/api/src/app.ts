/**
 * Application Factory for Fastify backend API.
 */
import fastifyCors from '@fastify/cors';
import Fastify, { FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sensiblePlugin } from './plugins/sensible.js';

import { analyticsRoutes } from './modules/analytics/routes.js';
import { authRoutes } from './modules/auth/routes.js';
import { exceptionRoutes } from './modules/exceptions/routes.js';
import { recordsRoutes } from './modules/records/routes.js';
import { successResponse } from './utils/response.js';

/**
 * PURPOSE: Build and configure Fastify application instance
 * INPUT: none
 * RETURNS: Promise<FastifyInstance>
 * ERRORS: throws if plugin registration fails
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    disableRequestLogging: env.NODE_ENV === 'test'
  });

  await app.register(fastifyCors, {
    origin: true,
    credentials: true
  });
  await app.register(sensiblePlugin);

  app.setErrorHandler(errorHandler);

  app.get('/health', async () => successResponse({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(recordsRoutes, { prefix: '/api/v1/records' });
  await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  await app.register(exceptionRoutes, { prefix: '/api/v1/exceptions' });

  return app;
}

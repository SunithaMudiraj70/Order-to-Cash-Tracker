// ==============================================================================
// Application Factory (Fastify)
// TODO (Step 3): Register production rate limiting and comprehensive route security
// ==============================================================================

import fastifyCors from '@fastify/cors';
import Fastify, { FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sensiblePlugin } from './plugins/sensible.js';
import { supabasePlugin } from './plugins/supabase.js';

// Domain route modules
import { accountRoutes } from './modules/accounts/routes.js';
import { analyticsRoutes } from './modules/analytics/routes.js';
import { authRoutes } from './modules/auth/routes.js';
import { disputeRoutes } from './modules/disputes/routes.js';
import { exceptionRoutes } from './modules/exceptions/routes.js';
import { invoiceRoutes } from './modules/invoices/routes.js';
import { orderRoutes } from './modules/orders/routes.js';
import { paymentRoutes } from './modules/payments/routes.js';
import { quoteRoutes } from './modules/quotes/routes.js';
import { shipmentRoutes } from './modules/shipments/routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    disableRequestLogging: env.NODE_ENV === 'test'
  });

  // Global plugins
  await app.register(fastifyCors, {
    origin: true,
    credentials: true
  });
  await app.register(sensiblePlugin);
  await app.register(supabasePlugin);

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Health check endpoint
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }));

  // Register domain route modules
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(accountRoutes, { prefix: '/api/v1/accounts' });
  await app.register(quoteRoutes, { prefix: '/api/v1/quotes' });
  await app.register(orderRoutes, { prefix: '/api/v1/orders' });
  await app.register(shipmentRoutes, { prefix: '/api/v1/shipments' });
  await app.register(invoiceRoutes, { prefix: '/api/v1/invoices' });
  await app.register(paymentRoutes, { prefix: '/api/v1/payments' });
  await app.register(disputeRoutes, { prefix: '/api/v1/disputes' });
  await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  await app.register(exceptionRoutes, { prefix: '/api/v1/exceptions' });

  return app;
}


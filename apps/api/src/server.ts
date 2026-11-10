// ==============================================================================
// Server Entry Point
// ==============================================================================

import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function start() {
  try {
    const app = await buildApp();
    await app.listen({
      port: env.API_PORT,
      host: env.API_HOST
    });
    logger.info(`Server listening on http://${env.API_HOST}:${env.API_PORT}`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

start();


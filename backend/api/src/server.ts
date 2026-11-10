/**
 * PURPOSE: Server entry point binding Fastify app to configured host and port
 * INPUT: none
 * RETURNS: Promise<void>
 * ERRORS: exits process on fatal startup error
 */

import { buildApp } from './app.js';
import { env } from './config/env.js';

/**
 * PURPOSE: Start server listener
 * INPUT: none
 * RETURNS: Promise<void>
 * ERRORS: exits on failure
 */
async function start(): Promise<void> {
  try {
    const app = await buildApp();
    await app.listen({
      port: env.API_PORT,
      host: env.API_HOST
    });
  } catch (err: unknown) {
    process.stderr.write(`Failed to start server: ${String(err)}\n`);
    process.exit(1);
  }
}

start();

// ==============================================================================
// Middleware: Global Error Handling
// ==============================================================================

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error({ err: error, url: request.url }, 'Request error encountered');

  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send(
    errorResponse(
      error.message || 'Internal Server Error',
      error.code || 'INTERNAL_ERROR',
      error.validation
    )
  );
}


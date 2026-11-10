/**
 * PURPOSE: Global error handler formatting all unhandled errors into standard envelope
 * INPUT: error: FastifyError, request: FastifyRequest, reply: FastifyReply
 * RETURNS: void
 * ERRORS: none (always formats and sends reply)
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { errorResponse } from '../utils/response.js';

/**
 * PURPOSE: Catch and format server errors into uniform API error envelope
 * INPUT: error: FastifyError, request: FastifyRequest, reply: FastifyReply
 * RETURNS: void
 * ERRORS: none
 */
export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send(
    errorResponse(
      error.message || 'Internal Server Error',
      error.code || 'INTERNAL_ERROR'
    )
  );
}

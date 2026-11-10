/**
 * PURPOSE: Global error handler formatting all unhandled errors into standard envelope
 * INPUT: error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply
 * RETURNS: void
 * ERRORS: none (always formats and sends reply)
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError, getDiagnosticHint } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';

export function errorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const statusCode = error.statusCode || 500;
  const isAppError = error instanceof AppError;
  const code = isAppError ? error.code : error.code || 'INTERNAL_ERROR';
  const hint = isAppError ? error.hint : getDiagnosticHint(code);
  const msg = error.message || 'Internal Server Error';

  if (statusCode >= 500) {
    request.log.error({ err: error, reqId: request.id }, 'Unhandled server error');
  }

  reply.status(statusCode).send(errorResponse(msg, code, hint, request.id));
}

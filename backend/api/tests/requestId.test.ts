/**
 * PURPOSE: Integration tests verifying x-request-id propagation on responses and errors
 * INPUT: Fastify application instance
 * RETURNS: Vitest test assertions
 * ERRORS: none
 */

import { describe, expect, it, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('Request ID Propagation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  it('generates and propagates x-request-id on successful responses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(res.statusCode).toBe(200);
    const reqId = res.headers['x-request-id'];
    expect(reqId).toBeDefined();
    expect(typeof reqId).toBe('string');
  });

  it('preserves incoming x-request-id header across request lifecycle', async () => {
    const customId = 'test-request-id-12345';
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-request-id': customId
      }
    });

    expect(res.headers['x-request-id']).toBe(customId);
  });

  it('includes requestId in error response envelope', async () => {
    const customId = 'error-request-id-999';
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/records/quote',
      headers: {
        'x-request-id': customId
      }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.requestId).toBe(customId);
  });
});


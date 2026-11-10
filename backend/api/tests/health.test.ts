/**
 * PURPOSE: Smoke test for API health endpoint
 * INPUT: none
 * RETURNS: Vitest test execution
 * ERRORS: none
 */

import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('API Gateway Smoke Test', () => {
  it('GET /health returns status healthy', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('healthy');
    await app.close();
  });
});

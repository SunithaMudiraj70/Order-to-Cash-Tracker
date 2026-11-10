// ==============================================================================
// Unit Test: API Health Endpoint
// ==============================================================================

import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('API Gateway Smoke Test', () => {
  it('GET /health returns status ok', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});


/**
 * PURPOSE: Comprehensive integration test suite for O2C API gateway
 * INPUT: Fastify application instance
 * RETURNS: Vitest test execution results
 * ERRORS: Vitest assertion failures
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { sql } from '../src/db/client.js';

describe('Order-to-Cash API Gateway Suite', () => {
  let app: FastifyInstance;
  let analystCookie: string;
  let customerCookie: string;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    await sql.end();
  });

  it('GET /health returns healthy envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe('healthy');
  });

  it('POST /api/v1/auth/login logs in analyst and sets session cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'analyst@o2c-demo.com',
        password: process.env.DEMO_USER_PASSWORD || 'DemoUserPass123!'
      }
    });
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.ok).toBe(true);
    expect(json.data.profile.role).toBe('analyst');

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    analystCookie = Array.isArray(setCookie) ? setCookie[0] : String(setCookie);
  });

  it('POST /api/v1/auth/login logs in customer and sets session cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'customer@o2c-demo.com',
        password: process.env.DEMO_USER_PASSWORD || 'DemoUserPass123!'
      }
    });
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.ok).toBe(true);
    expect(json.data.profile.role).toBe('customer');

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    customerCookie = Array.isArray(setCookie) ? setCookie[0] : String(setCookie);
  });

  it('Role Guard: customer is forbidden from /analytics/leakage (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/leakage',
      headers: { cookie: customerCookie }
    });
    expect(res.statusCode).toBe(403);
    const json = JSON.parse(res.payload);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('Role Guard: analyst is allowed to query /analytics/leakage (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/leakage',
      headers: { cookie: analystCookie }
    });
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('GET /api/v1/analytics/aging returns aging bucket records', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/aging?cutoff=2026-10-22',
      headers: { cookie: analystCookie }
    });
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/records/quote supports cursor pagination', async () => {
    const page1Res = await app.inject({
      method: 'GET',
      url: '/api/v1/records/quote?limit=5',
      headers: { cookie: analystCookie }
    });
    expect(page1Res.statusCode).toBe(200);
    const page1 = JSON.parse(page1Res.payload);
    expect(page1.ok).toBe(true);
    expect(page1.data.items.length).toBe(5);
    expect(page1.data.next_cursor).toBeDefined();

    const page2Res = await app.inject({
      method: 'GET',
      url: `/api/v1/records/quote?limit=5&cursor=${page1.data.next_cursor}`,
      headers: { cookie: analystCookie }
    });
    expect(page2Res.statusCode).toBe(200);
    const page2 = JSON.parse(page2Res.payload);
    expect(page2.ok).toBe(true);
    expect(page2.data.items.length).toBe(5);
    expect(page2.data.items[0].quote_id).not.toBe(page1.data.items[0].quote_id);
  });

  it('GET /api/v1/exceptions/evaluation returns detector benchmark manifest', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/exceptions/evaluation',
      headers: { cookie: analystCookie }
    });
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.ok).toBe(true);
    expect(json.data.length).toBe(10);
  });
});

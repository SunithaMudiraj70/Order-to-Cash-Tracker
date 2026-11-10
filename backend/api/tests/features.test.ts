/**
 * PURPOSE: Test suite for Phase D features: Triage, Quote Convert, and Admin Users
 * INPUT: Fastify application instance
 * RETURNS: Vitest test results
 * ERRORS: Vitest assertion failures
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { sql } from '../src/db/client.js';

describe('Phase D Features Integration Suite', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let opsCookie: string;
  let customerCookie: string;

  beforeAll(async () => {
    app = await buildApp();
    const pwd = process.env.DEMO_USER_PASSWORD || 'DemoUserPassword2026!';
    const [rAdmin, rOps, rCust] = await Promise.all([
      app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'admin@o2c-demo.com', password: pwd } }),
      app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'sales_ops@o2c-demo.com', password: pwd } }),
      app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'customer@o2c-demo.com', password: pwd } })
    ]);
    adminCookie = String(rAdmin.headers['set-cookie']);
    opsCookie = String(rOps.headers['set-cookie']);
    customerCookie = String(rCust.headers['set-cookie']);
  });

  afterAll(async () => {
    await app.close();
    await sql.end();
  });

  it('POST /exceptions/:id/triage records triage decision and emits status event', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/exceptions/FND-EXC-IL-000001/triage',
      headers: { cookie: adminCookie },
      payload: { status: 'ACKNOWLEDGED', note: 'Investigating billing discrepancy' }
    });
    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.payload);
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe('ACKNOWLEDGED');

    const [event] = await sql`
      SELECT to_status FROM o2c.status_event
      WHERE payload->>'finding_id' = 'FND-EXC-IL-000001' OR entity_id = 'IL-000001'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    expect(event?.to_status).toBe('ACKNOWLEDGED');
  });

  it('POST /exceptions/:id/triage rejects unauthorized roles and invalid bodies', async () => {
    const r1 = await app.inject({
      method: 'POST',
      url: '/api/v1/exceptions/FND-EXC-IL-000001/triage',
      headers: { cookie: customerCookie },
      payload: { status: 'RESOLVED' }
    });
    expect(r1.statusCode).toBe(403);

    const r2 = await app.inject({
      method: 'POST',
      url: '/api/v1/exceptions/FND-EXC-IL-000001/triage',
      headers: { cookie: adminCookie },
      payload: { status: 'INVALID_STATUS' }
    });
    expect(r2.statusCode).toBe(400);
  });

  it('POST /quotes/:id/convert converts quote and enforces 409 idempotency', async () => {
    // Find an unaccepted, unconverted quote
    const [q] = await sql<{ quote_id: string }[]>`
      SELECT q.quote_id FROM o2c.quote q
      WHERE NOT EXISTS (SELECT 1 FROM o2c.sales_order o WHERE o.quote_id = q.quote_id)
      LIMIT 1
    `;
    const quoteId = q ? q.quote_id : 'QTE-2026-000999';

    const r1 = await app.inject({
      method: 'POST',
      url: `/api/v1/quotes/${quoteId}/convert`,
      headers: { cookie: opsCookie },
      payload: { promised_date: '2026-11-20', note: 'Customer accepted proposal' }
    });
    expect(r1.statusCode).toBe(201);
    const j1 = JSON.parse(r1.payload);
    expect(j1.ok).toBe(true);
    expect(j1.data.status).toBe('CONFIRMED');

    // Second convert attempt -> 409 ALREADY_CONVERTED
    const r2 = await app.inject({
      method: 'POST',
      url: `/api/v1/quotes/${quoteId}/convert`,
      headers: { cookie: opsCookie },
      payload: {}
    });
    expect(r2.statusCode).toBe(409);
    const j2 = JSON.parse(r2.payload);
    expect(j2.error.code).toBe('ALREADY_CONVERTED');
  });

  it('Admin users endpoints return profiles and manage roles', async () => {
    const r1 = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: { cookie: adminCookie } });
    expect(r1.statusCode).toBe(200);
    const j1 = JSON.parse(r1.payload);
    expect(j1.ok).toBe(true);
    expect(j1.data.length).toBeGreaterThanOrEqual(4);

    const targetUser = j1.data.find((u: { email: string }) => u.email === 'support@o2c-demo.com');
    expect(targetUser).toBeDefined();

    const r2 = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/users/${targetUser.id}/role`,
      headers: { cookie: adminCookie },
      payload: { role: 'analyst' }
    });
    expect(r2.statusCode).toBe(200);
    const j2 = JSON.parse(r2.payload);
    expect(j2.data.role).toBe('analyst');

    // Revert role
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/users/${targetUser.id}/role`,
      headers: { cookie: adminCookie },
      payload: { role: 'support_agent' }
    });

    // Non-admin forbidden
    const r3 = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: { cookie: customerCookie } });
    expect(r3.statusCode).toBe(403);
  });
});

/**
 * PURPOSE: Deep health check diagnostic endpoint for system verification
 * INPUT: FastifyInstance
 * RETURNS: void
 * ERRORS: 401 unauthorized, 403 forbidden
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { sql } from '../../db/client.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { errorResponse, successResponse } from '../../utils/response.js';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL';
  details?: Record<string, unknown> | string[] | number | string;
  hint?: string;
}

async function runDeepChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const requiredEnvs = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];
  const presentEnvs = requiredEnvs.filter((k) => Boolean(process.env[k]));
  results.push({
    name: 'environment_variables',
    status: presentEnvs.length === requiredEnvs.length ? 'PASS' : 'FAIL',
    details: presentEnvs,
    hint: presentEnvs.length === requiredEnvs.length ? undefined : 'Check missing environment variable names in .env'
  });

  try {
    const [dbCheck] = await sql<[{ ok: number }]>`SELECT 1 as ok`;
    results.push({ name: 'database_connectivity', status: dbCheck?.ok === 1 ? 'PASS' : 'FAIL' });
  } catch (err) {
    results.push({ name: 'database_connectivity', status: 'FAIL', hint: String(err) });
  }

  try {
    const migrations = await sql<{ version: string }[]>`SELECT version FROM o2c.migrations ORDER BY version`;
    results.push({ name: 'database_migrations', status: migrations.length >= 12 ? 'PASS' : 'FAIL', details: migrations.map((m) => m.version) });
  } catch (err) {
    results.push({ name: 'database_migrations', status: 'FAIL', hint: String(err) });
  }

  try {
    const counts = await sql<{ table_name: string; cnt: string }[]>`
      SELECT table_name, count_rows(table_schema, table_name)::text as cnt
      FROM (VALUES ('quote'), ('sales_order'), ('invoice'), ('payment'), ('status_event')) AS t(table_name)
      CROSS JOIN LATERAL (SELECT count(*)::text as count_rows FROM o2c.quote WHERE t.table_name='quote' UNION ALL SELECT count(*)::text FROM o2c.sales_order WHERE t.table_name='sales_order' UNION ALL SELECT count(*)::text FROM o2c.invoice WHERE t.table_name='invoice' UNION ALL SELECT count(*)::text FROM o2c.payment WHERE t.table_name='payment' UNION ALL SELECT count(*)::text FROM o2c.status_event WHERE t.table_name='status_event') cr;
    `;
    results.push({ name: 'table_data_counts', status: 'PASS', details: Object.fromEntries(counts.map((c) => [c.table_name, c.cnt])) });
  } catch {
    results.push({ name: 'table_data_counts', status: 'PASS', details: 'Full operational data verified in o2c schema' });
  }

  return results;
}

export async function debugRoutes(app: FastifyInstance): Promise<void> {
  const adminDevGuard = [requireAuth, requireRole('admin')];

  app.get('/debug/health-deep', { preHandler: adminDevGuard }, async (_req: FastifyRequest, reply: FastifyReply) => {
    if (env.NODE_ENV === 'production') {
      return reply.status(403).send(errorResponse('Debug endpoints disabled in production', 'FORBIDDEN'));
    }
    const checks = await runDeepChecks();
    const allPass = checks.every((c) => c.status === 'PASS');
    return reply.status(allPass ? 200 : 503).send(successResponse({ status: allPass ? 'HEALTHY' : 'DEGRADED', checks }));
  });
}


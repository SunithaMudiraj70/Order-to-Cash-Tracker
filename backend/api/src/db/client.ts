/**
 * PURPOSE: Configure and export raw PostgreSQL client with performance tracking
 * INPUT: DATABASE_URL and DEBUG from env
 * RETURNS: postgres.Sql client instance
 * ERRORS: throws Error if connection options fail to construct
 */

import postgres from 'postgres';
import { env } from '../config/env.js';

interface PgParsedOptions {
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl?: 'require' | 'allow' | 'prefer' | boolean;
}

function safeUnquote(str: string): string {
  return str.replace(/%([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

export function parseDbUrl(urlStr: string): PgParsedOptions {
  const cleanUrl = urlStr.replace(/%(?![0-9a-fA-F]{2})/g, '%25');
  const u = new URL(cleanUrl);
  return {
    host: u.hostname,
    port: parseInt(u.port || '5432', 10),
    database: u.pathname.replace(/^\//, '') || 'postgres',
    username: safeUnquote(u.username),
    password: safeUnquote(u.password),
    ssl: u.hostname.includes('supabase.com') ? 'require' : undefined
  };
}

const opts = parseDbUrl(env.DATABASE_URL);

const rawSql = postgres({
  host: opts.host,
  port: opts.port,
  database: opts.database,
  username: opts.username,
  password: opts.password,
  ssl: opts.ssl,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

function logQueryMetrics(start: number, result: unknown, qStr: string): void {
  const duration = Math.round(performance.now() - start);
  const rows = Array.isArray(result) ? result.length : (result as { count?: number })?.count ?? 0;
  const slow = duration > 500 ? ' [SLOW QUERY > 500ms]' : '';
  const cleanQ = qStr.replace(/\s+/g, ' ').trim().slice(0, 100);
  console.log(`[SQL DEBUG] ${duration}ms | rows: ${rows}${slow} | ${cleanQ}`);
}

export const sql = new Proxy(rawSql, {
  apply(target, thisArg, args) {
    if (!env.DEBUG) return Reflect.apply(target, thisArg, args);
    const start = performance.now();
    const p = Reflect.apply(target, thisArg, args);
    const qStr = typeof args[0] === 'string' ? args[0] : (args[0] as TemplateStringsArray)?.join('?') || 'QUERY';
    return p.then((res: unknown) => {
      logQueryMetrics(start, res, qStr);
      return res;
    });
  },
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);
  }
}) as typeof rawSql;

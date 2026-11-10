/**
 * PURPOSE: Configure and export raw PostgreSQL client using postgres (porsager)
 * INPUT: DATABASE_URL from env
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

/**
 * PURPOSE: Unquote percent-encoded character components safely
 * INPUT: str: string
 * RETURNS: string
 * ERRORS: none
 */
function safeUnquote(str: string): string {
  return str.replace(/%([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

/**
 * PURPOSE: Parse database connection string into connection options
 * INPUT: urlStr: string
 * RETURNS: PgParsedOptions
 * ERRORS: throws Error on invalid URL format
 */
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

export const sql = postgres({
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

/**
 * PURPOSE: Unit tests for central error catalogue and AppError diagnostic hints
 * INPUT: ErrorCode values
 * RETURNS: Vitest test assertions
 * ERRORS: none
 */

import { describe, expect, it } from 'vitest';
import { AppError, ERROR_CATALOGUE, getDiagnosticHint } from '../src/utils/errors.js';

describe('Error Catalogue & AppError', () => {
  it('returns human-readable cause and fix hints for mapped error codes', () => {
    const hint = getDiagnosticHint('AUTH_INVALID');
    expect(hint).toContain('Supplied credentials do not match');
    expect(hint).toContain('Verify email and DEMO_USER_PASSWORD');
  });

  it('provides default hints for all 8 standard operational error codes', () => {
    const codes = [
      'AUTH_INVALID',
      'AUTH_EXPIRED',
      'FORBIDDEN',
      'VALIDATION_FAILED',
      'DB_CONNECTION',
      'DB_QUERY',
      'NOT_FOUND',
      'RATE_LIMITED'
    ] as const;

    for (const code of codes) {
      expect(ERROR_CATALOGUE[code]).toBeDefined();
      expect(ERROR_CATALOGUE[code].cause.length).toBeGreaterThan(10);
      expect(ERROR_CATALOGUE[code].fix.length).toBeGreaterThan(10);
    }
  });

  it('constructs AppError with statusCode, code, and default hint', () => {
    const err = new AppError('FORBIDDEN', 'User cannot access analytical views', 403);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.hint).toContain('Authenticated role does not possess permissions');
  });

  it('allows custom resolution hint override in AppError', () => {
    const err = new AppError('DB_QUERY', 'Failed custom query', 500, 'Custom hint text');
    expect(err.hint).toBe('Custom hint text');
  });
});


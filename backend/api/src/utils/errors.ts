/**
 * PURPOSE: Central error catalogue and AppError definition with diagnostic hints
 * INPUT: error code, message, HTTP status, and optional diagnostic hint
 * RETURNS: AppError instance and error catalog lookup
 * ERRORS: none
 */

export type ErrorCode =
  | 'AUTH_INVALID'
  | 'AUTH_EXPIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_FAILED'
  | 'DB_CONNECTION'
  | 'DB_QUERY'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ErrorHintMapping {
  cause: string;
  fix: string;
}

export const ERROR_CATALOGUE: Record<ErrorCode, ErrorHintMapping> = {
  AUTH_INVALID: {
    cause: 'Supplied credentials do not match any active user in Supabase Auth.',
    fix: 'Verify email and DEMO_USER_PASSWORD, or run python scripts/create_demo_users.py.'
  },
  AUTH_EXPIRED: {
    cause: 'Session JWT cookie is missing, expired, or failed signature verification.',
    fix: 'Re-authenticate via POST /api/v1/auth/login or check browser cookie settings.'
  },
  FORBIDDEN: {
    cause: 'Authenticated role does not possess permissions for this endpoint.',
    fix: 'Log in with an authorized role (e.g., analyst/admin for exceptions/evaluations).'
  },
  VALIDATION_FAILED: {
    cause: 'Request payload, query parameters, or URL params violated Zod schema contract.',
    fix: 'Review request parameters against API documentation schema requirements.'
  },
  DB_CONNECTION: {
    cause: 'Unable to establish TCP/TLS connection to PostgreSQL database.',
    fix: 'Verify DATABASE_URL in .env, check network firewall, and confirm Postgres is running.'
  },
  DB_QUERY: {
    cause: 'PostgreSQL returned a syntax error, constraint violation, or query failure.',
    fix: 'Inspect query log in console; verify table schemas and migrations are current.'
  },
  NOT_FOUND: {
    cause: 'Requested resource or entity identifier does not exist in database.',
    fix: 'Confirm entity ID and type exist by checking operational records.'
  },
  RATE_LIMITED: {
    cause: 'Exceeded maximum request rate threshold (1000 requests per minute).',
    fix: 'Back off request frequency and wait for rate limit window to expire.'
  },
  INTERNAL_ERROR: {
    cause: 'An unexpected internal server condition was encountered.',
    fix: 'Check server logs with request ID for detailed error traces.'
  }
};

/**
 * PURPOSE: Application-level typed error holding HTTP status, code, and resolution hint
 * INPUT: code: ErrorCode, message: string, statusCode?: number, hint?: string
 * RETURNS: AppError instance
 * ERRORS: none
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly hint: string;

  constructor(code: ErrorCode, message: string, statusCode = 400, customHint?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    const defaultHint = ERROR_CATALOGUE[code];
    this.hint = customHint || (defaultHint ? `${defaultHint.cause} ${defaultHint.fix}` : 'No hint available.');
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * PURPOSE: Lookup default diagnostic resolution hint for a given error code
 * INPUT: code: string
 * RETURNS: string
 * ERRORS: none
 */
export function getDiagnosticHint(code: string): string {
  const mapping = ERROR_CATALOGUE[code as ErrorCode];
  return mapping ? `${mapping.cause} ${mapping.fix}` : 'Review server logs for diagnosis.';
}


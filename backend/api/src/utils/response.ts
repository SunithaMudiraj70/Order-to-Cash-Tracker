/**
 * Standard API response envelope.
 */

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * PURPOSE: Wrap payload in standard success envelope
 * INPUT: data: T
 * RETURNS: ApiResponse<T>
 * ERRORS: none
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    ok: true,
    data
  };
}

/**
 * PURPOSE: Wrap error in standard error envelope
 * INPUT: message: string, code: string
 * RETURNS: ApiResponse<never>
 * ERRORS: none
 */
export function errorResponse(message: string, code = 'INTERNAL_ERROR'): ApiResponse<never> {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}

/**
 * PURPOSE: Standard API response envelope and constructors with requestId & hint support
 * INPUT: payload or error details
 * RETURNS: ApiResponse<T>
 * ERRORS: none
 */

import { env } from '../config/env.js';

export interface ApiErrorDetail {
  code: string;
  message: string;
  hint?: string;
  requestId?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: ApiErrorDetail;
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
 * PURPOSE: Wrap error in standard error envelope with conditional hint and requestId
 * INPUT: message: string, code?: string, hint?: string, requestId?: string
 * RETURNS: ApiResponse<never>
 * ERRORS: none
 */
export function errorResponse(
  message: string,
  code = 'INTERNAL_ERROR',
  hint?: string,
  requestId?: string
): ApiResponse<never> {
  const isDev = env.NODE_ENV !== 'production';
  return {
    ok: false,
    error: {
      code,
      message,
      ...(isDev && hint ? { hint } : {}),
      ...(requestId ? { requestId } : {})
    }
  };
}

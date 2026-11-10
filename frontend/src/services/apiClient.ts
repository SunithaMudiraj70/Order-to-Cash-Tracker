/**
 * PURPOSE: Centralized API client wrapper sending credentials and unwrapping uniform envelopes
 * INPUT: endpoint path and standard RequestInit options
 * RETURNS: Promise<T>
 * ERRORS: throws Error if network fails or API envelope returns ok: false
 */

import { ApiResponse } from '../types';

const API_BASE = '/api/v1';

/**
 * PURPOSE: Execute an HTTP request against the Fastify backend API
 * INPUT: endpoint: string, options: RequestInit
 * RETURNS: Promise<T>
 * ERRORS: throws Error with server message or status code
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') || endpoint.startsWith('/health')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.ok) {
    const errorMsg = json.error?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return json.data as T;
}

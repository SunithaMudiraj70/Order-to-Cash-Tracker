/**
 * PURPOSE: Centralized API client wrapper with request tracking, 401 eviction, and error diagnostics
 * INPUT: endpoint path and standard RequestInit options
 * RETURNS: Promise<T>
 * ERRORS: throws Error with server message or status code
 */

import { useDebugStore } from '../store/debugStore';
import { useSessionStore } from '../store/sessionStore';
import { ApiResponse } from '../types';

const API_BASE = '/api/v1';

function handle401Eviction(endpoint: string): void {
  if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/me')) {
    useSessionStore.setState({ profile: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
}

function logDevError(method: string, endpoint: string, status: number, json: ApiResponse<unknown>): void {
  if (import.meta.env.DEV) {
    console.warn('[API ERROR]', {
      method,
      endpoint,
      status,
      requestId: json.error?.requestId,
      code: json.error?.code,
      message: json.error?.message,
      hint: json.error?.hint
    });
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET';
  const url = endpoint.startsWith('http') || endpoint.startsWith('/health')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const start = performance.now();
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });

  const durationMs = Math.round(performance.now() - start);
  const json: ApiResponse<T> = await res.json();

  useDebugStore.getState().recordCall({
    method,
    endpoint,
    status: res.status,
    durationMs,
    ok: res.ok && json.ok,
    code: json.error?.code,
    hint: json.error?.hint,
    requestId: json.error?.requestId || res.headers?.get?.('x-request-id') || undefined
  });

  if (!res.ok || !json.ok) {
    logDevError(method, endpoint, res.status, json);
    if (res.status === 401) handle401Eviction(endpoint);
    throw new Error(json.error?.message || `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

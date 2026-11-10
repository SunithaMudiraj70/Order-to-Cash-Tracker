/**
 * PURPOSE: Unit tests for centralized apiClient envelope unwrapping and error throwing
 * INPUT: mock fetch responses
 * RETURNS: Vitest test assertions
 * ERRORS: none
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiRequest } from '../src/services/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('unwraps data from successful envelope', async () => {
    const mockData = { id: 'order-123', amount: 4500 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: mockData })
    });

    const result = await apiRequest<{ id: string; amount: number }>('/orders/123');
    expect(result).toEqual(mockData);
  });

  it('throws typed error with message when envelope reports ok false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid payload' } })
    });

    await expect(apiRequest('/test')).rejects.toThrow('Invalid payload');
  });

  it('throws fallback status error message when envelope lacks error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false })
    });

    await expect(apiRequest('/error')).rejects.toThrow('Request failed with status 500');
  });
});


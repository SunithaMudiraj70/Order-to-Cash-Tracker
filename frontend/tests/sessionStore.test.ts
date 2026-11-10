/**
 * PURPOSE: Unit tests for Zustand sessionStore state transitions and 401 clearing
 * INPUT: mock session endpoints
 * RETURNS: Vitest test assertions
 * ERRORS: none
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useSessionStore } from '../src/store/sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  });

  it('updates profile and authentication on successful login', async () => {
    const mockProfile = { id: 'usr-1', email: 'analyst@o2c.local', role: 'analyst' as const };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { user: { id: 'usr-1', email: 'analyst@o2c.local' }, profile: mockProfile } })
    });

    await useSessionStore.getState().login('analyst@o2c.local', 'password');
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(useSessionStore.getState().profile?.email).toBe('analyst@o2c.local');
  });

  it('hydrates profile when /auth/me succeeds', async () => {
    const mockProfile = { id: 'usr-2', email: 'admin@o2c.local', role: 'admin' as const };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { user: mockProfile } })
    });

    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(useSessionStore.getState().profile?.role).toBe('admin');
  });

  it('clears session and sets isAuthenticated false on 401 unauthorized hydrate', async () => {
    useSessionStore.setState({
      profile: { id: 'usr-1', email: 'old@o2c.local', role: 'analyst' },
      isAuthenticated: true
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } })
    });

    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    expect(useSessionStore.getState().profile).toBeNull();
  });
});

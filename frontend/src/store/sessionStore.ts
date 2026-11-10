/**
 * PURPOSE: Zustand store managing authenticated user session and role-based permissions
 * INPUT: Login credentials or session hydration response
 * RETURNS: Zustand state hook
 * ERRORS: propagates login / hydration failures
 */

import { create } from 'zustand';
import { apiRequest } from '../services/apiClient';
import { UserProfile } from '../types';

interface SessionState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<{ user: { id: string; email: string }; profile: UserProfile }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );
      set({ profile: data.profile, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Login failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiRequest<{ logged_out: boolean }>('/auth/logout', { method: 'POST' });
    } finally {
      set({ profile: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const data = await apiRequest<{ user: UserProfile }>('/auth/me');
      set({ profile: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ profile: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

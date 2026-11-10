// ==============================================================================
// Store: Zustand Session Store (Auth & Role State)
// ==============================================================================

import { create } from 'zustand';
import { UserProfile } from '../types';

interface SessionState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  setProfile: (profile: UserProfile | null) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  isAuthenticated: false,
  setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),
  clearSession: () => set({ profile: null, isAuthenticated: false })
}));


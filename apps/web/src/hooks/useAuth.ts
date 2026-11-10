// ==============================================================================
// Hook: Authentication & Session Lifecycle
// TODO (Step 4): Wire Supabase onAuthStateChange listener
// ==============================================================================

import { useSessionStore } from '../store/sessionStore';

export function useAuth() {
  const { profile, isAuthenticated, clearSession } = useSessionStore();

  return {
    profile,
    isAuthenticated,
    logout: clearSession
  };
}


// ==============================================================================
// Hook: Authentication & Session Lifecycle
// Manages current user profile and session state
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


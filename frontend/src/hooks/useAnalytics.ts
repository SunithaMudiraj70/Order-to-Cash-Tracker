// ==============================================================================
// Hook: Analytics Server Queries
// TODO (Step 4): Connect TanStack queries with auto-refresh on status events
// ==============================================================================

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/apiClient';

export function useArAging() {
  return useQuery({
    queryKey: ['analytics', 'ar-aging'],
    queryFn: analyticsApi.getArAging,
    enabled: false // Stub for Step 1
  });
}


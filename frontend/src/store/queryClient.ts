/**
 * PURPOSE: TanStack Query client configuration with caching and retry defaults
 * INPUT: none
 * RETURNS: QueryClient instance
 * ERRORS: none
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

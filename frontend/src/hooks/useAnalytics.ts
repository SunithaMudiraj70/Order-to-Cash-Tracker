/**
 * PURPOSE: TanStack Query hooks fetching analytical KPIs, aging, leakage, and cycle times
 * INPUT: query parameters (cutoff, limits)
 * RETURNS: UseQueryResult with typed data
 * ERRORS: network / API error states handled by React Query
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/apiClient';
import { ArAgingItem, ProcessDelayItem, RevenueLeakageItem, SummaryKpis } from '../types';

/**
 * PURPOSE: Fetch high-level executive KPI indicators
 * INPUT: none
 * RETURNS: UseQueryResult<SummaryKpis>
 * ERRORS: none
 */
export function useSummary() {
  return useQuery<SummaryKpis>({
    queryKey: ['analytics', 'summary'],
    queryFn: () => apiRequest<SummaryKpis>('/analytics/summary')
  });
}

/**
 * PURPOSE: Fetch AR aging breakdown parameterized by cutoff date
 * INPUT: cutoff: string
 * RETURNS: UseQueryResult<ArAgingItem[]>
 * ERRORS: none
 */
export function useAging(cutoff: string) {
  return useQuery<ArAgingItem[]>({
    queryKey: ['analytics', 'aging', cutoff],
    queryFn: () => apiRequest<ArAgingItem[]>(`/analytics/aging?cutoff=${cutoff}`)
  });
}

/**
 * PURPOSE: Fetch revenue leakage discrepancies by order
 * INPUT: none
 * RETURNS: UseQueryResult<RevenueLeakageItem[]>
 * ERRORS: none
 */
export function useLeakage() {
  return useQuery<RevenueLeakageItem[]>({
    queryKey: ['analytics', 'leakage'],
    queryFn: () => apiRequest<RevenueLeakageItem[]>('/analytics/leakage')
  });
}

/**
 * PURPOSE: Fetch process delay and stage duration metrics
 * INPUT: none
 * RETURNS: UseQueryResult<ProcessDelayItem[]>
 * ERRORS: none
 */
export function useDelays() {
  return useQuery<ProcessDelayItem[]>({
    queryKey: ['analytics', 'delays'],
    queryFn: () => apiRequest<ProcessDelayItem[]>('/analytics/delays')
  });
}

/**
 * PURPOSE: TanStack Query hooks fetching detector findings, timelines, and evaluation metrics
 * INPUT: filter parameters, entity IDs
 * RETURNS: UseQueryResult with typed data
 * ERRORS: network / API error states handled by React Query
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/apiClient';
import { DetectorFinding, EvaluationMetric, StatusEventItem } from '../types';

export interface ExceptionFilters {
  issue_type?: string;
  severity?: string;
  entity_type?: string;
  limit?: number;
}

/**
 * PURPOSE: Fetch list of detected revenue and delay exceptions with optional filters
 * INPUT: filters: ExceptionFilters
 * RETURNS: UseQueryResult<{ items: DetectorFinding[]; next_cursor: string | null }>
 * ERRORS: none
 */
export function useExceptions(filters: ExceptionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.issue_type) params.set('issue_type', filters.issue_type);
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.entity_type) params.set('entity_type', filters.entity_type);
  if (filters.limit) params.set('limit', String(filters.limit));

  return useQuery<{ items: DetectorFinding[]; next_cursor: string | null }>({
    queryKey: ['exceptions', filters],
    queryFn: () => apiRequest(`/exceptions?${params.toString()}`)
  });
}

/**
 * PURPOSE: Fetch single exception finding details
 * INPUT: id: string | null
 * RETURNS: UseQueryResult<DetectorFinding>
 * ERRORS: none
 */
export function useException(id: string | null) {
  return useQuery<DetectorFinding>({
    queryKey: ['exceptions', id],
    queryFn: () => apiRequest<DetectorFinding>(`/exceptions/${id}`),
    enabled: Boolean(id)
  });
}

/**
 * PURPOSE: Fetch lifecycle status events timeline for any O2C entity
 * INPUT: entity: string, id: string | null
 * RETURNS: UseQueryResult<StatusEventItem[]>
 * ERRORS: none
 */
export function useTimeline(entity: string, id: string | null) {
  return useQuery<StatusEventItem[]>({
    queryKey: ['timeline', entity, id],
    queryFn: () => apiRequest<StatusEventItem[]>(`/records/${entity}/${id}/timeline`),
    enabled: Boolean(id)
  });
}

/**
 * PURPOSE: Fetch precision, recall, and F1 detector evaluation metrics
 * INPUT: none
 * RETURNS: UseQueryResult<EvaluationMetric[]>
 * ERRORS: none
 */
export function useEvaluation() {
  return useQuery<EvaluationMetric[]>({
    queryKey: ['exceptions', 'evaluation'],
    queryFn: () => apiRequest<EvaluationMetric[]>('/exceptions/evaluation')
  });
}

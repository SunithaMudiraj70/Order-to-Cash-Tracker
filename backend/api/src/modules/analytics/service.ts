/**
 * PURPOSE: Service layer orchestrating analytics computations and business formatting
 * INPUT: cutoff date, limits
 * RETURNS: Promise<SummaryKpis>, Promise<Record<string, unknown>[]>
 * ERRORS: throws Error on computation or database failure
 */

import {
  queryArAgingRows,
  queryProcessDelayRows,
  queryRevenueLeakageRows,
  querySummaryKpiRows
} from './repo.js';

export interface SummaryKpis {
  total_leakage_amount: number;
  total_overdue_balance: number;
  avg_cycle_time_days: number;
  total_exception_count: number;
}

/**
 * PURPOSE: Compute high-level executive KPI indicators
 * INPUT: none
 * RETURNS: Promise<SummaryKpis>
 * ERRORS: throws Error on database query failure
 */
export async function getSummaryKpis(): Promise<SummaryKpis> {
  const raw = await querySummaryKpiRows();
  return {
    total_leakage_amount: parseFloat(raw.leakageSum),
    total_overdue_balance: parseFloat(raw.overdueSum),
    avg_cycle_time_days: parseFloat(raw.cycleAvg),
    total_exception_count: parseInt(raw.findingCount, 10)
  };
}

/**
 * PURPOSE: Retrieve AR aging breakdown from stored analytics function
 * INPUT: cutoffDate: string (YYYY-MM-DD)
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws Error on database failure
 */
export async function getArAging(cutoffDate: string): Promise<Record<string, unknown>[]> {
  return queryArAgingRows(cutoffDate);
}

/**
 * PURPOSE: Query order-level revenue leakage details
 * INPUT: limit: number
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws Error on database failure
 */
export async function getRevenueLeakage(limit = 100): Promise<Record<string, unknown>[]> {
  return queryRevenueLeakageRows(limit);
}

/**
 * PURPOSE: Query process cycle time and delay metrics
 * INPUT: limit: number
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws Error on database failure
 */
export async function getProcessDelays(limit = 100): Promise<Record<string, unknown>[]> {
  return queryProcessDelayRows(limit);
}

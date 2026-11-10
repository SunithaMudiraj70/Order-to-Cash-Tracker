/**
 * PURPOSE: Data access repository executing analytical queries, views, and stored functions
 * INPUT: cutoffDate, limits
 * RETURNS: Promise<SQL query results>
 * ERRORS: throws Error on database failure
 */

import { sql } from '../../db/client.js';

/**
 * PURPOSE: Query raw scalar aggregates for executive summary KPIs
 * INPUT: none
 * RETURNS: Promise<{ leakageSum: string; overdueSum: string; cycleAvg: string; findingCount: string }>
 * ERRORS: throws on database failure
 */
export async function querySummaryKpiRows(): Promise<{
  leakageSum: string;
  overdueSum: string;
  cycleAvg: string;
  findingCount: string;
}> {
  const [leakageRow] = await sql<[{ sum: string }?]>`
    SELECT coalesce(sum(overbilled_amount + underbilled_amount + unpaid_closed_leakage), 0)::text as sum
    FROM analytics.v_revenue_leakage
  `;
  const [overdueRow] = await sql<[{ sum: string }?]>`
    SELECT coalesce(sum(balance_amount), 0)::text as sum FROM o2c.invoice WHERE status = 'OVERDUE'
  `;
  const [cycleRow] = await sql<[{ avg: string }?]>`
    SELECT coalesce(round(avg(quote_to_order_days + order_to_ship_days + ship_to_invoice_days + invoice_to_pay_days), 1), 0)::text as avg
    FROM analytics.v_cycle_time_delays
  `;
  const [findingRow] = await sql<[{ count: string }?]>`
    SELECT count(*)::text as count FROM analytics.detector_findings
  `;

  return {
    leakageSum: leakageRow?.sum || '0',
    overdueSum: overdueRow?.sum || '0',
    cycleAvg: cycleRow?.avg || '0',
    findingCount: findingRow?.count || '0'
  };
}

/**
 * PURPOSE: Query stored function analytics.fn_aging for a cutoff date
 * INPUT: cutoffDate: string
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws on database failure
 */
export async function queryArAgingRows(cutoffDate: string): Promise<Record<string, unknown>[]> {
  return sql<Record<string, unknown>[]>`
    SELECT account_id, account_name, segment, total_invoices, total_outstanding_balance,
           current_balance, bucket_1_30_days, bucket_31_60_days, bucket_61_90_days, bucket_91_plus_days
    FROM analytics.fn_aging(${cutoffDate}::date)
    ORDER BY total_outstanding_balance DESC
  `;
}

/**
 * PURPOSE: Query revenue leakage records from view
 * INPUT: limit: number
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws on database failure
 */
export async function queryRevenueLeakageRows(limit: number): Promise<Record<string, unknown>[]> {
  return sql<Record<string, unknown>[]>`
    SELECT order_id, account_id, order_status, total_ordered_amount, total_fulfilled_amount,
           total_billed_amount, total_paid_amount, total_unpaid_amount,
           overbilled_amount, underbilled_amount, unpaid_closed_leakage, duplicate_invoice_count,
           (overbilled_amount + underbilled_amount + unpaid_closed_leakage) as net_leakage
    FROM analytics.v_revenue_leakage
    ORDER BY net_leakage DESC
    LIMIT ${limit}
  `;
}

/**
 * PURPOSE: Query process stage cycle delays from view
 * INPUT: limit: number
 * RETURNS: Promise<Record<string, unknown>[]>
 * ERRORS: throws on database failure
 */
export async function queryProcessDelayRows(limit: number): Promise<Record<string, unknown>[]> {
  return sql<Record<string, unknown>[]>`
    SELECT order_id, account_id, order_date, promised_date, ship_date, invoice_date, payment_date,
           quote_to_order_days, order_to_ship_days, ship_to_invoice_days, invoice_to_pay_days,
           (coalesce(quote_to_order_days, 0) + coalesce(order_to_ship_days, 0) +
            coalesce(ship_to_invoice_days, 0) + coalesce(invoice_to_pay_days, 0)) as total_cycle_days,
           is_delivery_sla_breached, is_fulfillment_delayed, is_billing_delayed, is_payment_overdue
    FROM analytics.v_cycle_time_delays
    ORDER BY total_cycle_days DESC
    LIMIT ${limit}
  `;
}


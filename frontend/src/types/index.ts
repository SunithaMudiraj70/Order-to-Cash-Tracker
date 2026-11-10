/**
 * PURPOSE: Application-wide TypeScript interfaces and contracts
 * INPUT: none
 * RETURNS: Type definitions
 * ERRORS: none
 */

export type UserRole = 'customer' | 'sales_ops' | 'support_agent' | 'analyst' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string | null;
  account_id?: string | null;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    hint?: string;
    requestId?: string;
  };
}

export interface SummaryKpis {
  total_leakage_amount: number;
  total_overdue_balance: number;
  avg_cycle_time_days: number;
  total_exception_count: number;
}

export interface ArAgingItem {
  account_id: string;
  account_name: string;
  segment: string;
  total_invoices: number;
  total_outstanding_balance: number;
  current_balance: number;
  bucket_1_30_days: number;
  bucket_31_60_days: number;
  bucket_61_90_days: number;
  bucket_91_plus_days: number;
}

export interface RevenueLeakageItem {
  order_id: string;
  account_id: string;
  order_status: string;
  total_ordered_amount: number;
  total_fulfilled_amount: number;
  total_billed_amount: number;
  total_paid_amount: number;
  total_unpaid_amount: number;
  overbilled_amount: number;
  underbilled_amount: number;
  unpaid_closed_leakage: number;
  duplicate_invoice_count: number;
  net_leakage: number;
}

export interface ProcessDelayItem {
  order_id: string;
  account_id: string;
  quote_to_order_days: number;
  order_to_ship_days: number;
  ship_to_invoice_days: number;
  invoice_to_pay_days: number;
  total_cycle_days: number;
  is_delivery_sla_breached: boolean;
  is_fulfillment_delayed: boolean;
  is_billing_delayed: boolean;
  is_payment_overdue: boolean;
}

export interface DetectorFinding {
  finding_id: string;
  entity_type: string;
  entity_id: string;
  issue_type: string;
  severity: string;
  evidence: Record<string, unknown>;
  detected_at: string;
}

export interface EvaluationMetric {
  issue_type: string;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface StatusEventItem {
  event_id: string;
  entity_type: string;
  entity_id: string;
  from_status: string;
  to_status: string;
  event_ts: string;
  actor: string;
  source: string;
  payload: Record<string, unknown>;
}

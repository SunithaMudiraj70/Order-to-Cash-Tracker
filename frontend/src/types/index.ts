// ==============================================================================
// Domain Types & Enums
// ==============================================================================

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type OrderStatus = 'CREATED' | 'CONFIRMED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'INVOICED' | 'PAID' | 'CLOSED' | 'CANCELLED';
export type ShipmentStatus = 'PLANNED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'DISPUTED' | 'VOID';
export type PaymentStatus = 'RECEIVED' | 'ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'REVERSED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_CREDIT' | 'RESOLVED_REJECTED' | 'CLOSED';

export type UserRole = 'customer' | 'sales_ops' | 'support_agent' | 'analyst' | 'admin';

export type IssueType =
  | 'INVOICE_EXCEEDS_FULFILLED'
  | 'PAYMENT_ALLOCATED_TWICE'
  | 'ORDER_CLOSED_UNPAID'
  | 'STATUS_EVENT_SKIPPED_STATE'
  | 'DISPUTE_NOT_IN_RECEIVABLES'
  | 'PARTIAL_SHIPMENT'
  | 'UNDERBILLING'
  | 'DUPLICATE_INVOICE'
  | 'SHORT_PAYMENT'
  | 'LONG_OVERDUE';

export interface UserProfile {
  id: string;
  role: UserRole;
  accountId?: string | null;
  fullName?: string | null;
  email?: string | null;
}

export interface ArAgingSummary {
  accountId: string;
  accountName: string;
  segment: string;
  totalInvoices: number;
  totalOutstandingBalance: number;
  currentBalance: number;
  bucket1to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket91Plus: number;
}


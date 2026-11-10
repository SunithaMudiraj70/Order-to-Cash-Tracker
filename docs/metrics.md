# Order-to-Cash (O2C) Metric Definitions & Calculations

This document defines the analytical metrics, key performance indicators (KPIs), aging buckets, and detection formulas implemented in the Order-to-Cash Revenue Leakage & Process Delay Tracker.

---

## 1. Revenue Leakage Metrics

Revenue leakage captures unearned, lost, or trapped revenue throughout fulfillment and billing.

### 1.1 Underbilling
- **Definition**: Occurs when an invoice line is billed at a unit price below the contracted price agreed upon in the sales order line.
- **Formula**:
  $$\text{Underbilled Amount} = \sum (\text{ordered\_unit\_price} - \text{billed\_unit\_price}) \times \text{billed\_qty} \quad \text{where} \quad \text{billed\_unit\_price} < \text{ordered\_unit\_price}$$
- **Database View**: `analytics.v_revenue_leakage.underbilled_amount`
- **Detection Rule**: `RULE-07-UNDERBILLING`

### 1.2 Overbilling (Invoice Exceeds Fulfilled)
- **Definition**: Occurs when the quantity billed on an invoice line exceeds the cumulative quantity shipped on associated fulfillment shipments.
- **Formula**:
  $$\text{Overbilled Qty} = \text{billed\_qty} - \text{shipped\_qty} \quad \text{where} \quad \text{billed\_qty} > \text{shipped\_qty}$$
  $$\text{Overbilled Amount} = \text{Overbilled Qty} \times \text{unit\_price}$$
- **Database View**: `analytics.v_revenue_leakage.overbilled_amount`
- **Detection Rule**: `RULE-01-EXCEEDS-FULFILLED`

### 1.3 Unpaid Closed Orders
- **Definition**: Sales orders transitioned to `CLOSED` status while having open, unpaid invoice balances remaining in the accounts receivable ledger.
- **Formula**:
  $$\text{Unpaid Closed Leakage} = \text{invoice.balance\_amount} \quad \text{where} \quad \text{order.status} = \text{'CLOSED'} \land \text{balance\_amount} > 0$$
- **Database View**: `analytics.v_revenue_leakage.unpaid_closed_leakage`
- **Detection Rule**: `RULE-03-CLOSED-UNPAID`

### 1.4 Duplicate Invoicing
- **Definition**: Multiple invoices issued for the exact same order or referencing a previous billing (`dup_of_invoice_id IS NOT NULL`).
- **Database View**: `analytics.v_revenue_leakage.duplicate_invoice_count`
- **Detection Rule**: `RULE-08-DUPLICATE-INVOICE`

---

## 2. Accounts Receivable (AR) Aging Metrics

Accounts receivable aging measures the duration that issued invoices have remained unsettled past their designated due date.

### 2.1 Parameterized Cutoff
The aging calculation is driven by `analytics.fn_aging(p_cutoff DATE DEFAULT DATE '2026-10-31')`. All calculations are deterministic and avoid non-reproducible dynamic calls to `NOW()` or `CURRENT_DATE`.

### 2.2 Aging Buckets
- **Current (Not Due)**: $\text{due\_date} \ge \text{p\_cutoff}$
- **1–30 Days Overdue**: $\text{p\_cutoff} - 30 \le \text{due\_date} < \text{p\_cutoff}$
- **31–60 Days Overdue**: $\text{p\_cutoff} - 60 \le \text{due\_date} < \text{p\_cutoff} - 30$
- **61–90 Days Overdue**: $\text{p\_cutoff} - 90 \le \text{due\_date} < \text{p\_cutoff} - 60$
- **91+ Days Overdue (Severe)**: $\text{due\_date} < \text{p\_cutoff} - 90$

### 2.3 Long Overdue Receivable Detection
- **Formula**: $\text{invoice.status} = \text{'OVERDUE'} \land \text{due\_date} \le \text{p\_cutoff} - 90 \text{ days}$
- **Detection Rule**: `RULE-10-LONG-OVERDUE`

---

## 3. Process Cycle Time & Delay Metrics

Cycle time measures elapsed business days across key operational milestones for each order. Grain is strictly 1 row per sales order.

| Stage | Formula | SLA Target | Delay Flag |
| :--- | :--- | :--- | :--- |
| **Quote-to-Order** | $\text{order\_date} - \text{quote\_date}$ | $\le 14$ days | - |
| **Order-to-Shipment** | $\min(\text{ship\_date}) - \text{order\_date}$ | $\le 7$ days | `is_fulfillment_delayed` |
| **Shipment-to-Invoice** | $\min(\text{invoice\_date}) - \min(\text{ship\_date})$ | $\le 3$ days | `is_billing_delayed` |
| **Invoice-to-Payment** | $\max(\text{payment\_date}) - \min(\text{invoice\_date})$ | Net Terms | `is_payment_overdue` |
| **Delivery SLA** | $\max(\text{ship\_date}) > \text{promised\_date}$ | Promised Date | `is_delivery_sla_breached` |

---

## 4. Cash Application & Dispute Metrics

### 4.1 Unallocated Payments
- **Definition**: Cash receipts deposited and recorded in `o2c.payment` that have not been fully matched or applied to open invoices in `o2c.payment_allocation`.
- **Formula**: $\text{unallocated\_balance} = \text{payment.amount} - \sum \text{allocated\_amount} > 0$
- **Database View**: `analytics.v_unallocated_payments`

### 4.2 Duplicate Payment Allocation
- **Definition**: When a single remittance is allocated multiple times to the same invoice receivable.
- **Detection Rule**: `RULE-02-ALLOCATED-TWICE`

### 4.3 Dispute on Settled Receivables
- **Definition**: Open customer disputes filed against invoices with zero outstanding balance ($balance\_amount \le 0.00$).
- **Detection Rule**: `RULE-05-DISPUTE-NOT-IN-RECEIVABLES`


-- ==============================================================================
-- Query: aging.sql
-- Description: Accounts Receivable (AR) aging analysis by customer account
-- TODO (Step 4): Add parameterized cut-off date and credit limit risk indicators
-- ==============================================================================

SELECT
  a.account_id,
  a.name AS customer_name,
  a.segment,
  a.credit_limit,
  COUNT(i.invoice_id) AS open_invoice_count,
  SUM(i.balance_amount) AS total_overdue_balance,
  SUM(CASE WHEN i.due_date >= CURRENT_DATE THEN i.balance_amount ELSE 0 END) AS current_due,
  SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.due_date >= CURRENT_DATE - 30 THEN i.balance_amount ELSE 0 END) AS days_1_30,
  SUM(CASE WHEN i.due_date < CURRENT_DATE - 30 AND i.due_date >= CURRENT_DATE - 60 THEN i.balance_amount ELSE 0 END) AS days_31_60,
  SUM(CASE WHEN i.due_date < CURRENT_DATE - 60 AND i.due_date >= CURRENT_DATE - 90 THEN i.balance_amount ELSE 0 END) AS days_61_90,
  SUM(CASE WHEN i.due_date < CURRENT_DATE - 90 THEN i.balance_amount ELSE 0 END) AS days_90_plus
FROM o2c.invoice i
JOIN o2c.account a ON i.account_id = a.account_id
WHERE i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
GROUP BY a.account_id, a.name, a.segment, a.credit_limit
ORDER BY total_overdue_balance DESC;


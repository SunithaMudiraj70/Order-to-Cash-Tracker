# Database Analytical Queries & Views

This directory contains standalone SQL queries and analytical templates for the Order-to-Cash (O2C) pipeline.

## Structure

- `queries/aging.sql`: Accounts Receivable aging cohort analysis (Current, 1-30, 31-60, 61-90, 91+ days).
- `queries/leakage.sql`: Discrepancy checks identifying billing without shipment, duplicate invoices, and uncollected amounts.
- `queries/delays.sql`: End-to-end SLA tracking measuring milestone lags (Order -> Ship -> Invoice -> Payment).

## Execution

You can run these queries directly using the Supabase CLI:

```bash
supabase db execute -f db/queries/aging.sql
```

Or connect via psql:

```bash
psql $DATABASE_URL -f db/queries/leakage.sql
```


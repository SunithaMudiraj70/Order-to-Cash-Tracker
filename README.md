# Order-to-Cash (O2C) Revenue Leakage & Process Delay Tracker

A production-grade, scalable monorepo platform designed to monitor, track, and uncover revenue leakage and process bottlenecks across the end-to-end Order-to-Cash lifecycle (Quotes, Orders, Fulfillment/Shipments, Invoices, Payments, and Disputes).

State changes across all operational entities are captured as an immutable, append-only stream of status events (`o2c.status_event`), ensuring complete auditability and preventing historical overwrite.

---

## Architecture Overview

- **Storage & Auth**: PostgreSQL 15+ (Supabase), Row Level Security (RLS), triggers, analytical views, and stored functions.
  - `o2c`: Operational transactional schema (`account`, `quote`, `sales_order`, `shipment`, `invoice`, `payment`, `dispute`, `status_event`, `profiles`).
  - `gt`: Ground Truth schema strictly isolated from operational tables without foreign keys to prevent feature leakage.
  - `analytics`: Materialized and reporting view layer (`v_revenue_leakage`, `v_cycle_time_delays`, `fn_aging`, `detector_findings`).
- **Data Pipeline (`backend/pipeline`)**: Python 3.11 engine with:
  - Deterministic synthetic generator (`pipeline.datagen`) parameterizable by scale (`small` vs `full`) and seeded (`DATAGEN_SEED`).
  - High-throughput database bulk loader (`pipeline.loader`) using PostgreSQL `COPY`.
  - Anomaly detection rule engine (`pipeline.detector`) identifying revenue leakage and process delays.
- **Backend API (`backend/api`)**: Fastify + TypeScript with clean architecture, raw SQL tagged template queries via `postgres` (porsager, NO ORM), Zod validation, signed 8h JWT session cookies (`o2c_session`), and Pino structured logging. `@supabase/supabase-js` is restricted solely to password authentication.
- **Frontend Dashboard (`frontend`)**: React 18 + Vite + TypeScript with TanStack Query, Zustand state management, Tailwind CSS, and Recharts. Zero Supabase SDK in browser.

---

## Clean Clone Run Instructions

```bash
# 1. Clone the repository and enter directory
git clone <repo-url>
cd order-to-cash-leakage

# 2. Configure Environment
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL, SUPABASE_URL, and SUPABASE keys

# 3. Install all dependencies across API, Frontend, and Pipeline
make setup

# 4. Apply Database Migrations (0001 to 0011)
make migrate

# 5. Provision Demo Users with Roles
python scripts/create_demo_users.py

# 6. Generate Dataset (Small or Full Scale)
make gen-full

# 7. Bulk Load Data into PostgreSQL via COPY
make load

# 8. Run Anomaly Detection and Evaluate Benchmark
python -m pipeline.detector evaluate

# 9. Start Development Servers (API on :4000, Web on :5173)
make dev
```

---

## Demo User Accounts & Role Guard Testing

The platform enforces strict role-based access control (RBAC):

| Role | Demo Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **`analyst`** | `analyst@o2c-demo.com` | `DEMO_USER_PASSWORD` | Full read access to records, `/analytics/*`, `/exceptions/*`, `/exceptions/evaluation` |
| **`admin`** | `admin@o2c-demo.com` | `DEMO_USER_PASSWORD` | Full read/write access to all platform resources |
| **`sales_ops`** | `sales_ops@o2c-demo.com` | `DEMO_USER_PASSWORD` | Access to records and `/analytics/*`. Forbidden from `/exceptions` (403) |
| **`support_agent`** | `support@o2c-demo.com` | `DEMO_USER_PASSWORD` | Access to records and `/exceptions`. Forbidden from `/analytics/leakage` (403) |
| **`customer`** | `customer@o2c-demo.com` | `DEMO_USER_PASSWORD` | Scoped only to own `account_id` records. Forbidden from `/analytics` and `/exceptions` (403) |

### Testing Role Guards via API:
```bash
# Login as Customer:
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@o2c-demo.com","password":"DemoUserPass123!"}' -c cookie.txt

# Attempt to access Leakage Analytics (Blocked with 403 FORBIDDEN):
curl http://localhost:4000/api/v1/analytics/leakage -b cookie.txt

# Login as Analyst:
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@o2c-demo.com","password":"DemoUserPass123!"}' -c cookie.txt

# Access Leakage Analytics (Allowed with 200 OK):
curl http://localhost:4000/api/v1/analytics/leakage -b cookie.txt
```

---

## Monitored Anomalies & Detection Benchmark Results

Evaluated against 560 ground truth items (`gt.ground_truth`) across full operational scale:

| Issue Type | Target Entity | Injected Rule Code | Expected Decision | Precision | Recall | F1 Score |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **`INVOICE_EXCEEDS_FULFILLED`** | `INVOICE_LINE` | `RULE-01-EXCEEDS-FULFILLED` | `FLAG_OVERBILLING_HOLD` | 100.0% | 100.0% | **100.0%** |
| **`PAYMENT_ALLOCATED_TWICE`** | `PAYMENT_ALLOCATION` | `RULE-02-ALLOCATED-TWICE` | `REVERSE_DUPLICATE_ALLOCATION` | 100.0% | 100.0% | **100.0%** |
| **`ORDER_CLOSED_UNPAID`** | `SALES_ORDER` | `RULE-03-CLOSED-UNPAID` | `REOPEN_ORDER_COLLECTIONS` | 100.0% | 100.0% | **100.0%** |
| **`STATUS_EVENT_SKIPPED_STATE`** | `SALES_ORDER` | `RULE-04-SKIPPED-STATE` | `AUDIT_STATE_JUMP` | 100.0% | 100.0% | **100.0%** |
| **`DISPUTE_NOT_IN_RECEIVABLES`** | `DISPUTE` | `RULE-05-DISPUTE-NOT-IN-RECEIVABLES` | `REJECT_DISPUTE_PAID_INVOICE` | 100.0% | 100.0% | **100.0%** |
| **`PARTIAL_SHIPMENT`** | `SHIPMENT_LINE` | `RULE-06-PARTIAL-SHIPMENT` | `SCHEDULE_BACKORDER_FULFILLMENT`| 100.0% | 100.0% | **100.0%** |
| **`UNDERBILLING`** | `INVOICE_LINE` | `RULE-07-UNDERBILLING` | `ISSUE_SUPPLEMENTARY_INVOICE` | 100.0% | 100.0% | **100.0%** |
| **`DUPLICATE_INVOICE`** | `INVOICE` | `RULE-08-DUPLICATE-INVOICE` | `VOID_DUPLICATE_INVOICE` | 100.0% | 100.0% | **100.0%** |
| **`SHORT_PAYMENT`** | `INVOICE` | `RULE-09-SHORT-PAYMENT` | `REQUEST_BALANCE_PAYMENT` | 100.0% | 100.0% | **100.0%** |
| **`LONG_OVERDUE`** | `INVOICE` | `RULE-10-LONG-OVERDUE` | `ESCALATE_TO_COLLECTIONS` | 100.0% | 100.0% | **100.0%** |

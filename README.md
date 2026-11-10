# Order-to-Cash (O2C) Revenue Leakage & Process Delay Tracker

A production-grade, scalable monorepo platform designed to monitor, track, and uncover revenue leakage and process bottlenecks across the end-to-end Order-to-Cash lifecycle (Quotes, Orders, Fulfillment/Shipments, Invoices, Payments, and Disputes).

State changes across all operational entities are captured as an immutable, append-only stream of status events, ensuring full auditability and preventing historical overwrite.

---

## Architecture Overview

- **Storage & Auth**: Supabase (PostgreSQL 15+, Row Level Security, pgTAP, Auth, Triggers).
  - `o2c`: Operational transactional schema.
  - `gt`: Ground Truth schema (isolated from operational tables to avoid feature leakage).
  - `analytics`: Materialized and reporting view layer.
- **Data Generation (`services/datagen`)**: Python 3.11+ engine to generate synthetic transactional graphs with controlled, mathematically verifiable anomaly injection.
- **Anomaly & Delay Detector (`services/detector`)**: Python rule engine evaluating aging, discrepancies, and operational leakages against source events.
- **Backend API (`apps/api`)**: Fastify + TypeScript with clean architecture, Zod validation, Pino logging, and Supabase client.
- **Frontend Dashboard (`apps/web`)**: React 18 + Vite + TypeScript with TanStack Query, Zustand state management, Tailwind CSS, and Recharts.

---

## Prerequisites

Before starting, ensure the following tooling is installed locally:

- **Node.js**: `v20.x` or higher (`lts/iron`)
- **Python**: `v3.11.x`
- **Docker**: `24.x` or higher (with Docker Compose)
- **Supabase CLI**: `v1.160.0` or higher
- **Make**: GNU Make

---

## Quick Start

1. **Clone and Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your local credentials if needed
   ```

2. **Run Monorepo Setup**:
   ```bash
   make setup
   ```
   This installs all npm dependencies in `apps/api` and `apps/web`, and sets up editable python packages for `services/datagen` and `services/detector`.

3. **Start Local Database & Run Migrations**:
   ```bash
   make db-up
   make migrate
   ```

4. **Generate Synthetic Data**:
   ```bash
   make gen-small   # Generates small test dataset with injected leakage
   # or
   make gen-full    # Generates full operational dataset
   ```

5. **Start Development Servers**:
   In two separate terminals:
   ```bash
   make dev-api     # Starts Fastify API on http://localhost:4000
   make dev-web     # Starts Vite React dashboard on http://localhost:5173
   ```

---

## Make Targets Reference

| Target | Description |
| :--- | :--- |
| `make setup` | Installs dependencies across Node.js workspaces and Python services |
| `make db-up` | Starts local Supabase stack / PostgreSQL docker container |
| `make db-reset` | Resets local DB and replays all migrations cleanly |
| `make migrate` | Applies pending Supabase migrations from `supabase/migrations/` |
| `make gen-small` | Runs Python data generator for small-scale validation |
| `make gen-full` | Runs Python data generator for full-scale operational workload |
| `make validate` | Runs integrity checks, checksums, and ground-truth validations |
| `make test` | Runs test suites across api, web, datagen, detector, and pgTAP |
| `make lint` | Executes linters and typecheckers (Ruff, Black, Mypy, ESLint, Prettier) |
| `make dev-api` | Starts Fastify API service in watch mode |
| `make dev-web` | Starts React Vite frontend application |
| `make clean` | Removes compiled artifacts, temporary caches, and build folders |

---

## Database Schemas & Migrations

The migrations reside in `supabase/migrations/` and follow strict numbering:

1. `0001_extensions_schemas_enums.sql`: Schema definitions (`o2c`, `gt`, `analytics`) and state enums.
2. `0002_master_tables.sql`: Core master entities (`account`, `quote`, `quote_line`, `sales_order`, `order_line`).
3. `0003_transaction_tables.sql`: Downstream transactions (`shipment`, `shipment_line`, `invoice`, `invoice_line`, `payment`, `payment_allocation`, `dispute`).
4. `0004_status_event.sql`: Append-only audit ledger `o2c.status_event` with triggers preventing update/delete.
5. `0005_ground_truth.sql`: Isolated `gt.ground_truth` table for benchmark evaluation without FK coupling.
6. `0006_indexes_constraints.sql`: Foreign key indexes, performance partial indexes, and domain constraints.
7. `0007_rls_roles.sql`: Supabase Auth profile binding with Row-Level Security policies for 5 distinct roles.
8. `0008_audit_triggers.sql`: Automated status transition listeners feeding `status_event`.
9. `0009_analytics_views_stubs.sql`: Reporting views for aging, dispute risk, and revenue leakage indicators.

---

## Role-Based Access Control (RBAC)

The system defines 5 roles in `o2c.profiles`:
- **`customer`**: Restricted to reading transactions associated with their own `account_id`.
- **`sales_ops`**: Full management of quotes, orders, shipments, invoices; read-only payments.
- **`support_agent`**: Reads operational pipeline and manages disputes.
- **`analyst`**: Read access across operational pipeline and `gt.ground_truth`.
- **`admin`**: Full operational, administrative, and ground-truth privileges.


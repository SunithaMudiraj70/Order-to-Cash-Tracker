# Order-to-Cash (O2C) Revenue Leakage & Process Delay Tracker

A production-grade, scalable monorepo platform designed to monitor, track, and uncover revenue leakage and process bottlenecks across the end-to-end Order-to-Cash lifecycle (Quotes, Orders, Fulfillment/Shipments, Invoices, Payments, and Disputes).

State changes across all operational entities are captured as an immutable, append-only stream of status events, ensuring full auditability and preventing historical overwrite.

---

## Architecture Overview

- **Storage & Auth**: PostgreSQL (Supabase / Postgres 15+), Row Level Security, pgTAP, Auth, Triggers.
  - `o2c`: Operational transactional schema.
  - `gt`: Ground Truth schema (isolated from operational tables to avoid feature leakage).
  - `analytics`: Materialized and reporting view layer.
- **Data Generator & Detector (`backend/pipeline`)**: Python 3.11+ engine to generate synthetic transactional graphs with controlled anomaly injection and detector rule engine.
- **Backend API (`backend/api`)**: Fastify + TypeScript with clean architecture, Zod validation, Pino logging, and PostgreSQL connection.
- **Frontend Dashboard (`frontend`)**: React 18 + Vite + TypeScript with TanStack Query, Zustand state management, Tailwind CSS, and Recharts.

---

## Prerequisites

- **Node.js**: `v20.x` or higher
- **Python**: `v3.11.x`
- **Make**: GNU Make

---

## Quick Start

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Add your database and auth credentials to .env
   ```

2. **Run Monorepo Setup**:
   ```bash
   make setup
   ```

3. **Run Migrations**:
   ```bash
   make migrate
   ```

4. **Generate Synthetic Data & Load**:
   ```bash
   make gen-small
   make load
   make detect
   ```

5. **Start Development Servers**:
   ```bash
   make dev         # Runs both Backend API and Frontend concurrently
   ```

---

## Make Targets Reference

| Target | Description |
| :--- | :--- |
| `make setup` | Installs dependencies across Node.js workspaces and Python pipeline |
| `make migrate` | Applies pending migrations via Python migrator |
| `make reset-db` | Drops schemas and replays migrations cleanly |
| `make gen-small` | Runs Python data generator for small-scale dataset |
| `make gen-full` | Runs Python data generator for full-scale operational workload |
| `make load` | Loads generated CSV datasets into database via COPY |
| `make detect` | Runs anomaly detector rule engine against operational events |
| `make validate` | Runs integrity checks, checksums, and ground-truth validations |
| `make test` | Runs test suites across api, frontend, and pipeline |
| `make lint` | Executes linters and typecheckers (Ruff, Black, Mypy, ESLint) |
| `make dev-api` | Starts Fastify API service in watch mode |
| `make dev-web` | Starts React Vite frontend application |
| `make dev` | Starts Backend API and Frontend concurrently |

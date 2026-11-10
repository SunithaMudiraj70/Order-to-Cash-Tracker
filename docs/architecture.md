# System Architecture & Design Specification

## Overview

The **Order-to-Cash (O2C) Revenue Leakage & Process Delay Tracker** is an enterprise data and analytics platform designed to continuously audit, detect, and evaluate anomalies, margin leakage, and process bottlenecks across the commercial transaction graph.

---

## Architectural Principles

1. **Clean Architecture & Separation of Concerns**:
   - Master data (`account`, `quote`, `sales_order`) vs. fulfillment & settlement transactions (`shipment`, `invoice`, `payment`, `dispute`).
   - Ground truth anomaly repository strictly isolated from operational schemas.
2. **Event-Sourced State Transitions**:
   - In accordance with audit compliance and process mining standards, historical entity state is **never overwritten**.
   - Every mutation of an entity's status column automatically emits a cryptographically verifiable status change to `o2c.status_event`.
3. **12-Factor Configuration**:
   - Environment-variable-driven configuration across services via standardized schema validation.
4. **Zero Feature Leakage in Ground Truth**:
   - `gt.ground_truth` contains no foreign key relationships to operational tables (`o2c.*`) so that feature-store queries and detector evaluations remain completely isolated from benchmark labels.

---

## High-Level Topology

```
+-------------------------------------------------------------------------+
|                              Presentation Layer                         |
|                   apps/web (React 18 + Vite + TypeScript)               |
|                   - TanStack Query (Server State Cache)                 |
|                   - Zustand (Session, UI & Filter Store)                |
|                   - Tailwind CSS + Recharts Dashboard Visuals           |
+------------------------------------+------------------------------------+
                                     | REST / HTTPS
                                     v
+-------------------------------------------------------------------------+
|                               API Service Layer                         |
|                   apps/api (Fastify + Node.js + TypeScript)             |
|                   - Modular domain route handlers                       |
|                   - Zod schema validation & DTO serializing             |
|                   - Pino structured logging                             |
+------------------------------------+------------------------------------+
                                     | Supabase Client / Connection Pool
                                     v
+-------------------------------------------------------------------------+
|                               Database Layer                            |
|                          Supabase (PostgreSQL 15)                       |
|  +--------------------+  +--------------------+  +--------------------+  |
|  |    Schema: o2c     |  |    Schema: gt      |  | Schema: analytics  |  |
|  | - Operational core |  | - Ground Truth     |  | - AR Aging View    |  |
|  | - status_event     |  | - Injected labels  |  | - Leakage Summary  |  |
|  | - RLS enforcement  |  | - Isolated no FK   |  | - Cycle time view  |  |
|  +--------------------+  +--------------------+  +--------------------+  |
+-------------------+------------------------------------+----------------+
                    ^                                    ^
                    | Read Events & Tables               | Ingest & Seed
+-------------------+--------------------+  +------------+----------------+
|       services/detector (Python 3.11)  |  |   services/datagen (Python) |
|       - Rule execution engine          |  |   - Deterministic synthetics|
|       - Lead time & aging calculators  |  |   - Anomaly injector engine |
|       - Precision/Recall benchmarking  |  |   - Seed loader & checksums |
+----------------------------------------+  +-----------------------------+
```

---

## Role-Based Access Control Matrix

The PostgreSQL layer implements fine-grained Row-Level Security (RLS) driven by `o2c.profiles`:

| Role | Operational Read (`o2c.*`) | Operational Write (`o2c.*`) | Dispute Management | Ground Truth (`gt.*`) |
| :--- | :--- | :--- | :--- | :--- |
| **`customer`** | Own account records only | None | Create dispute | Forbidden |
| **`sales_ops`** | Full | Quotes, Orders, Shipments, Invoices | Read-only | Forbidden |
| **`support_agent`**| Full | None | Manage disputes | Forbidden |
| **`analyst`** | Full | None | Read-only | Read-only |
| **`admin`** | Full | Full | Full | Read & Write |


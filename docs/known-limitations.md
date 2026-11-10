# Known Architectural Limitations & Trade-offs

This document outlines the architectural trade-offs, engineering constraints, and conscious design choices made in the **Order-to-Cash (O2C) Revenue Leakage & Process Delay Tracker**.

---

## 1. Pagination: Keyset / Cursor vs. Offset Pagination

### Current Design:
- Entity and event records are accessed via **Keyset (Cursor-based) Pagination** ordered by primary key (`id ASC` or `created_at ASC, id ASC`) using `limit` (max 100 per page) and an optional `cursor` token.

### Trade-offs & Limitations:
- **Pros**:
  - Predictable $O(1)$ query latency regardless of table depth (e.g., paginating through all 10,000 quotes or 100,000+ status events requires indexing on `(account_id, id)` rather than scanning discarded rows).
  - Immunity to page-drift anomalies when concurrent inserts or state transitions occur during user browsing.
- **Cons**:
  - Direct jump-to-page (e.g., "go directly to page 45") is not supported. Users must navigate sequentially or apply specific filter ranges (such as status, date range, or account ID).
  - Bi-directional scrolling requires reverse cursor indexing which is currently simplified to forward-traversal pagination.

---

## 2. Event Persistence: Synchronous Triggers vs. Asynchronous Message Broker

### Current Design:
- Status transitions on quotes, orders, shipments, invoices, and payments are captured synchronously into `o2c.status_event` using PostgreSQL `AFTER INSERT OR UPDATE` triggers (`trg_audit_quote_status`, `trg_audit_order_status`, etc.) and row-level sequence IDs.

### Trade-offs & Limitations:
- **Pros**:
  - **Zero data loss & strict transactional consistency**: Status history cannot become desynchronized from the actual entity state because both commit in the identical Postgres ACID transaction.
  - No external distributed infrastructure (e.g. Apache Kafka, RabbitMQ, Redis Streams) required for core pipeline reliability.
- **Cons**:
  - Transaction latency overhead: Every status update incurs the cost of synchronous index updates and constraint evaluations on `o2c.status_event`.
  - Scalability threshold: High-frequency bulk ingestion (> 10,000 writes/sec) could encounter lock contention on `o2c.seq_status_event_id`. For enterprise hyper-scale, an outbox pattern with transactional log tailing (e.g. Debezium / Kafka Connect) would be preferred.

---

## 3. Memory Footprint at Full Scale

### Current Design:
- Synthetic data generation (`pipeline.datagen`) models state machines with interconnected referential integrity (quotes -> orders -> shipments -> invoices -> payments -> disputes).
- In-memory data graph generation maintains active entity lookups before streaming to CSV exports and staging tables.

### Trade-offs & Limitations:
- Generating 10,000 quotes, 7,010 sales orders, 8,049 invoices, and 15,000 payments consumes ~450 MB RAM in Python during the state-link phase.
- **Mitigation**: Bulk loading uses streaming `COPY FROM STDIN` via `psycopg` to keep database loader memory usage flat ($< 50\text{ MB}$) during ingestion.
- Future enhancement for $> 1,000,000$ quotes: Partition generation into temporal chunks or batch-stream entities using a persistent SQLite or RocksDB backing cache.

---

## 4. Multi-Currency & Foreign Exchange (FX)

### Current Design:
- All monetary amounts (`amount`, `unit_price`, `subtotal`, `tax`, `total_amount`, `allocated_amount`, `disputed_amount`, `leakage_amount`) are standardized to a single base currency: **USD ($)**.
- Database currency fields (`currency VARCHAR(3)`) are strictly constrained to `'USD'` across all tables and schemas.

### Trade-offs & Limitations:
- Eliminates real-time currency conversion discrepancies and multi-currency rounding issues in leakage calculations.
- Does not currently support international cross-border subsidiaries operating in non-USD currencies (e.g., EUR, GBP, JPY) without a foreign exchange rate table and historical FX conversion views.

---

## 5. Temporal Views & Cutoff Dates

### Current Design:
- Analytics views (`analytics.v_ar_aging_summary`, `analytics.v_cycle_time_delays`, `analytics.v_revenue_leakage`) use deterministic historical cutoff parameters (defaulting to dataset end-date `2026-10-31`) rather than non-deterministic `current_date` or `now()`.

### Trade-offs & Limitations:
- **Pros**: 100% reproducible analytical outputs and automated regression tests across past, present, and future testing runs.
- **Cons**: In a live continuous production environment, parameterized views or materialized views refreshed periodically with dynamic cutoff dates would be required for up-to-the-minute operational reporting.


# ADR 0001: Monorepo Architecture, Data Integrity, and Anomaly Isolation

## Context and Problem Statement
The Order-to-Cash (O2C) Revenue Leakage & Process Delay Tracker audits high-volume transactional flows spanning quotes, sales orders, shipments, billing, payments, and disputes. We require a robust, testable monorepo architecture that maintains:
1. Immutability of business transitions (auditability).
2. Clean decoupling between operational databases and anomaly detection evaluation (ground truth isolation).
3. Clear separation of concerns across Python services (data generation, detection), Fastify API, and React frontend.

## Decision Drivers
- Strict audit regulations: historical operational states must never be deleted or updated in place.
- Machine learning & benchmark integrity: data leakage from ground-truth labels into operational feature sets must be architecturally blocked.
- High developer velocity and strict typing: TypeScript across frontend/API and Python 3.11 with Ruff/Black/Mypy across data pipelines.

## Considered Options
1. **Single schema with `is_anomaly` flags directly on operational tables**:
   - *Rejected*: Poses immense risk of data leakage during ML training; violates clean separation of operational vs evaluation concerns.
2. **Event-Sourced Ledger with Separate Operational & Isolated Benchmark Schemas**:
   - *Accepted*: Operational data lives in `o2c` schema with database triggers writing to `o2c.status_event` (append-only). Benchmark data lives in `gt.ground_truth` without foreign keys to `o2c`.

## Consequences
- **Positive**:
  - `status_event` provides 100% auditable timeline of state changes with database-level guards against modification.
  - Zero risk of operational SQL queries accidentally reading ground-truth labels.
  - Fine-grained Row-Level Security (RLS) policies cleanly mapped to `o2c.profiles`.
- **Negative / Trade-offs**:
  - Ground truth validation requires explicit join keys in evaluation scripts since relational constraints are intentionally omitted.
  - Trigger logic introduces minor insertion overhead during status updates, mitigated by lean payload construction.


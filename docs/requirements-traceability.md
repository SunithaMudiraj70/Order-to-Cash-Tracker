# Order-to-Cash Requirements Traceability Matrix

This matrix maps system functional requirements to database schemas, migrations, backend APIs, frontend interfaces, and automated test verifications.

| ID | Requirement | DB / Migration | Backend Module | Frontend Component | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Full-scale reproducible synthetic O2C dataset | `0001`–`0006`, `0008` | `pipeline.datagen` | - | `test_datagen_smoke.py`, `manifests/reproducibility.json` |
| **REQ-02** | Strict baseline chronology (`quote <= order <= ship <= inv <= pay`) | `0003`, `0006` | `pipeline.datagen.validate` | - | `baseline_validation.json`, `validation_summary.json` |
| **REQ-03** | 10 discrete anomaly rules with distinct injection rates (0.4%–1.5%) | `0005`, `0011` | `pipeline.detector.rules` | `EvaluationPage.tsx` | `detector_eval.json`, `test_detector_smoke.py` |
| **REQ-04** | Negative decoy modeling (avoiding false alarms on valid edge cases) | `0005`, `0010` | `pipeline.datagen.anomalies` | `ExceptionsPage.tsx` | `detector evaluate` (0 False Positives, 100% Precision) |
| **REQ-05** | Revenue leakage analytics (underbilled, overbilled, unpaid closed) | `0010`, `0013` | `modules/analytics/repo.ts` | `LeakagePage.tsx` | `test_analytics_views.py`, `features.test.ts` |
| **REQ-06** | Process cycle time & delay tracking (strictly 1 row per order) | `0010`, `0013` | `modules/analytics/repo.ts` | `DelaysPage.tsx` | `test_cycle_time_delays_row_count_matches_orders` |
| **REQ-07** | Parameterized AR Aging with deterministic cutoff (zero `NOW()` calls) | `0010`, `0013` | `modules/analytics/service.ts` | `AgingPage.tsx` | `test_views_contain_no_current_date` |
| **REQ-08** | Exception findings inspection & triage workflow | `0011`, `0013` | `modules/exceptions/routes.ts` | `ExceptionDrawer.tsx` | `features.test.ts` (`POST /exceptions/:id/triage`) |
| **REQ-09** | Quote-to-order conversion & acceptance with 409 idempotency | `0002`, `0003` | `modules/quotes/routes.ts` | `RecordsPage.tsx` | `features.test.ts` (`POST /quotes/:id/convert`) |
| **REQ-10** | Admin user role management & tenant account scoping | `0007`, `0012` | `modules/admin/routes.ts` | `AdminPage.tsx` | `features.test.ts`, `verify_scoping_and_pagination.py` |
| **REQ-11** | Cursor-based pagination across 10,000 quotes without duplicates | `0002`, `0006` | `modules/records/service.ts` | `DataTable.tsx` | `verify_quote_pagination` in `verify_scoping_and_pagination.py` |
| **REQ-12** | Immutable append-only status event audit ledger | `0004`, `0008` | `modules/exceptions/repo.ts` | `ExceptionDrawer.tsx` | `test_status_event_blocks_update_and_delete` |
| **REQ-13** | Schema security hardening (RLS enabled, zero anon privileges) | `0007`, `0012` | `db/migrate.py` | - | `verify_db_state.py` (0 anon permissions across o2c/gt/analytics) |
| **REQ-14** | Production build hygiene (0 secrets in dist, tree-shaken debug panel) | - | `config/env.ts` | `App.tsx`, `LoginPage.tsx` | `npm run build --prefix frontend`, grep check on `dist/` |


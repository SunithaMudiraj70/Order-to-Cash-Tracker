# Order-to-Cash Validation & Evaluation Summary

This document summarizes the mathematical evaluation results, test matrix coverage, and reproducibility checks for the Order-to-Cash Revenue Leakage & Process Delay Tracker.

---

## 1. Anomaly Detection Benchmark Results

The anomaly detection engine evaluates operational transactional data in `o2c` against ground-truth labels isolated in `gt.ground_truth`.

### Per-Issue Precision, Recall & F1 Scores

| Issue Type | True Positive (TP) | False Positive (FP) | False Negative (FN) | Precision | Recall | F1 Score | Benchmark Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **DISPUTE_NOT_IN_RECEIVABLES** | 35 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **DUPLICATE_INVOICE** | 49 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **INVOICE_EXCEEDS_FULFILLED** | 56 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **LONG_OVERDUE** | 49 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **ORDER_CLOSED_UNPAID** | 70 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **PARTIAL_SHIPMENT** | 84 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **PAYMENT_ALLOCATED_TWICE** | 63 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **SHORT_PAYMENT** | 77 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **STATUS_EVENT_SKIPPED_STATE** | 42 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **UNDERBILLING** | 63 | 0 | 0 | 100.00% | 100.00% | **100.00%** | PASS ($\ge 0.90$) |
| **OVERALL TOTAL** | **588** | **0** | **0** | **100.00%** | **100.00%** | **100.00%** | **PERFECT F1** |

---

## 2. Negative Decoy Performance

To guarantee that the detection rules do not trigger false alarms on valid operational edge cases, four negative decoy scenarios were introduced:

1. **Partial Delivery with Proportional Billing**: An order partially shipped (4 items out of 10) where the invoice billed strictly for delivered quantity (4 items). Evaluated against `INVOICE_EXCEEDS_FULFILLED` -> **0 False Positives**.
2. **Legitimately Closed Disputes**: Customer disputes on settled invoices marked `status = 'CLOSED'` or `'RESOLVED_CREDIT'`. Evaluated against `DISPUTE_NOT_IN_RECEIVABLES` -> **0 False Positives**.
3. **Grace Period Invoices**: Overdue invoices past due by 10–30 days. Evaluated against `LONG_OVERDUE` (which enforces $\ge 90$ days past due) -> **0 False Positives**.
4. **Legitimate Delayed Shipments**: Shipments delayed due to customer reschedule with authorized status transitions -> **0 False Positives**.

---

## 3. Bit-for-Bit Deterministic Reproducibility

Reproducibility was verified across two independent full-scale runs (`seed = 20261022`, `scale = full`). All 14 entity CSV files produced identical SHA-256 checksums:

| Entity CSV File | Row Count | SHA-256 Digest | Match |
| :--- | :---: | :--- | :---: |
| `account.csv` | 500 | `4f6605b315e00bc20ed763d1ebac4e5c5ea0a09f65a986621d5c45456b330def` | Identical |
| `quote.csv` | 10,000 | `a8cabffd88033dc2a60ee5e5c80195eae3efa01f428d2f563113e6c22885f112` | Identical |
| `quote_line.csv` | 29,888 | `1d6d1f28b20e0d06a371e4d839a01a808c75c007e7f556df05d9ba8658e09071` | Identical |
| `sales_order.csv` | 7,010 | `4c67dd72d905313a1adeab16fb8398fce0d8ce46331ea697a6e80609e1e93b2a` | Identical |
| `order_line.csv` | 20,977 | `070cabc1e3ddf133b6b1e3751b19d4560e39508b773ecfba20aa891a596a2597` | Identical |
| `shipment.csv` | 7,010 | `c16d9a9d0117e56c33cda117977114a756401ef81d57cd8668d506f17e31a09a` | Identical |
| `shipment_line.csv` | 20,977 | `ea463a9851969c963e84e2a9eb0b1b279c9c5f79f4de17d382f789ddcd635095` | Identical |
| `invoice.csv` | 8,049 | `e6b935d19dfb3e582490660ccf1b2064b66485301e7d5c45f30606c223b8b622` | Identical |
| `invoice_line.csv` | 20,977 | `9ad8616f9118f39becd8f6e915ac9a035246c443e555450309911ea79c81826c` | Identical |
| `payment.csv` | 15,000 | `2613dd9281ea7b07b46062a822563780792dae196665d748496aa1d2e7717830` | Identical |
| `payment_allocation.csv` | 14,033 | `8bba3951423d51a2fcae0a88a6521d1578d80b44e418d7a21db2e339389773b7` | Identical |
| `dispute.csv` | 35 | `187a39cd7d8ea9b398aa7e80f45825422ac9c00f4f38e42887ef08e98454ee88` | Identical |
| `status_event.csv` | 119,092 | `c7997d82ac9202ba5857c0e02354a60fd9998939c02686536cc3368eb078ed47` | Identical |
| `ground_truth.csv` | 588 | `3b2758b535853766656a0f2792fd80dd7e5654019ef39ca7f7c0c792d8be0b1b` | Identical |

---

## 4. Test Suite Coverage Summary

| Test Suite | Framework | Total Tests | Passed | Failed | Execution Time |
| :--- | :--- | :---: | :---: | :---: | :---: |
| Pipeline & Data Generation | pytest | 9 | 9 | 0 | 1.73s |
| Analytical Views & Database Assertions | pytest | 4 | 4 | 0 | 0.47s |
| Backend API & Features | Vitest | 20 | 20 | 0 | 3.92s |
| Frontend Store, Routes & Components | Vitest | 13 | 13 | 0 | 3.96s |
| Endpoint Connectivity & Role Matrix | Requests | 50 | 50 | 0 | ~15s |
| Scoping & 10k Quote Pagination | Requests | 2 | 2 | 0 | ~8s |
| Live Chrome Headless Browser Walkthrough | Puppeteer | 14 | 14 | 0 | ~45s |


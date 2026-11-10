# O2C Revenue Leakage & Delay Detector

Rule engine evaluating operational events and ledger transactions to detect margin leakage, duplicate billings, unallocated cash, and process bottlenecks.

## Package Architecture

- `src/detector/rules/`: Declarative detection rules identifying leakage patterns.
- `src/detector/aging/`: AR aging calculation and overdue risk scoring.
- `src/detector/evaluate/`: Benchmark evaluation runner comparing detections against `gt.ground_truth` to compute precision, recall, and F1 scores.


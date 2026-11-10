"""Performance metrics scoring against gt.ground_truth.

TODO (Step 3): Calculate precision, recall, F1, and leakage dollar recovery metrics.
"""

from typing import Any, Dict, List
from pydantic import BaseModel


class EvaluationMetrics(BaseModel):
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    total_anomalies: int = 0
    detected_count: int = 0
    false_positives: int = 0
    false_negatives: int = 0


def compute_benchmark_metrics(
    detections: List[Dict[str, Any]], ground_truth: List[Dict[str, Any]]
) -> EvaluationMetrics:
    """Compare detections against ground truth labels."""
    # TODO (Step 3): Match by entity_type, entity_id, and issue_type
    return EvaluationMetrics()


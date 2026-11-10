"""Detector package smoke test."""

from detector.evaluate.metrics import EvaluationMetrics


def test_evaluation_metrics_defaults() -> None:
    metrics = EvaluationMetrics()
    assert metrics.precision == 0.0
    assert metrics.recall == 0.0
    assert metrics.f1_score == 0.0


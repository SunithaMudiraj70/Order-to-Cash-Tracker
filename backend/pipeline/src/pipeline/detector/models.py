"""Pydantic data models for detector findings and evaluation scores."""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class Finding(BaseModel):
    finding_id: str
    entity_type: str
    entity_id: str
    issue_type: str
    severity: str = "HIGH"
    evidence: dict[str, Any] = Field(default_factory=dict)
    detected_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class EvaluationMetric(BaseModel):
    issue_type: str
    true_positives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float

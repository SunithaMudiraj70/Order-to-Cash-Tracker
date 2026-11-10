"""Base rule contract.

TODO (Step 3): Implement abstract execution interface for event-stream rules.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List
from pydantic import BaseModel


class DetectionResult(BaseModel):
    rule_id: str
    entity_type: str
    entity_id: str
    severity: str
    confidence: float
    details: Dict[str, Any]


class BaseRule(ABC):
    rule_id: str
    description: str

    @abstractmethod
    def evaluate(self, events: List[Dict[str, Any]]) -> List[DetectionResult]:
        """Evaluate operational events and return detected anomalies."""
        raise NotImplementedError


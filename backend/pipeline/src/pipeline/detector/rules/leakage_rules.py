"""Leakage detection rule implementations.

TODO (Step 3): Implement specific anomaly detection rules:
- Duplicate invoice detector
- Billing exceeds shipment detector
- Unpaid closed order detector
"""

from typing import Any, Dict, List
from .base import BaseRule, DetectionResult


class DuplicateInvoiceRule(BaseRule):
    rule_id = "RULE-DUPLICATE-INVOICE"
    description = "Detects duplicate invoices issued against identical orders"

    def evaluate(self, events: List[Dict[str, Any]]) -> List[DetectionResult]:
        # TODO (Step 3): Implement duplicate check
        return []


class UnderbillingRule(BaseRule):
    rule_id = "RULE-UNDERBILLING"
    description = "Detects delivered goods billed below contracted quote price"

    def evaluate(self, events: List[Dict[str, Any]]) -> List[DetectionResult]:
        # TODO (Step 3): Implement underbilling check
        return []


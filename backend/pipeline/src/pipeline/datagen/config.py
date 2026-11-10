"""PURPOSE: Configuration parameters and volume profiles for synthetic data generation.
INPUT: environment variables, ScaleProfile enum
RETURNS: DatagenConfig and ScaleParameters instances
ERRORS: raises ValidationError on invalid parameters
"""

import os
from datetime import date
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field


class ScaleProfile(str, Enum):
    SMALL = "small"
    FULL = "full"


class ScaleParameters(BaseModel):
    quotes_count: int
    accounts_count: int
    target_orders_ratio: float = 0.70
    target_invoices_count: int
    target_payments_count: int
    max_lines_per_quote: int = 5


SCALE_CONFIGS = {
    ScaleProfile.SMALL: ScaleParameters(
        quotes_count=1000,
        accounts_count=80,
        target_invoices_count=800,
        target_payments_count=1500,
    ),
    ScaleProfile.FULL: ScaleParameters(
        quotes_count=10000,
        accounts_count=500,
        target_invoices_count=8000,
        target_payments_count=15000,
    ),
}

# Distinct per-issue rates between 0.4% and 1.5% of orders (total ~7.6%)
ANOMALY_RATES: dict[str, float] = {
    "INVOICE_EXCEEDS_FULFILLED": 0.008,  # ~56
    "PAYMENT_ALLOCATED_TWICE": 0.009,  # ~63
    "ORDER_CLOSED_UNPAID": 0.010,  # ~70
    "STATUS_EVENT_SKIPPED_STATE": 0.006,  # ~42
    "DISPUTE_NOT_IN_RECEIVABLES": 0.005,  # ~35
    "PARTIAL_SHIPMENT": 0.012,  # ~84
    "UNDERBILLING": 0.009,  # ~63
    "DUPLICATE_INVOICE": 0.007,  # ~49
    "SHORT_PAYMENT": 0.011,  # ~77
    "LONG_OVERDUE": 0.007,  # ~49
}


class DatagenConfig(BaseModel):
    """PURPOSE: Holds configuration settings for the data generation process.
    INPUT: seed: int, scale: ScaleProfile, anomaly_rate: float, inject_anomalies: bool
    RETURNS: DatagenConfig instance
    ERRORS: pydantic.ValidationError if types or values violate constraints
    """

    seed: int = Field(default_factory=lambda: int(os.getenv("DATAGEN_SEED", "20261022")))
    scale: ScaleProfile = Field(default_factory=lambda: ScaleProfile(os.getenv("DATAGEN_SCALE", "small").lower()))
    as_of_date: date = Field(default_factory=lambda: date.fromisoformat(os.getenv("DATAGEN_AS_OF_DATE", "2026-10-31")))
    inject_anomalies: bool = Field(default=True)
    anomaly_rates: dict[str, float] = Field(default_factory=lambda: ANOMALY_RATES.copy())
    base_data_dir: Path = Field(default=Path("data"))

    @property
    def output_dir(self) -> Path:
        return self.base_data_dir / "processed" / self.scale.value

    @property
    def manifest_dir(self) -> Path:
        return self.base_data_dir / "manifests"

    @property
    def params(self) -> ScaleParameters:
        return SCALE_CONFIGS[self.scale]

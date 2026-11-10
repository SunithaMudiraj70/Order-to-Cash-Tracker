"""Configuration parameters and volume profiles for synthetic data generation."""

import os
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
    max_lines_per_quote: int = 5


SCALE_CONFIGS = {
    ScaleProfile.SMALL: ScaleParameters(quotes_count=1000, accounts_count=80),
    ScaleProfile.FULL: ScaleParameters(quotes_count=10000, accounts_count=500),
}


class DatagenConfig(BaseModel):
    """PURPOSE: Holds configuration settings for the data generation process.
    INPUT: seed: int, scale: ScaleProfile, anomaly_rate: float
    RETURNS: DatagenConfig instance
    ERRORS: pydantic.ValidationError if types or values violate constraints
    """

    seed: int = Field(default_factory=lambda: int(os.getenv("DATAGEN_SEED", "20261022")))
    scale: ScaleProfile = Field(
        default_factory=lambda: ScaleProfile(os.getenv("DATAGEN_SCALE", "small").lower())
    )
    anomaly_rate: float = Field(default=0.08, ge=0.0, le=0.5)
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

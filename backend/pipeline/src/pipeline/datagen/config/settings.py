"""Generator configuration and scale definitions.

TODO (Step 2): Implement dynamic seed management and volume configurations.
"""

from enum import Enum
from pathlib import Path
from pydantic import BaseModel, Field


class ScaleProfile(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    FULL = "full"


class GeneratorConfig(BaseModel):
    seed: int = Field(default=20261022, description="Random seed for reproducibility")
    scale: ScaleProfile = Field(default=ScaleProfile.FULL, description="Volume scale profile")
    output_dir: Path = Field(
        default=Path("data/processed"), description="Target directory for generated datasets"
    )
    anomaly_rate: float = Field(
        default=0.08, description="Target probability for injecting operational anomalies"
    )


"""Serializers for CSV, JSON, and manifest files.

TODO (Step 2): Export datasets to data/processed and data/ground_truth.
"""

from pathlib import Path
from typing import Any, Dict, List


def export_to_csv(dataset: Dict[str, List[Dict[str, Any]]], output_dir: Path) -> None:
    """Write table dictionaries to CSV files in output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)
    # TODO (Step 2): Write CSV files with pandas/csv


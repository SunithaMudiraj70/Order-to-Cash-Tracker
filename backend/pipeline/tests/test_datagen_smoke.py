"""Datagen package integration and smoke tests."""

from pipeline.datagen.cli import build_dataset
from pipeline.datagen.config import DatagenConfig, ScaleProfile
from pipeline.datagen.validate import validate_dataset


def test_datagen_in_memory_generation_and_validation() -> None:
    """PURPOSE: Generate small-scale dataset in-memory and verify data dictionary integrity.
    INPUT: none
    RETURNS: None
    ERRORS: raises AssertionError if generation or validation fails
    """
    config = DatagenConfig(scale=ScaleProfile.SMALL, seed=20261022)
    dataset = build_dataset(config)

    assert len(dataset["accounts"]) == 80
    assert len(dataset["quotes"]) == 1000
    assert len(dataset["orders"]) > 500
    assert len(dataset["invoices"]) > 500
    assert len(dataset["ground_truth"]) > 0

    report = validate_dataset(dataset)
    assert report.is_valid is True
    assert len(report.errors) == 0

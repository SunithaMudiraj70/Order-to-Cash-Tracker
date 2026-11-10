"""Datagen package smoke test."""

from datagen.config.settings import GeneratorConfig, ScaleProfile


def test_generator_config_defaults() -> None:
    config = GeneratorConfig()
    assert config.seed == 20261022
    assert config.scale == ScaleProfile.FULL
    assert config.anomaly_rate == 0.08


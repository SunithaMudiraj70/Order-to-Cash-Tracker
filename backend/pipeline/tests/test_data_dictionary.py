"""PURPOSE: Assert all model schema fields define required data dictionary properties.
INPUT: models in pipeline.datagen.models
RETURNS: None
ERRORS: raises AssertionError on missing or invalid property mappings
"""

from pathlib import Path

import scripts.gen_data_dictionary as gdd
from pydantic import BaseModel

from pipeline.datagen import models


def test_models_have_valid_data_dictionary_properties() -> None:
    """PURPOSE: Verify all models and fields map to valid 6 data dictionary attributes.
    INPUT: None
    RETURNS: None
    ERRORS: raises AssertionError
    """
    assert len(models.__all__) >= 10
    for entity_name in models.__all__:
        cls = getattr(models, entity_name)
        assert issubclass(cls, BaseModel)
        for field_name, field_info in cls.model_fields.items():
            ftype = gdd.get_field_type(field_info)
            req = "Required" if field_info.is_required() else "Optional"
            allowed = gdd.get_allowed_values(field_name, field_info)
            units = gdd.get_units(field_name)
            uniq = gdd.get_uniqueness(field_name, entity_name.replace("Row", ""))
            vrule = gdd.get_validation_rule(field_name, field_info)

            assert len(ftype) > 0, f"Empty type for {entity_name}.{field_name}"
            assert req in ("Required", "Optional")
            assert len(allowed) > 0, f"Empty allowed values for {entity_name}.{field_name}"
            assert len(units) > 0, f"Empty units for {entity_name}.{field_name}"
            assert uniq in ("Unique (PK)", "Foreign Key", "Non-unique")
            assert len(vrule) > 0, f"Empty validation rule for {entity_name}.{field_name}"


def test_data_dictionary_markdown_exists_and_contains_all_entities() -> None:
    """PURPOSE: Verify generated docs/data-dictionary.md exists and covers all entities.
    INPUT: None
    RETURNS: None
    ERRORS: raises AssertionError
    """
    doc_path = Path(__file__).resolve().parents[3] / "docs" / "data-dictionary.md"
    assert doc_path.exists(), "docs/data-dictionary.md does not exist"
    content = doc_path.read_text(encoding="utf-8")
    for entity_name in models.__all__:
        clean_name = entity_name.replace("Row", "")
        assert f"## {clean_name}" in content, f"Missing section for {clean_name}"

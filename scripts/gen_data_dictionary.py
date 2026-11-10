"""PURPOSE: Generate docs/data-dictionary.md automatically from Pydantic schema models.
INPUT: None
RETURNS: None
ERRORS: raises IOError on filesystem write errors
"""

import inspect
import sys
from pathlib import Path
from pydantic import BaseModel
from pydantic.fields import FieldInfo

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "pipeline" / "src"))
from pipeline.datagen import models  # noqa: E402


def get_field_type(field_info: FieldInfo) -> str:
    """PURPOSE: Format python field annotation into readable markdown type name.
    INPUT: field_info: FieldInfo
    RETURNS: str
    ERRORS: none
    """
    annotation = getattr(field_info, "annotation", None)
    if annotation is None:
        return "Any"
    t = str(annotation).replace("typing.", "").replace("<class '", "").replace("'>", "")
    t = t.replace("datetime.date", "date").replace("datetime.datetime", "datetime")
    return t.replace("decimal.Decimal", "Decimal")


def get_allowed_values(name: str, field: FieldInfo) -> str:
    """PURPOSE: Determine domain of allowed values for a field.
    INPUT: name: str, field: FieldInfo
    RETURNS: str
    ERRORS: none
    """
    if "currency" in name:
        return "USD"
    if name == "status":
        return "ACTIVE, DRAFT, SENT, ACCEPTED, ISSUED, PAID, OVERDUE, OPEN, RESOLVED, etc."
    if name == "method":
        return "WIRE, ACH, CHECK, CREDIT_CARD"
    if name == "segment":
        return "ENTERPRISE, MID_MARKET, SMB"
    if name == "region":
        return "NORTH_AMERICA, EMEA, APAC, LATAM"
    if name == "issue_type":
        return "Valid Anomaly Type"
    return "-" if get_field_type(field) not in ["str", "str | None"] else "Any text"


def get_units(name: str) -> str:
    """PURPOSE: Determine unit of measure for numeric or temporal attributes.
    INPUT: name: str
    RETURNS: str
    ERRORS: none
    """
    if any(k in name for k in ["amount", "price", "balance", "limit", "total"]):
        return "USD"
    if "discount_pct" in name:
        return "%"
    if "terms_days" in name:
        return "days"
    if "qty" in name:
        return "items"
    return "-"


def get_uniqueness(name: str, entity: str) -> str:
    """PURPOSE: Determine primary key, foreign key, or uniqueness constraint.
    INPUT: name: str, entity: str
    RETURNS: str
    ERRORS: none
    """
    if name.endswith("_id"):
        norm_name = name.replace("_id", "").replace("_", "").lower()
        norm_entity = entity.lower().replace("sales", "").replace("master", "")
        if norm_name in [norm_entity, "gt" if entity == "GroundTruth" else ""]:
            return "Unique (PK)"
        return "Foreign Key"
    return "Non-unique"


def get_validation_rule(name: str, field: FieldInfo) -> str:
    """PURPOSE: Extract validation rules, regex patterns, or ranges for a field.
    INPUT: name: str, field: FieldInfo
    RETURNS: str
    ERRORS: none
    """
    for meta in getattr(field, "metadata", []):
        if hasattr(meta, "pattern"):
            return f"Regex: `{meta.pattern}`"
    ftype = get_field_type(field)
    if "Decimal" in ftype or "int" in ftype:
        return "Numeric >= 0"
    if "date" in ftype or "datetime" in ftype:
        return "Valid ISO 8601"
    if not field.is_required():
        return "Nullable / Optional"
    return "Not Null"


def generate_markdown() -> str:
    """PURPOSE: Inspect Pydantic models in models.py and render 6-column markdown doc.
    INPUT: None
    RETURNS: str
    ERRORS: none
    """
    lines = [
        "# Order-to-Cash (O2C) Data Dictionary",
        "",
        "> Auto-generated from source of truth Pydantic models (`backend/pipeline/src/pipeline/datagen/models.py`).",
        "",
    ]
    for name, obj in inspect.getmembers(models, inspect.isclass):
        if issubclass(obj, BaseModel) and obj is not BaseModel and name.endswith("Row"):
            entity = name.replace("Row", "")
            lines.extend([
                f"## {entity}",
                "",
                "| Field | Type | Required / Optional | Allowed Values | Units | Uniqueness | Validation Rule |",
                "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
            ])
            for f_name, field in obj.model_fields.items():
                f_type = f"`{get_field_type(field)}`"
                req = "Required" if field.is_required() else "Optional"
                vals = get_allowed_values(f_name, field)
                units = get_units(f_name)
                uniq = get_uniqueness(f_name, entity)
                vrule = get_validation_rule(f_name, field)
                lines.append(f"| `{f_name}` | {f_type} | {req} | {vals} | {units} | {uniq} | {vrule} |")
            lines.append("")
    return "\n".join(lines)


def main() -> None:
    """PURPOSE: CLI entry point writing markdown to docs/data-dictionary.md.
    INPUT: None
    RETURNS: None
    ERRORS: raises IOError
    """
    content = generate_markdown()
    target_path = Path(__file__).resolve().parent.parent / "docs" / "data-dictionary.md"
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(content, encoding="utf-8")
    print(f"Data dictionary generated successfully at: {target_path}")


if __name__ == "__main__":
    main()

"""PURPOSE: Generate docs/data-dictionary.md automatically from Pydantic schema models.
INPUT: None
RETURNS: None
ERRORS: raises IOError on filesystem write errors
"""

import inspect
import sys
from pathlib import Path
from pydantic import BaseModel

# Add pipeline src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "pipeline" / "src"))
from pipeline.datagen import models  # noqa: E402


def format_field_type(field_info) -> str:
    """PURPOSE: Format python field annotation into readable markdown type name.
    INPUT: field_info: pydantic.fields.FieldInfo
    RETURNS: str
    ERRORS: none
    """
    annotation = getattr(field_info, "annotation", None)
    if annotation is None:
        return "Any"
    type_str = str(annotation).replace("typing.", "").replace("<class '", "").replace("'>", "")
    type_str = type_str.replace("datetime.date", "date").replace("datetime.datetime", "datetime")
    type_str = type_str.replace("decimal.Decimal", "Decimal")
    return f"`{type_str}`"


def generate_markdown() -> str:
    """PURPOSE: Inspect Pydantic models in models.py and render markdown documentation.
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
            entity_name = name.replace("Row", "")
            lines.append(f"## {entity_name}")
            lines.append("")
            lines.append("| Field | Type | Required | Constraints / Default |")
            lines.append("| :--- | :--- | :--- | :--- |")

            for field_name, field in obj.model_fields.items():
                ftype = format_field_type(field)
                is_required = "Yes" if field.is_required() else "No"
                default_val = ""
                if field.default is not None and str(field.default) != "PydanticUndefined":
                    default_val = f"Default: `{field.default}`"
                elif field.default_factory is not None:
                    default_val = "Default factory"

                constraints = []
                for meta in getattr(field, "metadata", []):
                    if hasattr(meta, "pattern"):
                        constraints.append(f"Regex: `{meta.pattern}`")

                info = ", ".join(filter(None, [default_val] + constraints)) or "-"
                lines.append(f"| `{field_name}` | {ftype} | {is_required} | {info} |")

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

"""PURPOSE: Export in-memory dataset to SQL seed scripts and JSON files.
INPUT: dataset dict, target Path
RETURNS: Path to written file
ERRORS: raises OSError on write failure
"""

import json
from pathlib import Path
from typing import Any


def _format_sql_value(val: Any) -> str:
    """PURPOSE: Escape and format a python value into safe SQL literal.
    INPUT: val: Any
    RETURNS: str
    ERRORS: none
    """
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, dict):
        s = json.dumps(val).replace("'", "''")
        return f"'{s}'::jsonb"
    s = str(val).replace("'", "''")
    return f"'{s}'"


def export_sql_seed(dataset: dict[str, list[Any]], output_path: Path) -> Path:
    """PURPOSE: Serialize dataset tables to executable PostgreSQL seed script.
    INPUT: dataset, output_path
    RETURNS: Path
    ERRORS: none
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    table_target_map = [
        ("accounts", "o2c.account"),
        ("quotes", "o2c.quote"),
        ("quote_lines", "o2c.quote_line"),
        ("orders", "o2c.sales_order"),
        ("order_lines", "o2c.order_line"),
        ("shipments", "o2c.shipment"),
        ("shipment_lines", "o2c.shipment_line"),
        ("invoices", "o2c.invoice"),
        ("invoice_lines", "o2c.invoice_line"),
        ("payments", "o2c.payment"),
        ("allocations", "o2c.payment_allocation"),
        ("disputes", "o2c.dispute"),
        ("status_events", "o2c.status_event"),
        ("ground_truth", "gt.ground_truth"),
    ]
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("-- Order-to-Cash Database Seed Script\nBEGIN;\n\n")
        for key, sql_table in table_target_map:
            rows = dataset.get(key, [])
            if not rows:
                continue
            cols = list(rows[0].model_dump().keys())
            f.write(f"-- {sql_table} ({len(rows)} rows)\n")
            for r in rows:
                d = r.model_dump()
                vals = [_format_sql_value(d.get(c)) for c in cols]
                f.write(f"INSERT INTO {sql_table} ({', '.join(cols)}) VALUES ({', '.join(vals)});\n")
            f.write("\n")
        f.write("COMMIT;\n")
    return output_path


def export_json_tables(dataset: dict[str, list[Any]], output_dir: Path) -> None:
    """PURPOSE: Export tables in JSON format alongside CSV exports.
    INPUT: dataset, output_dir
    RETURNS: None
    ERRORS: none
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    for key, rows in dataset.items():
        path = output_dir / f"{key}.json"
        data = [r.model_dump(mode="json") if hasattr(r, "model_dump") else r for r in rows]
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)


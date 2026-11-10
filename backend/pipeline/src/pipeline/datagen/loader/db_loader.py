"""Direct loader inserting generated dataframes into Supabase PostgreSQL.

TODO (Step 2): Implement bulk copy with psycopg3 into o2c and gt schemas.
"""

from typing import Any, Dict, List


def load_to_database(
    dataset: Dict[str, List[Dict[str, Any]]],
    ground_truth: List[Dict[str, Any]],
    database_url: str,
) -> None:
    """Insert operational dataset into o2c schema and ground truth into gt schema."""
    # TODO (Step 2): Bulk insert via COPY or multi-row insert


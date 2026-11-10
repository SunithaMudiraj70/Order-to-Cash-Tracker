"""Generation of master entities: accounts, quotes, quote lines, orders, and order lines."""

from datetime import UTC, datetime
from decimal import Decimal

import numpy as np
from faker import Faker

from pipeline.datagen import ids
from pipeline.datagen.derive import round_money
from pipeline.datagen.master_orders import generate_sales_orders
from pipeline.datagen.master_quotes import SKU_CATALOG, generate_quotes
from pipeline.datagen.models import AccountRow

TERMS_BY_SEGMENT = {"Enterprise": [45, 60], "Mid-Market": [30, 45], "SMB": [15, 30]}


def _create_single_account(rng: np.random.Generator, faker: Faker, idx: int, created_ts: datetime) -> AccountRow:
    """PURPOSE: Construct single account row with randomized attributes.
    INPUT: rng, faker, idx, created_ts
    RETURNS: AccountRow
    ERRORS: none
    """
    seg = str(rng.choice(["Enterprise", "Mid-Market", "SMB"], p=[0.25, 0.45, 0.30]))
    terms = int(rng.choice(TERMS_BY_SEGMENT[seg]))
    limit = round_money(Decimal(str(float(rng.lognormal(11.0, 0.8)))))
    region = str(rng.choice(["NA", "EMEA", "APAC", "LATAM"]))
    return AccountRow(
        account_id=ids.account_id(idx),
        name=faker.company(),
        segment=seg,
        region=region,
        credit_limit=limit,
        payment_terms_days=terms,
        status="ACTIVE",
        created_at=created_ts,
        effective_from=created_ts,
    )


def generate_accounts(rng: np.random.Generator, faker: Faker, count: int) -> list[AccountRow]:
    """PURPOSE: Generate customer master accounts with credit and term attributes.
    INPUT: rng: Generator, faker: Faker, count: int
    RETURNS: list[AccountRow]
    ERRORS: none
    """
    ts = datetime(2025, 12, 1, 0, 0, 0, tzinfo=UTC)
    return [_create_single_account(rng, faker, i, ts) for i in range(1, count + 1)]


__all__ = [
    "SKU_CATALOG",
    "TERMS_BY_SEGMENT",
    "generate_accounts",
    "generate_quotes",
    "generate_sales_orders",
]

"""Generation of sales quotes and quote lines with acceptance logic."""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import numpy as np

from pipeline.datagen import ids
from pipeline.datagen.config import ScaleParameters
from pipeline.datagen.derive import calc_line_total
from pipeline.datagen.models import AccountRow, QuoteLineRow, QuoteRow

SKU_CATALOG = [
    ("SKU-SRV-001", "Enterprise Server Appliance X1", Decimal("4500.00")),
    ("SKU-SW-002", "Relational Database License", Decimal("1200.00")),
    ("SKU-SEC-003", "NextGen Hardware Firewall", Decimal("2800.00")),
    ("SKU-STR-004", "High-Throughput SAN Storage", Decimal("8500.00")),
    ("SKU-NW-005", "48-Port Managed Core Switch", Decimal("1650.00")),
    ("SKU-SVC-006", "Consulting Architecture Pack", Decimal("2200.00")),
]


def _build_quote_lines(
    rng: np.random.Generator, q_id: str, q_created: datetime, num_lines: int, start_idx: int
) -> tuple[list[QuoteLineRow], Decimal, int]:
    """PURPOSE: Generate individual quote lines and compute quote total.
    INPUT: rng, q_id, q_created, num_lines, start_idx
    RETURNS: tuple[list[QuoteLineRow], Decimal, int]
    ERRORS: none
    """
    lines: list[QuoteLineRow] = []
    total = Decimal("0.00")
    curr_idx = start_idx
    for line_no in range(1, num_lines + 1):
        sku, desc, price = SKU_CATALOG[int(rng.integers(0, len(SKU_CATALOG)))]
        qty = Decimal(int(rng.integers(1, 15)))
        disc = Decimal(int(rng.choice([0, 5, 10, 15], p=[0.5, 0.25, 0.15, 0.1])))
        line_tot = calc_line_total(qty, price, disc)
        total += line_tot
        lines.append(
            QuoteLineRow(
                quote_line_id=ids.quote_line_id(curr_idx),
                quote_id=q_id,
                line_no=line_no,
                sku=sku,
                description=desc,
                qty=qty,
                unit_price=price,
                discount_pct=disc,
                line_total=line_tot,
                created_at=q_created,
            )
        )
        curr_idx += 1
    return lines, total, curr_idx


def generate_quotes(
    rng: np.random.Generator, accounts: list[AccountRow], params: ScaleParameters
) -> tuple[list[QuoteRow], list[QuoteLineRow]]:
    """PURPOSE: Generate quotes and itemized lines with ~70% acceptance probability.
    INPUT: rng: Generator, accounts: list[AccountRow], params: ScaleParameters
    RETURNS: tuple[list[QuoteRow], list[QuoteLineRow]]
    ERRORS: none
    """
    quotes: list[QuoteRow] = []
    lines: list[QuoteLineRow] = []
    line_idx = 1
    base_date = date(2026, 1, 15)

    for i in range(1, params.quotes_count + 1):
        acc = accounts[int(rng.integers(0, len(accounts)))]
        q_date = base_date + timedelta(days=int(rng.integers(0, 200)))
        status = (
            "ACCEPTED"
            if rng.random() < params.target_orders_ratio
            else ("REJECTED" if rng.random() < 0.6 else "EXPIRED")
        )
        q_id = ids.quote_id(i)
        q_created = datetime.combine(q_date, datetime.min.time(), tzinfo=UTC)
        n_lines = int(rng.integers(1, params.max_lines_per_quote + 1))
        q_lines, q_total, line_idx = _build_quote_lines(rng, q_id, q_created, n_lines, line_idx)
        lines.extend(q_lines)
        quotes.append(
            QuoteRow(
                quote_id=q_id,
                account_id=acc.account_id,
                status=status,
                quote_date=q_date,
                valid_until=q_date + timedelta(days=30),
                total_amount=q_total,
                currency="USD",
                created_at=q_created,
            )
        )
    return quotes, lines

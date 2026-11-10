"""Generation of confirmed sales orders and itemized order lines from quotes."""

from datetime import UTC, datetime, timedelta

import numpy as np

from pipeline.datagen import ids
from pipeline.datagen.models import OrderLineRow, QuoteLineRow, QuoteRow, SalesOrderRow


def _build_order_lines(
    q_lines: list[QuoteLineRow], order_id: str, o_created: datetime, start_idx: int
) -> tuple[list[OrderLineRow], int]:
    """PURPOSE: Generate order line items matching quote lines.
    INPUT: q_lines, order_id, o_created, start_idx
    RETURNS: tuple[list[OrderLineRow], int]
    ERRORS: none
    """
    lines: list[OrderLineRow] = []
    idx = start_idx
    for ql in q_lines:
        lines.append(
            OrderLineRow(
                order_line_id=ids.order_line_id(idx),
                order_id=order_id,
                quote_line_id=ql.quote_line_id,
                line_no=ql.line_no,
                sku=ql.sku,
                ordered_qty=ql.qty,
                unit_price=ql.unit_price,
                line_total=ql.line_total,
                created_at=o_created,
            )
        )
        idx += 1
    return lines, idx


def generate_sales_orders(
    rng: np.random.Generator,
    quotes: list[QuoteRow],
    quote_lines: list[QuoteLineRow],
) -> tuple[list[SalesOrderRow], list[OrderLineRow]]:
    """PURPOSE: Convert accepted quotes into confirmed sales orders and order lines.
    INPUT: rng: Generator, quotes: list[QuoteRow], quote_lines: list[QuoteLineRow]
    RETURNS: tuple[list[SalesOrderRow], list[OrderLineRow]]
    ERRORS: none
    """
    ql_by_quote: dict[str, list[QuoteLineRow]] = {}
    for ql in quote_lines:
        ql_by_quote.setdefault(ql.quote_id, []).append(ql)

    orders: list[SalesOrderRow] = []
    order_lines: list[OrderLineRow] = []
    o_idx, ol_idx = 1, 1

    for q in quotes:
        if q.status != "ACCEPTED":
            continue
        order_date = q.quote_date + timedelta(days=int(rng.integers(1, 4)))
        promised = order_date + timedelta(days=int(rng.integers(7, 21)))
        order_id = ids.order_id(o_idx)
        o_created = datetime.combine(order_date, datetime.min.time(), tzinfo=UTC)

        lines, ol_idx = _build_order_lines(
            ql_by_quote.get(q.quote_id, []), order_id, o_created, ol_idx
        )
        order_lines.extend(lines)
        orders.append(
            SalesOrderRow(
                order_id=order_id,
                quote_id=q.quote_id,
                account_id=q.account_id,
                status="CREATED",
                order_date=order_date,
                promised_date=promised,
                total_amount=q.total_amount,
                currency="USD",
                created_at=o_created,
            )
        )
        o_idx += 1
    return orders, order_lines

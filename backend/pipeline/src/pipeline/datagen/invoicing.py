"""Invoice line construction and itemization calculations."""

from datetime import datetime
from decimal import Decimal

from pipeline.datagen import ids
from pipeline.datagen.derive import calc_line_total
from pipeline.datagen.models import InvoiceLineRow, OrderLineRow


def build_invoice_lines(
    lines: list[OrderLineRow], inv_id: str, inv_created: datetime, start_idx: int
) -> tuple[list[InvoiceLineRow], Decimal, int]:
    """PURPOSE: Construct invoice lines and compute subtotal.
    INPUT: lines, inv_id, inv_created, start_idx
    RETURNS: tuple[list[InvoiceLineRow], Decimal, int]
    ERRORS: none
    """
    inv_lines: list[InvoiceLineRow] = []
    subtotal = Decimal("0.00")
    idx = start_idx
    for ol in lines:
        lt = calc_line_total(ol.ordered_qty, ol.unit_price)
        subtotal += lt
        inv_lines.append(
            InvoiceLineRow(
                invoice_line_id=ids.invoice_line_id(idx),
                invoice_id=inv_id,
                order_line_id=ol.order_line_id,
                billed_qty=ol.ordered_qty,
                unit_price=ol.unit_price,
                line_total=lt,
                created_at=inv_created,
            )
        )
        idx += 1
    return inv_lines, subtotal, idx


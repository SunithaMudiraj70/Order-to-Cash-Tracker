"""Generation of carrier shipments and fulfilled line items for orders."""

from datetime import UTC, datetime, timedelta

import numpy as np

from pipeline.datagen import ids
from pipeline.datagen.models import OrderLineRow, SalesOrderRow, ShipmentLineRow, ShipmentRow

CARRIERS = ["FedEx Freight", "UPS Supply Chain", "DHL Global Forwarding", "Maersk Logistics"]


def _build_shipment_lines(
    lines: list[OrderLineRow], s_id: str, s_created: datetime, start_idx: int
) -> tuple[list[ShipmentLineRow], int]:
    """PURPOSE: Construct shipment lines for each ordered item.
    INPUT: lines, s_id, s_created, start_idx
    RETURNS: tuple[list[ShipmentLineRow], int]
    ERRORS: none
    """
    s_lines: list[ShipmentLineRow] = []
    idx = start_idx
    for ol in lines:
        s_lines.append(
            ShipmentLineRow(
                shipment_line_id=ids.shipment_line_id(idx),
                shipment_id=s_id,
                order_line_id=ol.order_line_id,
                shipped_qty=ol.ordered_qty,
                created_at=s_created,
            )
        )
        idx += 1
    return s_lines, idx


def generate_fulfillments(
    rng: np.random.Generator,
    orders: list[SalesOrderRow],
    order_lines: list[OrderLineRow],
) -> tuple[list[ShipmentRow], list[ShipmentLineRow]]:
    """PURPOSE: Generate carrier shipments and fulfilled line items for orders.
    INPUT: rng: Generator, orders: list[SalesOrderRow], order_lines: list[OrderLineRow]
    RETURNS: tuple[list[ShipmentRow], list[ShipmentLineRow]]
    ERRORS: none
    """
    ol_by_order: dict[str, list[OrderLineRow]] = {}
    for ol in order_lines:
        ol_by_order.setdefault(ol.order_id, []).append(ol)

    shipments: list[ShipmentRow] = []
    shipment_lines: list[ShipmentLineRow] = []
    shp_idx, sl_idx = 1, 1

    for o in orders:
        lines = ol_by_order.get(o.order_id, [])
        ship_date = o.order_date + timedelta(days=int(rng.integers(3, 10)))
        deliv_date = ship_date + timedelta(days=int(rng.integers(2, 6)))
        s_id = ids.shipment_id(shp_idx)
        s_created = datetime.combine(ship_date, datetime.min.time(), tzinfo=UTC)

        s_lines, sl_idx = _build_shipment_lines(lines, s_id, s_created, sl_idx)
        shipment_lines.extend(s_lines)
        shipments.append(
            ShipmentRow(
                shipment_id=s_id,
                order_id=o.order_id,
                status="DELIVERED",
                ship_date=ship_date,
                delivered_date=deliv_date,
                carrier=str(rng.choice(CARRIERS)),
                tracking_number=f"TRK{int(rng.integers(10000000, 99999999))}",
                created_at=s_created,
            )
        )
        shp_idx += 1
    return shipments, shipment_lines

"""PURPOSE: Generation of invoices, bill lines, remittances, and baseline payment allocations.
INPUT: orders, order_lines, accounts, shipments, params, as_of
RETURNS: tuple of (invoices, invoice_lines, payments, allocations, disputes)
ERRORS: none
"""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import numpy as np

from pipeline.datagen import ids
from pipeline.datagen.config import ScaleParameters
from pipeline.datagen.derive import calc_balance_amount, calc_due_date, round_money
from pipeline.datagen.invoicing import build_invoice_lines
from pipeline.datagen.models import (
    AccountRow,
    DisputeRow,
    InvoiceLineRow,
    InvoiceRow,
    OrderLineRow,
    PaymentAllocationRow,
    PaymentRow,
    SalesOrderRow,
    ShipmentRow,
)
from pipeline.datagen.settlements_payments import (
    PAYMENT_METHODS,
    create_settlement_instalments,
    create_unallocated_batch,
)


def _build_milestone_invoice(
    subtotal: Decimal, inv_idx: int, o: SalesOrderRow, inv_date: date, due: date, will_pay: bool, inv_created: datetime
) -> InvoiceRow:
    """PURPOSE: Construct secondary milestone billing invoice for an order.
    INPUT: subtotal, inv_idx, o, inv_date, due, will_pay, inv_created
    RETURNS: InvoiceRow
    ERRORS: none
    """
    m_id = ids.invoice_id(inv_idx)
    m_sub = round_money(subtotal * Decimal("0.10"))
    m_tax = round_money(m_sub * Decimal("0.08"))
    m_tot = m_sub + m_tax
    return InvoiceRow(
        invoice_id=m_id, order_id=o.order_id, account_id=o.account_id,
        status="PAID" if will_pay else "ISSUED", invoice_date=inv_date + timedelta(days=1),
        due_date=due + timedelta(days=1), subtotal=m_sub, tax=m_tax, total_amount=m_tot,
        paid_amount=m_tot if will_pay else Decimal("0.00"), balance_amount=Decimal("0.00") if will_pay else m_tot,
        currency="USD", created_at=inv_created
    )


def generate_invoices_and_settlement(
    rng: np.random.Generator,
    orders: list[SalesOrderRow],
    order_lines: list[OrderLineRow],
    accounts: list[AccountRow],
    shipments: list[ShipmentRow],
    params: ScaleParameters,
    as_of: date,
) -> tuple[list[InvoiceRow], list[InvoiceLineRow], list[PaymentRow], list[PaymentAllocationRow], list[DisputeRow]]:
    """PURPOSE: Generate parameterized invoices and remittances matching volume requirements.
    INPUT: rng, orders, order_lines, accounts, shipments, params, as_of
    RETURNS: tuple of (invoices, invoice_lines, payments, allocations, disputes)
    ERRORS: none
    """
    acc_terms = {a.account_id: a.payment_terms_days for a in accounts}
    ol_by_order: dict[str, list[OrderLineRow]] = {}
    for ol in order_lines:
        ol_by_order.setdefault(ol.order_id, []).append(ol)
    ship_by_order = {s.order_id: s for s in shipments}

    invoices, inv_lines, payments, allocations, disputes = [], [], [], [], []
    inv_idx, il_idx, pay_idx, alc_idx = 1, 1, 1, 1
    extra_invoices_needed = max(0, params.target_invoices_count - len(orders))

    for idx, o in enumerate(orders):
        ship = ship_by_order.get(o.order_id)
        ship_date = ship.ship_date if ship else o.order_date + timedelta(days=4)
        inv_date = ship_date + timedelta(days=int(rng.integers(0, 3)))
        terms = acc_terms.get(o.account_id, 30)
        due = calc_due_date(inv_date, terms)
        inv_id = ids.invoice_id(inv_idx)
        inv_created = datetime.combine(inv_date, datetime.min.time(), tzinfo=UTC)

        lines = ol_by_order.get(o.order_id, [])
        b_lines, subtotal, il_idx = build_invoice_lines(lines, inv_id, inv_created, il_idx)
        inv_lines.extend(b_lines)
        tax = round_money(subtotal * Decimal("0.08"))
        total = subtotal + tax
        will_pay = due <= as_of
        paid = total if will_pay else Decimal("0.00")
        bal = calc_balance_amount(total, paid)

        if will_pay:
            pays, alcs, pay_idx, alc_idx = create_settlement_instalments(
                rng, o, inv_id, inv_date, due, terms, total, pay_idx, alc_idx
            )
            payments.extend(pays)
            allocations.extend(alcs)

        invoices.append(InvoiceRow(
            invoice_id=inv_id, order_id=o.order_id, account_id=o.account_id,
            status="PAID" if will_pay else ("OVERDUE" if due < as_of else "ISSUED"),
            invoice_date=inv_date, due_date=due, subtotal=subtotal, tax=tax,
            total_amount=total, paid_amount=paid, balance_amount=bal, currency="USD",
            created_at=inv_created
        ))
        inv_idx += 1

        if idx < extra_invoices_needed:
            invoices.append(_build_milestone_invoice(subtotal, inv_idx, o, inv_date, due, will_pay, inv_created))
            inv_idx += 1

    rem_payments = max(0, params.target_payments_count - len(payments))
    if rem_payments > 0:
        payments.extend(create_unallocated_batch(rng, accounts, rem_payments, as_of, pay_idx))

    return invoices, inv_lines, payments, allocations, disputes

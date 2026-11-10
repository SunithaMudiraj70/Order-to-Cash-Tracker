"""Generation of invoices, lines, and baseline payment allocations."""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import numpy as np
from faker import Faker

from pipeline.datagen import ids
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
)

PAYMENT_METHODS = ["WIRE", "ACH", "CHECK", "CREDIT_CARD"]


def _create_settlement(
    rng: np.random.Generator,
    o: SalesOrderRow,
    inv_id: str,
    inv_date: date,
    due: date,
    terms: int,
    total: Decimal,
    pay_idx: int,
    alc_idx: int,
) -> tuple[PaymentRow, PaymentAllocationRow]:
    """PURPOSE: Create baseline remittance and allocation for settled invoice.
    INPUT: rng, o, inv_id, inv_date, due, terms, total, pay_idx, alc_idx
    RETURNS: tuple[PaymentRow, PaymentAllocationRow]
    ERRORS: none
    """
    p_id = ids.payment_id(pay_idx)
    pay_offset = int(rng.integers(1, max(2, terms - 2)))
    pay_date = min(due, inv_date + timedelta(days=pay_offset))
    pay_created = datetime.combine(pay_date, datetime.min.time(), tzinfo=UTC)
    pay = PaymentRow(
        payment_id=p_id,
        account_id=o.account_id,
        status="ALLOCATED",
        payment_date=pay_date,
        amount=total,
        currency="USD",
        method=str(rng.choice(PAYMENT_METHODS)),
        reference_no=f"REF-{int(rng.integers(100000, 999999))}",
        created_at=pay_created,
    )
    alc = PaymentAllocationRow(
        allocation_id=ids.allocation_id(alc_idx),
        payment_id=p_id,
        invoice_id=inv_id,
        allocated_amount=total,
        allocated_at=pay_created,
        created_at=pay_created,
    )
    return pay, alc


def generate_invoices_and_settlement(
    rng: np.random.Generator,
    faker: Faker,
    orders: list[SalesOrderRow],
    order_lines: list[OrderLineRow],
    accounts: list[AccountRow],
) -> tuple[
    list[InvoiceRow],
    list[InvoiceLineRow],
    list[PaymentRow],
    list[PaymentAllocationRow],
    list[DisputeRow],
]:
    """PURPOSE: Generate invoices, bill lines, remittances, allocations, and disputes.
    INPUT: rng: Generator, faker: Faker, orders, order_lines, accounts
    RETURNS: tuple of (invoices, invoice_lines, payments, allocations, disputes)
    ERRORS: none
    """
    acc_terms = {a.account_id: a.payment_terms_days for a in accounts}
    ol_by_order: dict[str, list[OrderLineRow]] = {}
    for ol in order_lines:
        ol_by_order.setdefault(ol.order_id, []).append(ol)

    invoices: list[InvoiceRow] = []
    inv_lines: list[InvoiceLineRow] = []
    payments: list[PaymentRow] = []
    allocations: list[PaymentAllocationRow] = []
    disputes: list[DisputeRow] = []
    inv_idx, il_idx, pay_idx, alc_idx = 1, 1, 1, 1
    as_of = date(2026, 10, 20)

    for o in orders:
        lines = ol_by_order.get(o.order_id, [])
        inv_date = o.order_date + timedelta(days=int(rng.integers(5, 12)))
        terms = acc_terms.get(o.account_id, 30)
        due = calc_due_date(inv_date, terms)
        inv_id = ids.invoice_id(inv_idx)
        inv_created = datetime.combine(inv_date, datetime.min.time(), tzinfo=UTC)

        b_lines, subtotal, il_idx = build_invoice_lines(lines, inv_id, inv_created, il_idx)
        inv_lines.extend(b_lines)
        tax = round_money(subtotal * Decimal("0.08"))
        total = subtotal + tax
        will_pay = due <= as_of
        paid = total if will_pay else Decimal("0.00")
        bal = calc_balance_amount(total, paid)

        if will_pay:
            pay, alc = _create_settlement(
                rng, o, inv_id, inv_date, due, terms, total, pay_idx, alc_idx
            )
            payments.append(pay)
            allocations.append(alc)
            pay_idx += 1
            alc_idx += 1

        invoices.append(
            InvoiceRow(
                invoice_id=inv_id,
                order_id=o.order_id,
                account_id=o.account_id,
                status="PAID" if will_pay else "ISSUED",
                invoice_date=inv_date,
                due_date=due,
                subtotal=subtotal,
                tax=tax,
                total_amount=total,
                paid_amount=paid,
                balance_amount=bal,
                currency="USD",
                created_at=inv_created,
            )
        )
        inv_idx += 1
    return invoices, inv_lines, payments, allocations, disputes

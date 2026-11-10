"""Deterministic derivation functions for financials, dates, and entity states."""

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal


def round_money(amount: Decimal) -> Decimal:
    """PURPOSE: Quantize decimal amounts to exactly 2 currency decimal places.
    INPUT: amount: Decimal
    RETURNS: Decimal
    ERRORS: none
    """
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calc_line_total(qty: Decimal, unit_price: Decimal, discount_pct: Decimal = Decimal("0.00")) -> Decimal:
    """PURPOSE: Calculate discounted line total from quantity and unit price.
    INPUT: qty: Decimal, unit_price: Decimal, discount_pct: Decimal
    RETURNS: Decimal
    ERRORS: none
    """
    raw = qty * unit_price * (Decimal("1.00") - (discount_pct / Decimal("100.00")))
    return round_money(raw)


def calc_due_date(invoice_date: date, payment_terms_days: int) -> date:
    """PURPOSE: Compute settlement due date based on contractual payment terms.
    INPUT: invoice_date: date, payment_terms_days: int
    RETURNS: date
    ERRORS: none
    """
    return invoice_date + timedelta(days=payment_terms_days)


def calc_balance_amount(total_amount: Decimal, paid_amount: Decimal) -> Decimal:
    """PURPOSE: Calculate remaining invoice balance from total and settled amounts.
    INPUT: total_amount: Decimal, paid_amount: Decimal
    RETURNS: Decimal
    ERRORS: none
    """
    return round_money(total_amount - paid_amount)


def derive_invoice_status(
    total_amount: Decimal,
    paid_amount: Decimal,
    due_date: date,
    as_of: date,
    has_dispute: bool = False,
) -> str:
    """PURPOSE: Derive canonical invoice status from balance, due date, and disputes.
    INPUT: total_amount: Decimal, paid_amount: Decimal, due_date: date, as_of: date, has_dispute: bool
    RETURNS: str ('PAID' | 'DISPUTED' | 'OVERDUE' | 'PARTIALLY_PAID' | 'ISSUED')
    ERRORS: none
    """
    if has_dispute:
        return "DISPUTED"
    if paid_amount >= total_amount:
        return "PAID"
    if paid_amount > Decimal("0.00"):
        return "OVERDUE" if as_of > due_date else "PARTIALLY_PAID"
    return "OVERDUE" if as_of > due_date else "ISSUED"


def derive_order_status(
    total_ordered: Decimal,
    total_shipped: Decimal,
    total_billed: Decimal,
    is_fully_paid: bool,
) -> str:
    """PURPOSE: Derive sales order status based on fulfillment and billing progress.
    INPUT: total_ordered: Decimal, total_shipped: Decimal, total_billed: Decimal, is_fully_paid: bool
    RETURNS: str ('PAID' | 'INVOICED' | 'FULFILLED' | 'PARTIALLY_FULFILLED' | 'CONFIRMED')
    ERRORS: none
    """
    if is_fully_paid and total_billed >= total_ordered:
        return "PAID"
    if total_billed >= total_ordered and total_shipped >= total_ordered:
        return "INVOICED"
    if total_shipped >= total_ordered:
        return "FULFILLED"
    if total_shipped > Decimal("0.00"):
        return "PARTIALLY_FULFILLED"
    return "CONFIRMED"

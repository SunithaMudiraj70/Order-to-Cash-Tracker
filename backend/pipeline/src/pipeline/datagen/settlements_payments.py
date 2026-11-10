"""PURPOSE: Payment row and instalment allocation builders for settled invoices.
INPUT: rng, o, inv_id, inv_date, due, terms, total, pay_idx, alc_idx
RETURNS: PaymentRow and PaymentAllocationRow instances
ERRORS: none
"""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import numpy as np

from pipeline.datagen import ids
from pipeline.datagen.derive import round_money
from pipeline.datagen.models import (
    AccountRow,
    PaymentAllocationRow,
    PaymentRow,
    SalesOrderRow,
)

PAYMENT_METHODS = ["WIRE", "ACH", "CHECK", "CREDIT_CARD"]


def make_payment(
    rng: np.random.Generator, acc_id: str, amt: Decimal, pay_date: date, pay_idx: int, status: str
) -> PaymentRow:
    """PURPOSE: Build a single payment row with deterministic metadata.
    INPUT: rng, acc_id, amt, pay_date, pay_idx, status
    RETURNS: PaymentRow
    ERRORS: none
    """
    ts = datetime.combine(pay_date, datetime.min.time(), tzinfo=UTC)
    return PaymentRow(
        payment_id=ids.payment_id(pay_idx),
        account_id=acc_id,
        status=status,
        payment_date=pay_date,
        amount=amt,
        currency="USD",
        method=str(rng.choice(PAYMENT_METHODS)),
        reference_no=f"REF-{int(rng.integers(100000, 999999))}",
        created_at=ts,
    )


def create_settlement_instalments(
    rng: np.random.Generator,
    o: SalesOrderRow,
    inv_id: str,
    inv_date: date,
    due: date,
    terms: int,
    total: Decimal,
    pay_idx: int,
    alc_idx: int,
) -> tuple[list[PaymentRow], list[PaymentAllocationRow], int, int]:
    """PURPOSE: Generate 2 installment remittances and allocations settling an invoice.
    INPUT: rng, o, inv_id, inv_date, due, terms, total, pay_idx, alc_idx
    RETURNS: tuple[list[PaymentRow], list[PaymentAllocationRow], int, int]
    ERRORS: none
    """
    amt1 = round_money(total * Decimal("0.50"))
    amt2 = total - amt1
    d1 = inv_date + timedelta(days=int(rng.integers(1, max(2, terms // 2))))
    d2 = min(due, d1 + timedelta(days=int(rng.integers(1, max(2, terms // 2)))))
    p1 = make_payment(rng, o.account_id, amt1, d1, pay_idx, "ALLOCATED")
    a1 = PaymentAllocationRow(
        allocation_id=ids.allocation_id(alc_idx),
        payment_id=p1.payment_id,
        invoice_id=inv_id,
        allocated_amount=amt1,
        allocated_at=p1.created_at,
        created_at=p1.created_at,
    )
    p2 = make_payment(rng, o.account_id, amt2, d2, pay_idx + 1, "ALLOCATED")
    a2 = PaymentAllocationRow(
        allocation_id=ids.allocation_id(alc_idx + 1),
        payment_id=p2.payment_id,
        invoice_id=inv_id,
        allocated_amount=amt2,
        allocated_at=p2.created_at,
        created_at=p2.created_at,
    )
    return [p1, p2], [a1, a2], pay_idx + 2, alc_idx + 2


def create_unallocated_batch(
    rng: np.random.Generator, accounts: list[AccountRow], needed: int, as_of: date, start_idx: int
) -> list[PaymentRow]:
    """PURPOSE: Generate unapplied payments across customer accounts to meet volume target.
    INPUT: rng, accounts, needed, as_of, start_idx
    RETURNS: list[PaymentRow]
    ERRORS: none
    """
    payments = []
    for i in range(needed):
        acc = accounts[int(rng.integers(0, len(accounts)))]
        amt = Decimal(int(rng.integers(500, 15000)))
        p_date = as_of - timedelta(days=int(rng.integers(1, 120)))
        payments.append(make_payment(rng, acc.account_id, amt, p_date, start_idx + i, "RECEIVED"))
    return payments

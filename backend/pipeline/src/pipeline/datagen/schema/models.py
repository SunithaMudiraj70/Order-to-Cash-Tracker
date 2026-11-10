"""Pydantic validation schemas matching Postgres table definitions.

TODO (Step 2): Flesh out all schema models for line items, shipments, payments, and events.
"""

from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field


class AccountSchema(BaseModel):
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    name: str
    segment: str
    region: str
    credit_limit: Decimal
    payment_terms_days: int = 30
    status: str = "ACTIVE"


class QuoteSchema(BaseModel):
    quote_id: str = Field(pattern=r"^QTE-2026-\d{6}$")
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    status: str = "DRAFT"
    quote_date: date
    valid_until: date
    total_amount: Decimal
    currency: str = "USD"


class OrderSchema(BaseModel):
    order_id: str = Field(pattern=r"^SO-2026-\d{6}$")
    quote_id: str | None = None
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    status: str = "CREATED"
    order_date: date
    promised_date: date
    total_amount: Decimal
    currency: str = "USD"


class InvoiceSchema(BaseModel):
    invoice_id: str = Field(pattern=r"^INV-2026-\d{6}$")
    order_id: str = Field(pattern=r"^SO-2026-\d{6}$")
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    status: str = "DRAFT"
    invoice_date: date
    due_date: date
    subtotal: Decimal
    tax: Decimal
    total_amount: Decimal
    paid_amount: Decimal = Decimal("0.00")
    balance_amount: Decimal
    currency: str = "USD"
    dup_of_invoice_id: str | None = None


"""Pydantic row models representing core business master and transactional entities."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class AccountRow(BaseModel):
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    name: str
    segment: str
    region: str
    credit_limit: Decimal
    payment_terms_days: int = 30
    status: str = "ACTIVE"
    created_at: datetime
    effective_from: datetime
    effective_to: datetime | None = None


class QuoteRow(BaseModel):
    quote_id: str = Field(pattern=r"^QTE-2026-\d{6}$")
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    status: str
    quote_date: date
    valid_until: date
    total_amount: Decimal
    currency: str = "USD"
    created_at: datetime


class QuoteLineRow(BaseModel):
    quote_line_id: str = Field(pattern=r"^QL-\d{6}$")
    quote_id: str = Field(pattern=r"^QTE-2026-\d{6}$")
    line_no: int
    sku: str
    description: str
    qty: Decimal
    unit_price: Decimal
    discount_pct: Decimal = Decimal("0.00")
    line_total: Decimal
    created_at: datetime


class SalesOrderRow(BaseModel):
    order_id: str = Field(pattern=r"^SO-2026-\d{6}$")
    quote_id: str | None = None
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    status: str
    order_date: date
    promised_date: date
    total_amount: Decimal
    currency: str = "USD"
    created_at: datetime


class OrderLineRow(BaseModel):
    order_line_id: str = Field(pattern=r"^OL-\d{6}$")
    order_id: str = Field(pattern=r"^SO-2026-\d{6}$")
    quote_line_id: str | None = None
    line_no: int
    sku: str
    ordered_qty: Decimal
    unit_price: Decimal
    line_total: Decimal
    created_at: datetime


class ShipmentRow(BaseModel):
    shipment_id: str = Field(pattern=r"^SHP-2026-\d{6}$")
    order_id: str = Field(pattern=r"^SO-2026-\d{6}$")
    status: str
    ship_date: date | None = None
    delivered_date: date | None = None
    carrier: str | None = None
    tracking_number: str | None = None
    created_at: datetime


class ShipmentLineRow(BaseModel):
    shipment_line_id: str = Field(pattern=r"^SL-\d{6}$")
    shipment_id: str = Field(pattern=r"^SHP-2026-\d{6}$")
    order_line_id: str = Field(pattern=r"^OL-\d{6}$")
    shipped_qty: Decimal
    created_at: datetime


class InvoiceRow(BaseModel):
    invoice_id: str = Field(pattern=r"^INV-2026-\d{6}$")
    order_id: str = Field(pattern=r"^SO-2026-\d{6}$")
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    status: str
    invoice_date: date
    due_date: date
    subtotal: Decimal
    tax: Decimal
    total_amount: Decimal
    paid_amount: Decimal = Decimal("0.00")
    balance_amount: Decimal
    currency: str = "USD"
    dup_of_invoice_id: str | None = None
    created_at: datetime


class InvoiceLineRow(BaseModel):
    invoice_line_id: str = Field(pattern=r"^IL-\d{6}$")
    invoice_id: str = Field(pattern=r"^INV-2026-\d{6}$")
    order_line_id: str = Field(pattern=r"^OL-\d{6}$")
    billed_qty: Decimal
    unit_price: Decimal
    line_total: Decimal
    created_at: datetime

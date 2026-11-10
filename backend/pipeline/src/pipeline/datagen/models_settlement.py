"""Pydantic row models representing payments, allocations, disputes, events, and ground truth."""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class PaymentRow(BaseModel):
    payment_id: str = Field(pattern=r"^PAY-2026-\d{6}$")
    account_id: str = Field(pattern=r"^ACC-\d{6}$")
    status: str
    payment_date: date
    amount: Decimal
    currency: str = "USD"
    method: str
    reference_no: str
    created_at: datetime


class PaymentAllocationRow(BaseModel):
    allocation_id: str = Field(pattern=r"^ALC-\d{6}$")
    payment_id: str = Field(pattern=r"^PAY-2026-\d{6}$")
    invoice_id: str = Field(pattern=r"^INV-2026-\d{6}$")
    allocated_amount: Decimal
    allocated_at: datetime
    created_at: datetime


class DisputeRow(BaseModel):
    dispute_id: str = Field(pattern=r"^DSP-2026-\d{6}$")
    invoice_id: str = Field(pattern=r"^INV-2026-\d{6}$")
    status: str
    opened_at: datetime
    resolved_at: datetime | None = None
    disputed_amount: Decimal
    reason_code: str
    credit_amount: Decimal = Decimal("0.00")
    notes: str | None = None
    created_at: datetime


class StatusEventRow(BaseModel):
    event_id: str = Field(pattern=r"^EVT-\d{6,}$")
    entity_type: str
    entity_id: str
    from_status: str | None = None
    to_status: str
    event_ts: datetime
    actor: str = "system"
    source: str = "o2c_service"
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class GroundTruthRow(BaseModel):
    gt_id: str = Field(pattern=r"^GT-\d{6}$")
    entity_type: str
    entity_id: str
    issue_type: str
    expected_decision: str
    injected_rule: str
    notes: str | None = None
    severity: str = "HIGH"
    detected: bool = False
    detected_at: datetime | None = None
    created_at: datetime


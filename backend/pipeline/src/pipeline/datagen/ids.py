"""Immutable ID generators enforcing database schema CHECK patterns."""


def account_id(index: int) -> str:
    """PURPOSE: Generate unique customer account identifier.
    INPUT: index: int (positive sequence number)
    RETURNS: str (e.g. ACC-000001)
    ERRORS: raises ValueError if index < 1
    """
    if index < 1:
        raise ValueError("index must be positive")
    return f"ACC-{index:06d}"


def quote_id(index: int) -> str:
    """PURPOSE: Generate unique quote identifier.
    INPUT: index: int
    RETURNS: str (e.g. QTE-2026-000001)
    ERRORS: raises ValueError if index < 1
    """
    if index < 1:
        raise ValueError("index must be positive")
    return f"QTE-2026-{index:06d}"


def quote_line_id(index: int) -> str:
    """PURPOSE: Generate unique quote line identifier.
    INPUT: index: int
    RETURNS: str (e.g. QL-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"QL-{index:06d}"


def order_id(index: int) -> str:
    """PURPOSE: Generate unique sales order identifier.
    INPUT: index: int
    RETURNS: str (e.g. SO-2026-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"SO-2026-{index:06d}"


def order_line_id(index: int) -> str:
    """PURPOSE: Generate unique sales order line identifier.
    INPUT: index: int
    RETURNS: str (e.g. OL-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"OL-{index:06d}"


def shipment_id(index: int) -> str:
    """PURPOSE: Generate unique shipment identifier.
    INPUT: index: int
    RETURNS: str (e.g. SHP-2026-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"SHP-2026-{index:06d}"


def shipment_line_id(index: int) -> str:
    """PURPOSE: Generate unique shipment line identifier.
    INPUT: index: int
    RETURNS: str (e.g. SL-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"SL-{index:06d}"


def invoice_id(index: int) -> str:
    """PURPOSE: Generate unique invoice identifier.
    INPUT: index: int
    RETURNS: str (e.g. INV-2026-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"INV-2026-{index:06d}"


def invoice_line_id(index: int) -> str:
    """PURPOSE: Generate unique invoice line identifier.
    INPUT: index: int
    RETURNS: str (e.g. IL-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"IL-{index:06d}"


def payment_id(index: int) -> str:
    """PURPOSE: Generate unique payment identifier.
    INPUT: index: int
    RETURNS: str (e.g. PAY-2026-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"PAY-2026-{index:06d}"


def allocation_id(index: int) -> str:
    """PURPOSE: Generate unique payment allocation identifier.
    INPUT: index: int
    RETURNS: str (e.g. ALC-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"ALC-{index:06d}"


def dispute_id(index: int) -> str:
    """PURPOSE: Generate unique customer dispute identifier.
    INPUT: index: int
    RETURNS: str (e.g. DSP-2026-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"DSP-2026-{index:06d}"


def event_id(index: int) -> str:
    """PURPOSE: Generate unique audit event identifier.
    INPUT: index: int
    RETURNS: str (e.g. EVT-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"EVT-{index:06d}"


def gt_id(index: int) -> str:
    """PURPOSE: Generate unique ground-truth anomaly identifier.
    INPUT: index: int
    RETURNS: str (e.g. GT-000001)
    ERRORS: raises ValueError if index < 1
    """
    return f"GT-{index:06d}"

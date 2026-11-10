"""Detector package integration and smoke tests."""

from pipeline.db.connection import get_connection
from pipeline.detector.models import Finding
from pipeline.detector.rules import detect_duplicate_invoice, detect_underbilling


def test_detector_rules_live_execution() -> None:
    """PURPOSE: Execute detector rules against live database operational tables.
    INPUT: none
    RETURNS: None
    ERRORS: raises AssertionError or psycopg2.DatabaseError on failure
    """
    conn = get_connection()
    try:
        dup_findings = detect_duplicate_invoice(conn)
        assert isinstance(dup_findings, list)
        for f in dup_findings:
            assert isinstance(f, Finding)
            assert f.issue_type == "DUPLICATE_INVOICE"
            assert "dup_of" in f.evidence

        und_findings = detect_underbilling(conn)
        assert isinstance(und_findings, list)
        for f in und_findings:
            assert isinstance(f, Finding)
            assert f.issue_type == "UNDERBILLING"
            assert "billed_unit_price" in f.evidence
    finally:
        conn.close()

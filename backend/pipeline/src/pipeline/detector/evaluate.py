"""Evaluation engine comparing detector findings against gt.ground_truth."""

import json
from pathlib import Path

import psycopg2.extras
import typer

from pipeline.db.connection import get_connection
from pipeline.detector.eval_metrics import compute_metrics, print_metrics_table
from pipeline.detector.models import Finding
from pipeline.detector.rules import ALL_RULES

app = typer.Typer(help="Order-to-Cash Anomaly Detector Evaluation CLI")


def execute_all_rules(conn) -> list[Finding]:
    """PURPOSE: Execute all 10 detector rules against operational tables.
    INPUT: conn: connection
    RETURNS: list[Finding]
    ERRORS: raises psycopg2.DatabaseError
    """
    findings: list[Finding] = []
    for fn in ALL_RULES:
        findings.extend(fn(conn))
    return findings


def save_findings_to_db(conn, findings: list[Finding]) -> None:
    """PURPOSE: Insert detector findings into analytics.detector_findings.
    INPUT: conn, findings: list[Finding]
    RETURNS: None
    ERRORS: raises psycopg2.DatabaseError
    """
    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE analytics.detector_findings;")
        if findings:
            rows = [
                (
                    f.finding_id,
                    f.entity_type,
                    f.entity_id,
                    f.issue_type,
                    f.severity,
                    json.dumps(f.evidence),
                    f.detected_at,
                )
                for f in findings
            ]
            sql = """
            INSERT INTO analytics.detector_findings
            (finding_id, entity_type, entity_id, issue_type, severity, evidence, detected_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
            """
            psycopg2.extras.execute_batch(cur, sql, rows)
    conn.commit()


@app.command()
def run() -> None:
    """PURPOSE: Run detection rules and persist findings to database.
    INPUT: none
    RETURNS: None
    ERRORS: raises SystemExit on failure
    """
    conn = get_connection()
    try:
        typer.echo("--> Running anomaly detection rules...")
        findings = execute_all_rules(conn)
        save_findings_to_db(conn, findings)
        typer.echo(f"--> Saved {len(findings)} findings into analytics.detector_findings.")
    finally:
        conn.close()


@app.command()
def evaluate() -> None:
    """PURPOSE: Run detector rules and evaluate benchmark scores against gt.ground_truth.
    INPUT: none
    RETURNS: None
    ERRORS: raises SystemExit on failure
    """
    conn = get_connection()
    try:
        findings = execute_all_rules(conn)
        save_findings_to_db(conn, findings)
        with conn.cursor() as cur:
            cur.execute("SELECT entity_type, entity_id, issue_type FROM gt.ground_truth;")
            gt_rows = cur.fetchall()
        metrics = compute_metrics(findings, gt_rows)
        eval_path = Path("data/manifests/detector_eval.json")
        eval_path.parent.mkdir(parents=True, exist_ok=True)
        with open(eval_path, "w", encoding="utf-8") as f:
            json.dump([m.model_dump() for m in metrics], f, indent=2)
        print_metrics_table(metrics)
        typer.echo(f"--> Evaluation metrics saved to {eval_path}\n")
    finally:
        conn.close()


if __name__ == "__main__":
    app()

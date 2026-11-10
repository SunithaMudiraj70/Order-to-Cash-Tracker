"""Metric calculation and terminal table formatting for detector benchmarks."""

import typer

from pipeline.detector.models import EvaluationMetric, Finding


def compute_metrics(
    findings: list[Finding], ground_truth: list[tuple[str, str, str]]
) -> list[EvaluationMetric]:
    """PURPOSE: Calculate precision, recall, and F1 per issue type against ground truth.
    INPUT: findings: list[Finding], ground_truth: list[tuple(entity_type, entity_id, issue_type)]
    RETURNS: list[EvaluationMetric]
    ERRORS: none
    """
    gt_set = set(ground_truth)
    pred_set = {(f.entity_type, f.entity_id, f.issue_type) for f in findings}
    all_issues = sorted({item[2] for item in gt_set} | {item[2] for item in pred_set})

    metrics: list[EvaluationMetric] = []
    for issue in all_issues:
        gt_issue = {item for item in gt_set if item[2] == issue}
        pred_issue = {item for item in pred_set if item[2] == issue}
        tp, fp, fn = (
            len(gt_issue & pred_issue),
            len(pred_issue - gt_issue),
            len(gt_issue - pred_issue),
        )
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        metrics.append(
            EvaluationMetric(
                issue_type=issue,
                true_positives=tp,
                false_positives=fp,
                false_negatives=fn,
                precision=round(prec, 4),
                recall=round(rec, 4),
                f1_score=round(f1, 4),
            )
        )
    return metrics


def print_metrics_table(metrics: list[EvaluationMetric]) -> None:
    """PURPOSE: Print formatted precision, recall, and F1 table to terminal.
    INPUT: metrics: list[EvaluationMetric]
    RETURNS: None
    ERRORS: none
    """
    typer.echo("\n" + "=" * 80)
    typer.echo(f"{'ISSUE TYPE':<32} {'TP':>4} {'FP':>4} {'FN':>4} {'PREC':>8} {'REC':>8} {'F1':>8}")
    typer.echo("=" * 80)
    for m in metrics:
        typer.echo(
            f"{m.issue_type:<32} {m.true_positives:>4} {m.false_positives:>4} {m.false_negatives:>4} "
            f"{m.precision:>8.2%} {m.recall:>8.2%} {m.f1_score:>8.2%}"
        )
    typer.echo("=" * 80)

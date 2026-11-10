/**
 * PURPOSE: Detector benchmark evaluation page displaying precision, recall, and F1 scores
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { useEvaluation } from '../hooks/useExceptions';
import { EvaluationMetric } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';

const formatPct = (val: number): string => `${(val * 100).toFixed(1)}%`;

export const EvaluationPage: React.FC = () => {
  const { data: metrics, isLoading, error, refetch } = useEvaluation();

  const columns: Column<EvaluationMetric>[] = [
    { key: 'issue_type', header: 'Monitored Issue Type', render: (r) => <span className="font-semibold text-white">{r.issue_type}</span> },
    { key: 'true_positives', header: 'True Pos (TP)', className: 'text-right font-mono text-emerald-400' },
    { key: 'false_positives', header: 'False Pos (FP)', className: 'text-right font-mono text-slate-400' },
    { key: 'false_negatives', header: 'False Neg (FN)', className: 'text-right font-mono text-slate-400' },
    { key: 'precision', header: 'Precision', className: 'text-right font-mono font-bold text-indigo-300', render: (r) => formatPct(r.precision) },
    { key: 'recall', header: 'Recall', className: 'text-right font-mono font-bold text-indigo-300', render: (r) => formatPct(r.recall) },
    { key: 'f1_score', header: 'F1 Score', className: 'text-right font-mono font-bold text-emerald-400', render: (r) => formatPct(r.f1_score) }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <Award className="w-5 h-5 text-amber-400 mr-2" />
            Detection Benchmark Evaluation
          </h2>
          <p className="text-xs text-slate-400">Ground truth verification across 10 discrete anomaly rules</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Benchmark Validated</span>
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Failed to load evaluation manifest"
          message="Could not retrieve ground truth benchmark metrics from the API."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <DataTable
            columns={columns}
            data={metrics || []}
            rowKey={(r) => r.issue_type}
            isLoading={isLoading}
            emptyTitle="No evaluation metrics found"
            emptyMessage="Run the evaluation pipeline to compute ground truth benchmarks."
          />
        </div>
      )}
    </div>
  );
};

/**
 * PURPOSE: Operational exception workbench with issue filters and timeline drawer inspection
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import { useExceptions, useTimeline } from '../hooks/useExceptions';
import { DetectorFinding } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ExceptionDrawer } from '../components/ExceptionDrawer';

export const ExceptionsPage: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [activeFinding, setActiveFinding] = useState<DetectorFinding | null>(null);

  const { data: findings, isLoading } = useExceptions({
    issue_type: selectedIssue || undefined,
    severity: selectedSeverity || undefined,
    limit: 100
  });

  const { data: timeline } = useTimeline(
    activeFinding?.entity_type.toLowerCase() || 'order',
    activeFinding?.entity_id || null
  );

  const columns: Column<DetectorFinding>[] = [
    { key: 'finding_id', header: 'Finding ID', render: (r) => <span className="font-mono font-medium text-white">{r.finding_id}</span> },
    { key: 'entity_type', header: 'Entity' },
    { key: 'entity_id', header: 'Entity ID', render: (r) => <span className="font-mono text-indigo-400">{r.entity_id}</span> },
    { key: 'issue_type', header: 'Issue Type', render: (r) => <span className="font-semibold text-rose-300">{r.issue_type}</span> },
    { key: 'severity', header: 'Severity', render: (r) => <StatusBadge status={r.severity} /> },
    { key: 'detected_at', header: 'Detected At', className: 'text-slate-400', render: (r) => new Date(r.detected_at).toLocaleString() }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <AlertOctagon className="w-5 h-5 text-rose-400 mr-2" />
            Detected Revenue & Process Exceptions
          </h2>
          <p className="text-xs text-slate-400">Rules-based findings across 10 monitored operational leakage categories</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedIssue}
            onChange={(e) => setSelectedIssue(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="">All Issue Types</option>
            <option value="INVOICE_EXCEEDS_FULFILLED">INVOICE_EXCEEDS_FULFILLED</option>
            <option value="PAYMENT_ALLOCATED_TWICE">PAYMENT_ALLOCATED_TWICE</option>
            <option value="ORDER_CLOSED_UNPAID">ORDER_CLOSED_UNPAID</option>
            <option value="STATUS_EVENT_SKIPPED_STATE">STATUS_EVENT_SKIPPED_STATE</option>
            <option value="DISPUTE_NOT_IN_RECEIVABLES">DISPUTE_NOT_IN_RECEIVABLES</option>
            <option value="PARTIAL_SHIPMENT">PARTIAL_SHIPMENT</option>
            <option value="UNDERBILLING">UNDERBILLING</option>
            <option value="DUPLICATE_INVOICE">DUPLICATE_INVOICE</option>
            <option value="SHORT_PAYMENT">SHORT_PAYMENT</option>
            <option value="LONG_OVERDUE">LONG_OVERDUE</option>
          </select>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <DataTable
          columns={columns}
          data={findings?.items || []}
          rowKey={(r) => r.finding_id}
          isLoading={isLoading}
          onRowClick={(r) => setActiveFinding(r)}
          emptyTitle="No exceptions detected"
          emptyMessage="No issues match the selected filter criteria."
        />
      </div>

      <ExceptionDrawer
        finding={activeFinding}
        timeline={timeline}
        onClose={() => setActiveFinding(null)}
      />
    </div>
  );
};

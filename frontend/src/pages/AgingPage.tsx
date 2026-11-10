/**
 * PURPOSE: Accounts Receivable aging analysis with segment stacked bar chart and account drilldown
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useAging } from '../hooks/useAnalytics';
import { useUiStore } from '../store/uiStore';
import { ChartCard } from '../components/ChartCard';
import { DataTable, Column } from '../components/DataTable';
import { ArAgingItem } from '../types';

export const AgingPage: React.FC = () => {
  const { cutoffDate, setCutoffDate } = useUiStore();
  const { data: aging, isLoading } = useAging(cutoffDate);
  const [filterSegment, setFilterSegment] = useState<string>('ALL');

  const filteredItems = (aging || []).filter((item) =>
    filterSegment === 'ALL' ? true : item.segment === filterSegment
  );

  const segmentGroups = (aging || []).reduce<Record<string, { segment: string; Current: number; '1-30d': number; '31-60d': number; '61-90d': number; '91+d': number }>>((acc, cur) => {
    if (!acc[cur.segment]) {
      acc[cur.segment] = { segment: cur.segment, Current: 0, '1-30d': 0, '31-60d': 0, '61-90d': 0, '91+d': 0 };
    }
    acc[cur.segment].Current += Number(cur.current_balance);
    acc[cur.segment]['1-30d'] += Number(cur.bucket_1_30_days);
    acc[cur.segment]['31-60d'] += Number(cur.bucket_31_60_days);
    acc[cur.segment]['61-90d'] += Number(cur.bucket_61_90_days);
    acc[cur.segment]['91+d'] += Number(cur.bucket_91_plus_days);
    return acc;
  }, {});

  const chartData = Object.values(segmentGroups);

  const columns: Column<ArAgingItem>[] = [
    { key: 'account_name', header: 'Account', render: (r) => <span className="font-medium text-white">{r.account_name}</span> },
    { key: 'segment', header: 'Segment' },
    { key: 'total_invoices', header: 'Invoices', className: 'text-right font-mono' },
    { key: 'current_balance', header: 'Current', className: 'text-right font-mono text-emerald-400', render: (r) => `$${Number(r.current_balance).toLocaleString()}` },
    { key: 'bucket_1_30_days', header: '1-30d', className: 'text-right font-mono', render: (r) => `$${Number(r.bucket_1_30_days).toLocaleString()}` },
    { key: 'bucket_31_60_days', header: '31-60d', className: 'text-right font-mono', render: (r) => `$${Number(r.bucket_31_60_days).toLocaleString()}` },
    { key: 'bucket_91_plus_days', header: '91+d', className: 'text-right font-mono text-rose-400', render: (r) => `$${Number(r.bucket_91_plus_days).toLocaleString()}` },
    { key: 'total_outstanding_balance', header: 'Total Outstanding', className: 'text-right font-mono font-semibold text-white', render: (r) => `$${Number(r.total_outstanding_balance).toLocaleString()}` }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white">Accounts Receivable Aging</h2>
          <p className="text-xs text-slate-400">Aging buckets calculated relative to benchmark cutoff date</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={cutoffDate}
            onChange={(e) => setCutoffDate(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg focus:outline-none"
          />
          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Segments</option>
            <option value="ENTERPRISE">Enterprise</option>
            <option value="MID_MARKET">Mid Market</option>
            <option value="SMB">SMB</option>
          </select>
        </div>
      </div>

      <ChartCard title="Aging Buckets by Segment" subtitle="Stacked outstanding balances grouped by customer classification tier">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="segment" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Current" stackId="a" fill="#10b981" />
              <Bar dataKey="1-30d" stackId="a" fill="#3b82f6" />
              <Bar dataKey="31-60d" stackId="a" fill="#f59e0b" />
              <Bar dataKey="61-90d" stackId="a" fill="#f97316" />
              <Bar dataKey="91+d" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Account Receivables Drilldown</h3>
        <DataTable
          columns={columns}
          data={filteredItems.slice(0, 15)}
          rowKey={(r) => r.account_id}
          isLoading={isLoading}
          emptyTitle="No aging records found"
          emptyMessage="No accounts match the selected segment or cutoff date."
        />
      </div>
    </div>
  );
};

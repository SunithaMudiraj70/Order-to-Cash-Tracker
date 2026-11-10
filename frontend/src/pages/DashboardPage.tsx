/**
 * PURPOSE: Executive dashboard displaying KPI summary cards, aging distribution, and latest exceptions
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';
import { DollarSign, Clock, AlertTriangle, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useSummary, useAging } from '../hooks/useAnalytics';
import { useExceptions } from '../hooks/useExceptions';
import { useUiStore } from '../store/uiStore';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { cutoffDate } = useUiStore();
  const { data: summary, isLoading: isSummaryLoading } = useSummary();
  const { data: aging } = useAging(cutoffDate);
  const { data: exceptions } = useExceptions({ limit: 5 });

  const kpis = [
    { label: 'Revenue Leakage', val: summary ? `$${summary.total_leakage_amount.toLocaleString()}` : '$0', icon: DollarSign, color: 'text-rose-400 bg-rose-950/40 border-rose-800' },
    { label: 'Overdue Balance', val: summary ? `$${summary.total_overdue_balance.toLocaleString()}` : '$0', icon: Clock, color: 'text-amber-400 bg-amber-950/40 border-amber-800' },
    { label: 'Avg Cycle Time', val: summary ? `${summary.avg_cycle_time_days} days` : '0 days', icon: Activity, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800' },
    { label: 'Active Exceptions', val: summary ? String(summary.total_exception_count) : '0', icon: AlertTriangle, color: 'text-purple-400 bg-purple-950/40 border-purple-800' }
  ];

  const chartData = (aging || []).slice(0, 7).map((item) => ({
    name: item.account_name.split(' ')[0],
    Current: Number(item.current_balance),
    Overdue: Number(item.total_outstanding_balance) - Number(item.current_balance)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.val}
            icon={k.icon}
            color={k.color}
            isLoading={isSummaryLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Top Outstanding Balances" subtitle="Breakdown of current vs overdue balances across accounts">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="Current" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Overdue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Recent Exceptions" subtitle="Latest detected revenue leakage and anomalies">
          <div className="space-y-3">
            {(exceptions?.items || []).slice(0, 4).map((f) => (
              <div key={f.finding_id} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-300 truncate">{f.issue_type}</span>
                  <StatusBadge status={f.severity} />
                </div>
                <div className="mt-1 text-[11px] text-slate-400 flex justify-between">
                  <span>{f.entity_id}</span>
                  <span>{new Date(f.detected_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

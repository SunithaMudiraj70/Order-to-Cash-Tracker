/**
 * PURPOSE: Process cycle time bottlenecks and stage duration breakdown across fulfillment milestones
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useDelays } from '../hooks/useAnalytics';
import { ProcessDelayItem } from '../types';
import { ChartCard } from '../components/ChartCard';
import { DataTable, Column } from '../components/DataTable';

export const DelaysPage: React.FC = () => {
  const { data: delays, isLoading } = useDelays();
  const [delayedOnly, setDelayedOnly] = useState(false);

  const filtered = (delays || []).filter((d) =>
    delayedOnly ? d.is_fulfillment_delayed || d.is_billing_delayed || d.is_delivery_sla_breached : true
  );

  const chartData = filtered.slice(0, 15).map((d) => ({
    order: d.order_id,
    'Quote→Order': Number(d.quote_to_order_days) || 0,
    'Order→Ship': Number(d.order_to_ship_days) || 0,
    'Ship→Invoice': Number(d.ship_to_invoice_days) || 0,
    'Invoice→Pay': Number(d.invoice_to_pay_days) || 0
  }));

  const columns: Column<ProcessDelayItem>[] = [
    { key: 'order_id', header: 'Order ID', render: (r) => <span className="font-mono font-medium text-white">{r.order_id}</span> },
    { key: 'quote_to_order_days', header: 'Qte→Ord', className: 'text-right font-mono', render: (r) => `${r.quote_to_order_days}d` },
    { key: 'order_to_ship_days', header: 'Ord→Shp', className: 'text-right font-mono', render: (r) => `${r.order_to_ship_days}d` },
    { key: 'ship_to_invoice_days', header: 'Shp→Inv', className: 'text-right font-mono', render: (r) => `${r.ship_to_invoice_days}d` },
    { key: 'invoice_to_pay_days', header: 'Inv→Pay', className: 'text-right font-mono', render: (r) => `${r.invoice_to_pay_days ?? '-'}d` },
    { key: 'total_cycle_days', header: 'Total Days', className: 'text-right font-mono font-bold text-indigo-300', render: (r) => `${r.total_cycle_days}d` },
    {
      key: 'indicators',
      header: 'Breach Indicators',
      render: (r) => (
        <div className="flex gap-1">
          {r.is_delivery_sla_breached && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono">SLA_BREACH</span>}
          {r.is_fulfillment_delayed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">FULFILL_DELAY</span>}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white">Process Delay & Bottleneck Analysis</h2>
          <p className="text-xs text-slate-400">Stage duration across Quote, Order, Fulfillment, Billing, and Settlement</p>
        </div>
        <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <input
            type="checkbox"
            checked={delayedOnly}
            onChange={(e) => setDelayedOnly(e.target.checked)}
            className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
          />
          <span>Delayed Stages Only</span>
        </label>
      </div>

      <ChartCard title="Stage Durations per Order (Days)" subtitle="Lead time and processing bottlenecks across transaction stages">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="order" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={11} label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Quote→Order" stackId="s" fill="#818cf8" />
              <Bar dataKey="Order→Ship" stackId="s" fill="#38bdf8" />
              <Bar dataKey="Ship→Invoice" stackId="s" fill="#fbbf24" />
              <Bar dataKey="Invoice→Pay" stackId="s" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Order Processing Milestones</h3>
        <DataTable
          columns={columns}
          data={filtered.slice(0, 20)}
          rowKey={(r) => r.order_id}
          isLoading={isLoading}
          emptyTitle="No delayed orders"
          emptyMessage="No orders match the current delay filter criteria."
        />
      </div>
    </div>
  );
};

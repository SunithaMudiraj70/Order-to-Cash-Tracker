/**
 * PURPOSE: Order-level revenue leakage exploration with discrepancy waterfall inspection drawer
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLeakage } from '../hooks/useAnalytics';
import { RevenueLeakageItem } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';

const formatMoney = (n: number): string => `$${Number(n).toLocaleString()}`;

export const LeakagePage: React.FC = () => {
  const { data: leakage, isLoading } = useLeakage();
  const [selectedOrder, setSelectedOrder] = useState<RevenueLeakageItem | null>(null);

  const columns: Column<RevenueLeakageItem>[] = [
    { key: 'order_id', header: 'Order ID', render: (r) => <span className="font-mono font-medium text-indigo-400">{r.order_id}</span> },
    { key: 'order_status', header: 'Status', render: (r) => <StatusBadge status={r.order_status} /> },
    { key: 'total_ordered_amount', header: 'Ordered', className: 'text-right font-mono', render: (r) => formatMoney(r.total_ordered_amount) },
    { key: 'total_fulfilled_amount', header: 'Fulfilled', className: 'text-right font-mono', render: (r) => formatMoney(r.total_fulfilled_amount) },
    { key: 'total_billed_amount', header: 'Billed', className: 'text-right font-mono', render: (r) => formatMoney(r.total_billed_amount) },
    { key: 'total_paid_amount', header: 'Paid', className: 'text-right font-mono text-emerald-400', render: (r) => formatMoney(r.total_paid_amount) },
    { key: 'net_leakage', header: 'Net Leakage', className: 'text-right font-mono font-bold text-rose-400', render: (r) => formatMoney(r.net_leakage) },
    {
      key: 'flags',
      header: 'Flags',
      render: (r) => (
        <div className="flex gap-1">
          {Number(r.underbilled_amount) > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono">UNDERBILLED</span>}
          {Number(r.unpaid_closed_leakage) > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">CLOSED_UNPAID</span>}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <h2 className="text-lg font-bold text-white">Revenue Leakage Tracking</h2>
        <p className="text-xs text-slate-400">Underbilling, overbilling uncollected, and closed unpaid orders</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <DataTable
          columns={columns}
          data={(leakage || []).slice(0, 25)}
          rowKey={(r) => r.order_id}
          isLoading={isLoading}
          onRowClick={(r) => setSelectedOrder(r)}
          emptyTitle="No revenue leakage found"
          emptyMessage="No orders have identified leakage discrepancies."
        />
      </div>

      {selectedOrder && (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 p-6 shadow-2xl z-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center">
                <AlertTriangle className="w-4 h-4 text-rose-400 mr-2" />
                Discrepancy Waterfall
              </h3>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="text-xs text-slate-400 font-mono">{selectedOrder.order_id} (Account: {selectedOrder.account_id})</div>
              <div className="p-3 rounded-lg bg-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between"><span>Contract Ordered:</span><span className="font-mono">{formatMoney(selectedOrder.total_ordered_amount)}</span></div>
                <div className="flex justify-between"><span>Physical Fulfilled:</span><span className="font-mono">{formatMoney(selectedOrder.total_fulfilled_amount)}</span></div>
                <div className="flex justify-between"><span>Invoiced Total:</span><span className="font-mono">{formatMoney(selectedOrder.total_billed_amount)}</span></div>
                <div className="flex justify-between"><span>Settled Payment:</span><span className="font-mono text-emerald-400">{formatMoney(selectedOrder.total_paid_amount)}</span></div>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs space-y-1">
                <div className="font-semibold text-rose-300">Identified Net Leakage:</div>
                <div className="text-xl font-bold text-rose-400 font-mono">{formatMoney(selectedOrder.net_leakage)}</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition"
          >
            Close Inspector
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * PURPOSE: Generic operational data browser with quote conversion capabilities
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightCircle, Check } from 'lucide-react';
import { apiRequest } from '../services/apiClient';
import { DataTable, Column } from '../components/DataTable';
import { useSessionStore } from '../store/sessionStore';

const ENTITIES = ['account', 'quote', 'order', 'shipment', 'invoice', 'payment', 'dispute', 'status_event'];

export const RecordsPage: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState('quote');
  const [convertMsg, setConvertMsg] = useState<string | null>(null);
  const { profile } = useSessionStore();
  const queryClient = useQueryClient();
  const canConvert = ['sales_ops', 'admin'].includes(profile?.role || '');

  const { data, isLoading } = useQuery<{ items: Record<string, unknown>[]; next_cursor: string | null }>({
    queryKey: ['records', selectedEntity],
    queryFn: () => apiRequest(`/records/${selectedEntity}?limit=25`)
  });

  const convertMutation = useMutation({
    mutationFn: (quoteId: string) =>
      apiRequest(`/quotes/${quoteId}/convert`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: (_data, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['records', 'quote'] });
      setConvertMsg(`Quote ${quoteId} converted to Sales Order`);
      setTimeout(() => setConvertMsg(null), 3000);
    },
    onError: (err: unknown) => {
      setConvertMsg(err instanceof Error ? err.message : 'Conversion failed');
      setTimeout(() => setConvertMsg(null), 4000);
    }
  });

  const items = data?.items || [];
  const fieldKeys = items.length > 0 ? Object.keys(items[0]).slice(0, 6) : [];

  const columns: Column<Record<string, unknown>>[] = fieldKeys.map((col) => ({
    key: col,
    header: col.replace(/_/g, ' '),
    className: 'font-mono text-[11px] truncate max-w-[180px]',
    render: (r) => (typeof r[col] === 'object' ? JSON.stringify(r[col]) : String(r[col] ?? '-'))
  }));

  if (selectedEntity === 'quote' && canConvert) {
    columns.push({
      key: 'action',
      header: 'Action',
      render: (r) => (
        <button
          type="button"
          onClick={() => convertMutation.mutate(String(r.quote_id))}
          disabled={convertMutation.isPending}
          className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-200 hover:text-white rounded text-[10px] font-medium transition flex items-center gap-1"
        >
          <ArrowRightCircle className="w-3 h-3" />
          Convert
        </button>
      )
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white">Operational Records Explorer</h2>
          <p className="text-xs text-slate-400">Read-only interface with role-level account scoping</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ENTITIES.map((ent) => (
            <button
              key={ent}
              type="button"
              onClick={() => setSelectedEntity(ent)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition uppercase ${
                selectedEntity === ent
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {ent}
            </button>
          ))}
        </div>
      </div>

      {convertMsg && (
        <div className="p-3 bg-indigo-950/70 border border-indigo-700/60 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{convertMsg}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <DataTable
          columns={columns}
          data={items}
          rowKey={(r) => String(r.id || r[`${selectedEntity}_id`] || Math.random())}
          isLoading={isLoading}
          emptyTitle={`No ${selectedEntity} records`}
          emptyMessage={`No operational records found for entity ${selectedEntity}.`}
        />
      </div>
    </div>
  );
};

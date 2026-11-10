/**
 * PURPOSE: Generic operational data browser supporting all core O2C entities
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/apiClient';
import { DataTable, Column } from '../components/DataTable';

const ENTITIES = ['account', 'quote', 'order', 'shipment', 'invoice', 'payment', 'dispute', 'status_event'];

export const RecordsPage: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState('quote');

  const { data, isLoading } = useQuery<{ items: Record<string, unknown>[]; next_cursor: string | null }>({
    queryKey: ['records', selectedEntity],
    queryFn: () => apiRequest(`/records/${selectedEntity}?limit=25`)
  });

  const items = data?.items || [];
  const fieldKeys = items.length > 0 ? Object.keys(items[0]).slice(0, 6) : [];

  const columns: Column<Record<string, unknown>>[] = fieldKeys.map((col) => ({
    key: col,
    header: col.replace(/_/g, ' '),
    className: 'font-mono text-[11px] truncate max-w-[200px]',
    render: (r) => (typeof r[col] === 'object' ? JSON.stringify(r[col]) : String(r[col] ?? '-'))
  }));

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

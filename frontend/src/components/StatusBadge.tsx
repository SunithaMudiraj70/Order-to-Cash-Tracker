/**
 * PURPOSE: Reusable status and severity pill badge with semantic coloring
 * INPUT: status: string, variant?: 'status' | 'severity'
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const COLOR_MAP: Record<string, string> = {
  PAID: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
  DELIVERED: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
  FULFILLED: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
  CONFIRMED: 'bg-blue-950/60 text-blue-300 border-blue-800',
  ISSUED: 'bg-blue-950/60 text-blue-300 border-blue-800',
  PARTIALLY_PAID: 'bg-amber-950/60 text-amber-300 border-amber-800',
  OVERDUE: 'bg-rose-950/60 text-rose-300 border-rose-800',
  CLOSED: 'bg-slate-800 text-slate-300 border-slate-700',
  CRITICAL: 'bg-rose-950 text-rose-200 border-rose-800',
  HIGH: 'bg-orange-950/70 text-orange-300 border-orange-800',
  MEDIUM: 'bg-amber-950/70 text-amber-300 border-amber-800',
  LOW: 'bg-slate-800 text-slate-300 border-slate-700'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();
  const colorClass = COLOR_MAP[normalized] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${colorClass}`}>
      {status}
    </span>
  );
};

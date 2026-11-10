/**
 * PURPOSE: Standardized executive KPI summary card component
 * INPUT: label: string, value: string | number, icon: LucideIcon, color: string, isLoading?: boolean
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  isLoading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  isLoading
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <div className={`p-2 rounded-lg border ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold text-white tracking-tight">
        {isLoading ? '...' : value}
      </div>
    </div>
  );
};


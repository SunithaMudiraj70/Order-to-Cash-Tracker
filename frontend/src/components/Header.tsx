/**
 * PURPOSE: Global top bar displaying active role, cutoff picker, and user session controls
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';
import { Menu, LogOut, Calendar } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { useUiStore } from '../store/uiStore';

export const Header: React.FC = () => {
  const { profile, logout } = useSessionStore();
  const { toggleSidebar, cutoffDate, setCutoffDate } = useUiStore();

  const roleColors: Record<string, string> = {
    analyst: 'bg-purple-900/40 text-purple-300 border-purple-700',
    admin: 'bg-red-900/40 text-red-300 border-red-700',
    sales_ops: 'bg-blue-900/40 text-blue-300 border-blue-700',
    support_agent: 'bg-amber-900/40 text-amber-300 border-amber-700',
    customer: 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 z-10">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Cutoff:</span>
          <input
            type="date"
            value={cutoffDate}
            onChange={(e) => setCutoffDate(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {profile && (
          <div className="flex items-center space-x-2">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                roleColors[profile.role] || 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {profile.role.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-300 hidden md:inline truncate max-w-[140px]">
              {profile.email}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

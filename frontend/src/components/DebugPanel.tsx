/**
 * PURPOSE: Developer debugging drawer displaying session state, API call logs, query cache, and UI filters
 * INPUT: none (reads Zustand stores and TanStack Query cache)
 * RETURNS: JSX.Element | null (dev only)
 * ERRORS: none
 */

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Terminal, X, Shield, Clock, Database, Layers } from 'lucide-react';
import { useDebugStore } from '../store/debugStore';
import { useSessionStore } from '../store/sessionStore';
import { useUiStore } from '../store/uiStore';

export const DebugPanel: React.FC = () => {
  const { isOpen, logs, toggleOpen, clearLogs } = useDebugStore();
  const { profile, isAuthenticated } = useSessionStore();
  const { cutoffDate, selectedEntityId, selectedFindingId } = useUiStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        toggleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleOpen]);

  if (!import.meta.env.DEV) return null;

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        title="Toggle Debugger (Ctrl+Shift+D)"
        className="fixed bottom-4 right-4 z-50 p-2.5 bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-400 rounded-full shadow-lg transition"
      >
        <Terminal className="w-4 h-4" />
      </button>
    );
  }

  const queries = queryClient.getQueryCache().getAll().slice(0, 10);

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-slate-950/95 border-l border-slate-800 p-5 shadow-2xl z-50 flex flex-col justify-between backdrop-blur text-xs text-slate-300 font-mono">
      <div className="overflow-y-auto space-y-4 pr-1">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Developer Toolkit (Ctrl+Shift+D)</span>
          </div>
          <button onClick={toggleOpen} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Session State
          </div>
          <div>Status: <span className={isAuthenticated ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS'}</span></div>
          <div>Role: <span className="text-amber-300 font-semibold">{profile?.role || 'none'}</span></div>
          <div>User: <span className="text-slate-400">{profile?.email || 'none'}</span></div>
          <div>Account: <span className="text-slate-400">{profile?.account_id || 'unscoped'}</span></div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> UI Store Filters
          </div>
          <div>Cutoff Date: <span className="text-white">{cutoffDate}</span></div>
          <div>Selected Entity: <span className="text-slate-400">{selectedEntityId || 'null'}</span></div>
          <div>Selected Finding: <span className="text-slate-400">{selectedFindingId || 'null'}</span></div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between font-semibold text-emerald-300">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Recent API Calls ({logs.length})</span>
            <button onClick={clearLogs} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-1.5 bg-slate-950/70 rounded border border-slate-800 text-[11px] flex justify-between items-center">
                <div className="truncate max-w-[280px]">
                  <span className="font-bold text-slate-400 mr-1.5">{log.method}</span>
                  <span className="text-slate-200">{log.endpoint}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{log.durationMs}ms</span>
                  <span className={`px-1 rounded text-[10px] font-bold ${log.status === 200 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="text-slate-500 italic">No API requests recorded yet.</div>}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="font-semibold text-purple-300 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> Query Cache ({queries.length})
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {queries.map((q) => (
              <div key={q.queryHash} className="p-1.5 bg-slate-950/70 rounded border border-slate-800 text-[10px] flex justify-between">
                <span className="truncate max-w-[260px] text-slate-300">{JSON.stringify(q.queryKey)}</span>
                <span className="text-indigo-400">{q.state.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

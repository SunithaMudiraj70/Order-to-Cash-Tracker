/**
 * PURPOSE: Zustand store recording recent API calls and toggling debug panel
 * INPUT: API call metadata
 * RETURNS: Zustand debug state and actions
 * ERRORS: none
 */

import { create } from 'zustand';

export interface ApiCallLog {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  ok: boolean;
  code?: string;
  hint?: string;
  requestId?: string;
  timestamp: string;
}

interface DebugState {
  isOpen: boolean;
  logs: ApiCallLog[];
  toggleOpen: () => void;
  recordCall: (log: Omit<ApiCallLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  isOpen: false,
  logs: [],
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  recordCall: (call) =>
    set((state) => {
      const newEntry: ApiCallLog = {
        ...call,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString()
      };
      return { logs: [newEntry, ...state.logs].slice(0, 20) };
    }),
  clearLogs: () => set({ logs: [] })
}));


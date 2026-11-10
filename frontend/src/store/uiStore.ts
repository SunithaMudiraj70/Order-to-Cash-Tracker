/**
 * PURPOSE: Zustand store managing client-side UI states (cutoff date, filters, sidebar toggle)
 * INPUT: UI interaction updates
 * RETURNS: Zustand UI store hook
 * ERRORS: none
 */

import { create } from 'zustand';

interface UiState {
  cutoffDate: string;
  isSidebarCollapsed: boolean;
  selectedEntityId: string | null;
  selectedFindingId: string | null;
  setCutoffDate: (date: string) => void;
  toggleSidebar: () => void;
  setSelectedEntityId: (id: string | null) => void;
  setSelectedFindingId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  cutoffDate: '2026-10-22',
  isSidebarCollapsed: false,
  selectedEntityId: null,
  selectedFindingId: null,

  setCutoffDate: (cutoffDate: string) => set({ cutoffDate }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSelectedEntityId: (selectedEntityId: string | null) => set({ selectedEntityId }),
  setSelectedFindingId: (selectedFindingId: string | null) => set({ selectedFindingId })
}));

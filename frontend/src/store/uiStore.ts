// ==============================================================================
// Store: Zustand UI Store (Filters, Navigation, Layout)
// ==============================================================================

import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  selectedSegment: string | null;
  selectedTimeRange: string;
  toggleSidebar: () => void;
  setSelectedSegment: (segment: string | null) => void;
  setSelectedTimeRange: (range: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  selectedSegment: null,
  selectedTimeRange: '30d',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedSegment: (segment) => set({ selectedSegment: segment }),
  setSelectedTimeRange: (selectedTimeRange) => set({ selectedTimeRange })
}));


// ==============================================================================
// Service: API Client Service Layer
// TODO (Step 4): Implement analytical metrics fetchers
// ==============================================================================

import { fetchApi } from '../lib/api';

export const analyticsApi = {
  getArAging: () => fetchApi('/api/v1/analytics/ar-aging'),
  getLeakage: () => fetchApi('/api/v1/analytics/revenue-leakage'),
  getCycleTimes: () => fetchApi('/api/v1/analytics/cycle-times')
};


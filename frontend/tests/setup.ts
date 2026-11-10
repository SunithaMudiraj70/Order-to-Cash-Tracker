/**
 * PURPOSE: Test environment polyfills and component mocks for JSDOM
 * INPUT: none
 * RETURNS: void
 * ERRORS: none
 */

import React from 'react';
import { vi } from 'vitest';

global.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

vi.mock('recharts', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { style: { width: 800, height: 400 } }, children)
  };
});

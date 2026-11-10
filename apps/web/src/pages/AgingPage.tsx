// ==============================================================================
// Page: Accounts Receivable Aging Page (Stub)
// TODO (Step 4): Build full AR Aging dashboard with customer segment drilldowns
// ==============================================================================

import React from 'react';
import { AgingChartStub } from '../features/aging/AgingChartStub';

export const AgingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Accounts Receivable Aging</h2>
        <p className="text-slate-500 text-sm">
          Aging analysis across Current, 1-30, 31-60, 61-90, and 90+ day exposure brackets.
        </p>
      </div>
      <AgingChartStub />
    </div>
  );
};


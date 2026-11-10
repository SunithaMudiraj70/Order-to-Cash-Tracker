// ==============================================================================
// Page: Dashboard Overview
// TODO (Step 4): Connect live KPI cards and analytical view streams
// ==============================================================================

import React from 'react';
import { AgingChartStub } from '../features/aging/AgingChartStub';
import { LeakageTableStub } from '../features/leakage/LeakageTableStub';
import { DelaysTimelineStub } from '../features/delays/DelaysTimelineStub';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
        <p className="text-slate-500 text-sm">
          Summary of financial leakage risk, aging balances, and operational milestone delays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Overdue Balance
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-2">$0.00</div>
          <span className="text-xs text-amber-600 mt-1 block">Awaiting Step 4 data</span>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Detected Leakage Incidents
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-2">0</div>
          <span className="text-xs text-red-600 mt-1 block">Awaiting Step 4 data</span>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Avg Order-to-Cash Lag
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-2">0 Days</div>
          <span className="text-xs text-blue-600 mt-1 block">Awaiting Step 4 data</span>
        </div>
      </div>

      <AgingChartStub />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeakageTableStub />
        <DelaysTimelineStub />
      </div>
    </div>
  );
};


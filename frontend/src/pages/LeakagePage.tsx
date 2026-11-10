// ==============================================================================
// Page: Revenue Leakage Tracker Page (Stub)
// TODO (Step 4): Build discrepancy investigation panel and ground truth audit view
// ==============================================================================

import React from 'react';
import { LeakageTableStub } from '../features/leakage/LeakageTableStub';

export const LeakagePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Revenue Leakage & Audit</h2>
        <p className="text-slate-500 text-sm">
          Tracking underbilling, uncollected closed orders, and duplicate invoice occurrences.
        </p>
      </div>
      <LeakageTableStub />
    </div>
  );
};


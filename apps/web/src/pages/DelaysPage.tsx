// ==============================================================================
// Page: Process Delays & Bottlenecks Page (Stub)
// TODO (Step 4): Build cycle time heatmaps and SLA breach escalation view
// ==============================================================================

import React from 'react';
import { DelaysTimelineStub } from '../features/delays/DelaysTimelineStub';

export const DelaysPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Process Delays & SLA Breaches</h2>
        <p className="text-slate-500 text-sm">
          Milestone lead times and bottleneck diagnostics across the fulfillment workflow.
        </p>
      </div>
      <DelaysTimelineStub />
    </div>
  );
};


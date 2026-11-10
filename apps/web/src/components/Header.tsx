// ==============================================================================
// Component: Top Navigation Header
// ==============================================================================

import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-3">
        <h1 className="text-lg font-semibold text-slate-800">
          Order-to-Cash Leakage & Delay Monitor
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
          Live Audit Stream
        </span>
      </div>
    </header>
  );
};


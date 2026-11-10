// ==============================================================================
// Component: Navigation Sidebar
// ==============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Overview', to: '/' },
    { label: 'AR Aging', to: '/aging' },
    { label: 'Revenue Leakage', to: '/leakage' },
    { label: 'Process Delays', to: '/delays' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 font-bold text-white tracking-wide border-b border-slate-800">
        O2C TRACKER
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        v0.1.0 (Step 1 Baseline)
      </div>
    </aside>
  );
};


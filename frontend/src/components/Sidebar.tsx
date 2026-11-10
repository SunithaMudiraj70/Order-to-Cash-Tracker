/**
 * PURPOSE: Navigation sidebar with role-filtered links and collapsed mode
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  TrendingDown,
  Timer,
  AlertOctagon,
  Award,
  Database
} from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { useUiStore } from '../store/uiStore';

export const Sidebar: React.FC = () => {
  const { profile } = useSessionStore();
  const { isSidebarCollapsed } = useUiStore();
  const role = profile?.role;

  const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, show: true },
    { to: '/aging', label: 'AR Aging', icon: Clock, show: role !== 'customer' },
    { to: '/leakage', label: 'Leakage', icon: TrendingDown, show: ['sales_ops', 'analyst', 'admin'].includes(role || '') },
    { to: '/delays', label: 'Delays', icon: Timer, show: role !== 'customer' },
    { to: '/exceptions', label: 'Exceptions', icon: AlertOctagon, show: ['support_agent', 'analyst', 'admin'].includes(role || '') },
    { to: '/evaluation', label: 'Model Benchmark', icon: Award, show: ['analyst', 'admin'].includes(role || '') },
    { to: '/records', label: 'Raw Records', icon: Database, show: true }
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="h-16 flex items-center px-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
          O2C
        </div>
        {!isSidebarCollapsed && (
          <span className="ml-3 font-semibold text-sm tracking-wide text-white truncate">
            Revenue Tracker
          </span>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {links
          .filter((l) => l.show)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="ml-3 truncate">{item.label}</span>}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

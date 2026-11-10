/**
 * PURPOSE: Authentication page with credentials form and instant demo role switcher
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: catches and displays login errors
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, KeyRound } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { UserRole } from '../types';

interface DemoAccount {
  role: UserRole;
  label: string;
  email: string;
  color: string;
}

const DEMO_USERS: DemoAccount[] = [
  { role: 'analyst', label: 'Analyst', email: 'analyst@o2c-demo.com', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { role: 'admin', label: 'Admin', email: 'admin@o2c-demo.com', color: 'bg-red-100 text-red-800 border-red-300' },
  { role: 'sales_ops', label: 'Sales Ops', email: 'sales_ops@o2c-demo.com', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { role: 'support_agent', label: 'Support', email: 'support@o2c-demo.com', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { role: 'customer', label: 'Customer', email: 'customer@o2c-demo.com', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('analyst@o2c-demo.com');
  const [password, setPassword] = useState('DemoUserPass123!');
  const { login, isLoading, error } = useSessionStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // error is captured in store
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    try {
      await login(demoEmail, password);
      navigate('/');
    } catch {
      // error captured in store
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Order-to-Cash Tracker
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Revenue Leakage & Process Delay Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800 py-8 px-6 shadow-xl rounded-2xl border border-slate-700 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-xs rounded bg-red-900/50 border border-red-700 text-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400 mb-3">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Quick Demo Role Sign-In</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.role}
                  type="button"
                  onClick={() => handleQuickLogin(user.email)}
                  className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition text-left truncate ${user.color}`}
                >
                  {user.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

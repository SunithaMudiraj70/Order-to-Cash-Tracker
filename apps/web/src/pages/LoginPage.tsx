// ==============================================================================
// Page: Login & Auth Screen (Stub)
// TODO (Step 4): Implement Supabase auth sign-in form and role redirection
// ==============================================================================

import React from 'react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to O2C Tracker</h2>
        <p className="text-sm text-slate-500 mb-6">
          TODO (Step 4): Connect Supabase Auth with Role-based access control.
        </p>
        <button
          type="button"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          Authenticate Demo Session
        </button>
      </div>
    </div>
  );
};


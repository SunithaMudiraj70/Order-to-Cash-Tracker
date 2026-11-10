/**
 * PURPOSE: Root application layout shell combining sidebar, header, and outlet
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSessionStore } from '../store/sessionStore';

export const Layout: React.FC = () => {
  const { isAuthenticated, isLoading, hydrate } = useSessionStore();
  const navigate = useNavigate();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

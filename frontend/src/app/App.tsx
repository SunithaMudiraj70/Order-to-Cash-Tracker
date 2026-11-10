/**
 * PURPOSE: Root application component providing QueryClient, Router, ErrorBoundary, and conditional Debugger
 * INPUT: none
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../store/queryClient';
import { AppRoutes } from '../routes';
import { ErrorBoundary } from '../components/ErrorBoundary';

const LazyDebugPanel = import.meta.env.DEV
  ? lazy(() => import('../components/DebugPanel').then((m) => ({ default: m.DebugPanel })))
  : null;

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
          {LazyDebugPanel && (
            <Suspense fallback={null}>
              <LazyDebugPanel />
            </Suspense>
          )}
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

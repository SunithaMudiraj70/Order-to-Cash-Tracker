/**
 * PURPOSE: Root application component providing QueryClient and Router context
 * INPUT: none
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../store/queryClient';
import { AppRoutes } from '../routes';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

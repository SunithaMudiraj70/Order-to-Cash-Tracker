/**
 * PURPOSE: Component and routing unit tests for frontend UI views
 * INPUT: React components
 * RETURNS: Vitest test results
 * ERRORS: none
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '../src/pages/LoginPage';
import { DashboardPage } from '../src/pages/DashboardPage';
import { AgingPage } from '../src/pages/AgingPage';
import { EvaluationPage } from '../src/pages/EvaluationPage';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Frontend Component Suite', () => {
  it('renders login form and demo role buttons', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Order-to-Cash Tracker')).toBeDefined();
    expect(screen.getByText(/Quick Demo Role Sign-In/)).toBeDefined();
    expect(screen.getByText('Analyst')).toBeDefined();
    expect(screen.getByText('Customer')).toBeDefined();
  });

  it('renders dashboard with executive KPI titles', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Revenue Leakage')).toBeDefined();
    expect(screen.getByText('Overdue Balance')).toBeDefined();
    expect(screen.getByText('Avg Cycle Time')).toBeDefined();
    expect(screen.getByText('Active Exceptions')).toBeDefined();
  });

  it('renders AR aging page with cutoff date selector', () => {
    renderWithProviders(<AgingPage />);
    expect(screen.getByText('Accounts Receivable Aging')).toBeDefined();
    expect(screen.getByText('Aging Buckets by Segment')).toBeDefined();
  });

  it('renders model evaluation benchmark page', () => {
    renderWithProviders(<EvaluationPage />);
    expect(screen.getByText('Detection Benchmark Evaluation')).toBeDefined();
    expect(screen.getByText('Benchmark Validated')).toBeDefined();
  });
});

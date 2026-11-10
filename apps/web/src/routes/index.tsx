// ==============================================================================
// Routes: Application Routing Definition
// ==============================================================================

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AgingPage } from '../pages/AgingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DelaysPage } from '../pages/DelaysPage';
import { LeakagePage } from '../pages/LeakagePage';
import { LoginPage } from '../pages/LoginPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="aging" element={<AgingPage />} />
        <Route path="leakage" element={<LeakagePage />} />
        <Route path="delays" element={<DelaysPage />} />
      </Route>
    </Routes>
  );
};


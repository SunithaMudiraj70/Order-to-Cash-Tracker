/**
 * PURPOSE: Application route configuration with lazy loading and role-based protection
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: redirects unauthenticated or unauthorized users
 */

import React, { Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Loading } from '../components/Loading';
import { useSessionStore } from '../store/sessionStore';
import { UserRole } from '../types';

const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AgingPage = lazy(() => import('../pages/AgingPage').then((m) => ({ default: m.AgingPage })));
const LeakagePage = lazy(() => import('../pages/LeakagePage').then((m) => ({ default: m.LeakagePage })));
const DelaysPage = lazy(() => import('../pages/DelaysPage').then((m) => ({ default: m.DelaysPage })));
const ExceptionsPage = lazy(() => import('../pages/ExceptionsPage').then((m) => ({ default: m.ExceptionsPage })));
const EvaluationPage = lazy(() => import('../pages/EvaluationPage').then((m) => ({ default: m.EvaluationPage })));
const RecordsPage = lazy(() => import('../pages/RecordsPage').then((m) => ({ default: m.RecordsPage })));

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactElement;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { profile } = useSessionStore();
  if (!profile) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" replace />;
  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div className="p-8"><Loading /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="aging" element={<RoleGuard allowedRoles={['sales_ops', 'support_agent', 'analyst', 'admin']}><AgingPage /></RoleGuard>} />
          <Route path="leakage" element={<RoleGuard allowedRoles={['sales_ops', 'analyst', 'admin']}><LeakagePage /></RoleGuard>} />
          <Route path="delays" element={<RoleGuard allowedRoles={['sales_ops', 'support_agent', 'analyst', 'admin']}><DelaysPage /></RoleGuard>} />
          <Route path="exceptions" element={<RoleGuard allowedRoles={['support_agent', 'analyst', 'admin']}><ExceptionsPage /></RoleGuard>} />
          <Route path="evaluation" element={<RoleGuard allowedRoles={['analyst', 'admin']}><EvaluationPage /></RoleGuard>} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

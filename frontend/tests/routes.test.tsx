/**
 * PURPOSE: Unit tests for RoleGuard access control and navigation redirection
 * INPUT: mocked sessionStore state and simulated route navigation
 * RETURNS: Vitest test assertions
 * ERRORS: none
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleGuard } from '../src/routes';
import { useSessionStore } from '../src/store/sessionStore';

describe('RoleGuard route protection', () => {
  it('redirects unauthenticated user to /login', () => {
    useSessionStore.setState({ profile: null, isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <RoleGuard allowedRoles={['admin', 'analyst']}>
                <div>Protected Content</div>
              </RoleGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeDefined();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('redirects unauthorized role to / root', () => {
    useSessionStore.setState({
      profile: { id: 'usr-1', email: 'cust@o2c.local', role: 'customer' },
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<div>Home Dashboard</div>} />
          <Route
            path="/protected"
            element={
              <RoleGuard allowedRoles={['admin', 'analyst']}>
                <div>Protected Content</div>
              </RoleGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Dashboard')).toBeDefined();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders protected content for authorized role', () => {
    useSessionStore.setState({
      profile: { id: 'usr-2', email: 'analyst@o2c.local', role: 'analyst' },
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RoleGuard allowedRoles={['admin', 'analyst']}>
                <div>Protected Content</div>
              </RoleGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeDefined();
  });
});

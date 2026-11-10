/**
 * PURPOSE: Administrative user profile and role management console
 * INPUT: React component props
 * RETURNS: JSX.Element
 * ERRORS: none
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, UserCheck } from 'lucide-react';
import { apiRequest } from '../services/apiClient';
import { DataTable, Column } from '../components/DataTable';
import { UserRole } from '../types';

interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  account_id: string | null;
  created_at: string;
}

const AVAILABLE_ROLES: UserRole[] = ['admin', 'analyst', 'sales_ops', 'support_agent', 'customer'];

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest<AdminUser[]>('/admin/users')
  });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      apiRequest(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setFeedback('User role updated successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: unknown) => {
      setFeedback(err instanceof Error ? err.message : 'Update failed');
    }
  });

  const columns: Column<AdminUser>[] = [
    { key: 'email', header: 'Email', className: 'font-mono text-xs text-white' },
    { key: 'full_name', header: 'Name', render: (u) => u.full_name || '-' },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => mutation.mutate({ id: u.id, role: e.target.value as UserRole })}
          className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-indigo-300 focus:outline-none"
        >
          {AVAILABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      )
    },
    { key: 'account_id', header: 'Tenant Account', render: (u) => u.account_id || 'Global' },
    { key: 'created_at', header: 'Created', render: (u) => new Date(u.created_at).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Administrative User & Role Management</h2>
            <p className="text-xs text-slate-400">Configure role-based access control and tenant account scopes</p>
          </div>
        </div>
        {feedback && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <DataTable
          columns={columns}
          data={users || []}
          rowKey={(u) => u.id}
          isLoading={isLoading}
          emptyTitle="No registered users found"
          emptyMessage="No profiles provisioned in the system database."
        />
      </div>
    </div>
  );
};

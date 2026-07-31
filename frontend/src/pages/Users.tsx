import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/users';
import { User, UserRole } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { UserCheck, Plus, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'SECURITY_GUARD' as UserRole,
  });

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => userApi.getUsers({ page, size: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      toast.success('User created successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data: { id: number; active: boolean }) => userApi.updateUserStatus(data.id, data.active),
    onSuccess: () => {
      toast.success('User status updated!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const columns: Column<User>[] = [
    {
      header: 'User',
      render: (u) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{u.fullName}</p>
          <p className="text-xs text-slate-400">@{u.username}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (u) => <Badge variant="purple">{u.role}</Badge>,
    },
    {
      header: 'Contact',
      render: (u) => (
        <div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{u.email || 'No email'}</p>
          <p className="text-[11px] text-slate-400">{u.phone || 'No phone'}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (u) => <Badge variant={u.active ? 'success' : 'danger'}>{u.active ? 'Active' : 'Disabled'}</Badge>,
    },
    {
      header: 'Actions',
      render: (u) => (
        <Button
          variant={u.active ? 'outline' : 'success'}
          size="sm"
          onClick={() => toggleStatusMutation.mutate({ id: u.id, active: !u.active })}
        >
          {u.active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            User Account Management
          </h2>
          <p className="text-sm text-slate-500">Manage user accounts, roles, credentials, and access permissions.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
          Create User Account
        </Button>
      </div>

      <DataTable columns={columns} data={pageData?.content || []} isLoading={isLoading} />
      {pageData && (
        <Pagination
          currentPage={pageData.pageNumber}
          totalPages={pageData.totalPages}
          totalElements={pageData.totalElements}
          pageSize={pageData.pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Create User Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create System Account">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <Input label="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Role</label>
              <select
                className="w-full p-2.5 border rounded-xl text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="SECURITY_OFFICER">SECURITY_OFFICER</option>
                <option value="SECURITY_GUARD">SECURITY_GUARD</option>
                <option value="HOSTEL_WARDEN">HOSTEL_WARDEN</option>
                <option value="CANTEEN_MANAGER">CANTEEN_MANAGER</option>
                <option value="VISITOR">VISITOR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

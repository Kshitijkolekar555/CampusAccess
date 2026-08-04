import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guardApi } from '../api/guards';
import { gateApi } from '../api/gates';
import { Guard } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ShieldCheck, Plus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export const Guards: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [form, setForm] = useState({
    userId: 1,
    badgeNumber: 'GUARD-001',
    assignedGateId: 1,
  });

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['guards', page],
    queryFn: () => guardApi.getGuards({ page, size: 10 }),
  });

  const { data: gates } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gateApi.getAllGates(true),
  });

  const createMutation = useMutation({
    mutationFn: guardApi.createGuard,
    onSuccess: () => {
      toast.success('Guard profile mapped successfully!');
      queryClient.invalidateQueries({ queryKey: ['guards'] });
      setIsCreateOpen(false);
    },
  });

  const columns: Column<Guard>[] = [
    {
      header: 'Badge Number',
      render: (g) => <span className="font-mono font-bold text-xs text-indigo-600">{g.badgeNumber}</span>,
    },
    {
      header: 'Guard Name',
      render: (g) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{g.fullName || g.username}</p>
          <p className="text-xs text-slate-400">{g.phone || 'No phone'}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Gate',
      render: (g) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{g.assignedGateName || 'Unassigned'}</span>,
    },
    {
      header: 'Status',
      render: (g) => <Badge variant={g.active ? 'success' : 'default'}>{g.active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Security Guard Management
          </h2>
          <p className="text-sm text-slate-500">Security personnel badge registration and gate duty assignments.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
          Register Guard Profile
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

      {/* Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register Guard Employee Profile">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <Input label="User ID (System Account)" type="number" required value={form.userId} onChange={(e) => setForm({ ...form, userId: Number(e.target.value) })} />
          <Input label="Security Badge Number" required value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} />
          <Select
            label="Assigned Gate"
            value={form.assignedGateId}
            onChange={(e) => setForm({ ...form, assignedGateId: Number(e.target.value) })}
            options={gates?.map((g) => ({ label: g.name, value: g.id }))}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Register Guard</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

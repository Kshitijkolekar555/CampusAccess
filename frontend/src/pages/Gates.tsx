import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gateApi } from '../api/gates';
import { Gate } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { DoorClosed, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const Gates: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    location: '',
    active: true,
  });

  const { data: gates, isLoading } = useQuery({
    queryKey: ['gates-all'],
    queryFn: () => gateApi.getAllGates(false),
  });

  const createMutation = useMutation({
    mutationFn: gateApi.createGate,
    onSuccess: () => {
      toast.success('Campus gate configured!');
      queryClient.invalidateQueries({ queryKey: ['gates-all'] });
      setIsCreateOpen(false);
    },
  });

  const columns: Column<Gate>[] = [
    {
      header: 'Gate ID',
      accessor: 'id',
      render: (g) => <span className="font-mono font-bold text-xs">#GATE-{g.id}</span>,
    },
    {
      header: 'Gate Name',
      accessor: 'name',
      render: (g) => <span className="font-bold text-slate-900 dark:text-slate-100">{g.name}</span>,
    },
    {
      header: 'Location / Description',
      accessor: 'location',
      render: (g) => <span className="text-xs text-slate-500">{g.location || 'Main campus perimeter'}</span>,
    },
    {
      header: 'Status',
      render: (g) => <Badge variant={g.active ? 'success' : 'default'}>{g.active ? 'Operational' : 'Closed'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Campus Gate Configuration
          </h2>
          <p className="text-sm text-slate-500">Configure physical entry and exit gates across campus perimeter.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
          Configure New Gate
        </Button>
      </div>

      <DataTable columns={columns} data={gates || []} isLoading={isLoading} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Campus Gate">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <Input label="Gate Name" placeholder="Gate 1 - Main Entrance" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Location" placeholder="North Perimeter, Main Road" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Save Gate</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

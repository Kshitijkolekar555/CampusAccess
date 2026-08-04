import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gateApi } from '../api/gates';
import { Gate } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const ALLOWED_LOCATIONS = [
  'Main Gate',
  'A1',
  'Library',
  'Boys Hostel',
  'Girls Hostel',
  'Entrepreneurship Development Cell(EDC)',
];

export const Gates: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [form, setForm] = useState({
    name: 'Main Gate',
    location: 'Main Entrance',
    active: true,
  });

  const { data: gates, isLoading, refetch } = useQuery({
    queryKey: ['gates-all'],
    queryFn: () => gateApi.getAllGates(false),
  });

  const createMutation = useMutation({
    mutationFn: gateApi.createGate,
    onSuccess: () => {
      toast.success('Campus location configured successfully!');
      queryClient.invalidateQueries({ queryKey: ['gates-all'] });
      refetch();
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add location');
    },
  });

  const columns: Column<Gate>[] = [
    {
      header: 'Location Code',
      accessor: 'id',
      render: (g) => <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">#LOC-{g.id}</span>,
    },
    {
      header: 'Location Name',
      accessor: 'name',
      render: (g) => <span className="font-bold text-slate-900 dark:text-slate-100">{g.name}</span>,
    },
    {
      header: 'Location Details',
      accessor: 'location',
      render: (g) => <span className="text-xs text-slate-500">{g.location || 'Campus Perimeter'}</span>,
    },
    {
      header: 'Status',
      render: (g) => <Badge variant={g.active ? 'success' : 'default'}>{g.active ? 'Operational' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-600" /> Location Configuration
          </h2>
          <p className="text-sm text-slate-500">Configure entry, exit, and guard assignment locations across campus.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
          Configure New Location
        </Button>
      </div>

      <DataTable columns={columns} data={gates || []} isLoading={isLoading} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Configure Campus Location">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <Select
            label="Location Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, location: e.target.value + ' Complex' })}
            options={ALLOWED_LOCATIONS.map((loc) => ({ label: loc, value: loc }))}
          />
          <Input 
            label="Location Description / Details" 
            placeholder="e.g. Main Entrance Gate" 
            value={form.location} 
            onChange={(e) => setForm({ ...form, location: e.target.value })} 
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Save Location</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

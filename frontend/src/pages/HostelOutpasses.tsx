import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelOutpassApi } from '../api/hostelOutpasses';
import { HostelOutpass, OutpassStatus } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Home, Plus, LogOut, LogIn, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const HostelOutpasses: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approveOutpass, setApproveOutpass] = useState<HostelOutpass | null>(null);

  // Initial Form State
  const initialForm = {
    studentName: '',
    studentPrn: '',
    studentRoom: 'A-102',
    studentHostel: 'Block A',
    studentClass: 'BE',
    studentDivision: '1',
    studentMobile: '',
    parentContact: '',
    emergencyContact: '',
    reason: '',
    destination: '',
    departureTime: new Date().toISOString().slice(0, 16),
    expectedReturnTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  };

  const [form, setForm] = useState(initialForm);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['hostel-outpasses', page],
    queryFn: () => hostelOutpassApi.getOutpasses({ page, size: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => hostelOutpassApi.createOutpass({
      ...data,
      departureTime: new Date(data.departureTime).toISOString(),
      expectedReturnTime: new Date(data.expectedReturnTime).toISOString(),
    }),
    onSuccess: () => {
      toast.success('Outpass requested successfully!');
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      setIsCreateOpen(false);
      setForm(initialForm);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create hostel outpass');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: { outpassId: number; approved: boolean }) =>
      hostelOutpassApi.approveOutpass(data.outpassId, { approved: data.approved }),
    onSuccess: () => {
      toast.success('Outpass status updated!');
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      setApproveOutpass(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  const exitMutation = useMutation({
    mutationFn: (id: number) => hostelOutpassApi.recordGateExit(id, 1),
    onSuccess: () => {
      toast.success('Hostel Outpass Exit recorded!');
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record exit');
    },
  });

  const entryMutation = useMutation({
    mutationFn: (id: number) => hostelOutpassApi.recordGateEntry(id),
    onSuccess: () => {
      toast.success('Hostel Outpass Re-Entry recorded!');
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record entry');
    },
  });

  const columns: Column<HostelOutpass>[] = [
    {
      header: 'Outpass #',
      render: (o) => <span className="font-mono font-bold text-xs text-indigo-600">{o.outpassNumber || `OP-#${o.id}`}</span>,
    },
    {
      header: 'Student & Room',
      render: (o) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{o.studentName}</p>
          <p className="text-xs text-slate-400">{o.studentHostel || o.hostelBlock || 'Hostel'} ({o.studentRoom || o.roomNumber || 'Room'})</p>
        </div>
      ),
    },
    {
      header: 'Reason & Destination',
      render: (o) => (
        <div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{o.reason}</p>
          <p className="text-[11px] text-slate-400">Dest: {o.destination || o.destinationAddress}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (o) => (
        <div className="flex items-center gap-2">
          <Badge variant={o.status === 'APPROVED' ? 'success' : o.status === 'PENDING' ? 'warning' : 'default'}>
            {o.status}
          </Badge>
          {o.isLateReturn && <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>LATE</Badge>}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (o) => (
        <div className="flex items-center gap-2">
          {o.status === 'PENDING' && (
            <Button variant="outline" size="sm" onClick={() => setApproveOutpass(o)}>
              Approve/Reject
            </Button>
          )}

          {o.status === 'APPROVED' && !o.gateExitAt && (
            <Button variant="primary" size="sm" onClick={() => exitMutation.mutate(o.id)} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              Exit Gate
            </Button>
          )}

          {o.gateExitAt && !o.actualReturnTime && (
            <Button variant="success" size="sm" onClick={() => entryMutation.mutate(o.id)} leftIcon={<LogIn className="w-3.5 h-3.5" />}>
              Return Entry
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Hostel Outpass Permits
          </h2>
          <p className="text-sm text-slate-500">Night outpasses and weekend leave management with late return alert notifications.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
          New Outpass Request
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

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Issue Hostel Outpass Request">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Student Name" required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
            <Input label="Student PRN" required value={form.studentPrn} onChange={(e) => setForm({ ...form, studentPrn: e.target.value })} />
            <Input label="Hostel Block" required value={form.studentHostel} onChange={(e) => setForm({ ...form, studentHostel: e.target.value })} />
            <Input label="Room Number" required value={form.studentRoom} onChange={(e) => setForm({ ...form, studentRoom: e.target.value })} />
            <Input label="Student Mobile" required value={form.studentMobile} onChange={(e) => setForm({ ...form, studentMobile: e.target.value })} />
            <Input label="Parent Contact" required value={form.parentContact} onChange={(e) => setForm({ ...form, parentContact: e.target.value })} />
            <Input label="Emergency Contact" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            <Input label="Class & Div" value={`${form.studentClass}-${form.studentDivision}`} onChange={(e) => {
              const parts = e.target.value.split('-');
              setForm({ ...form, studentClass: parts[0] || 'BE', studentDivision: parts[1] || '1' });
            }} />
            <Input label="Departure Time" type="datetime-local" required value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} />
            <Input label="Expected Return" type="datetime-local" required value={form.expectedReturnTime} onChange={(e) => setForm({ ...form, expectedReturnTime: e.target.value })} />
          </div>
          <Input label="Reason for Outpass" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Input label="Destination Address" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Submit Outpass</Button>
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal isOpen={!!approveOutpass} onClose={() => setApproveOutpass(null)} title="Approve Hostel Outpass" maxWidth="sm">
        {approveOutpass && (
          <div className="space-y-4">
            <p className="text-sm">Approve outpass for <strong>{approveOutpass.studentName}</strong>?</p>
            <div className="flex justify-end gap-3">
              <Button variant="danger" onClick={() => approveMutation.mutate({ outpassId: approveOutpass.id, approved: false })}>Reject</Button>
              <Button variant="success" onClick={() => approveMutation.mutate({ outpassId: approveOutpass.id, approved: true })}>Approve Outpass</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

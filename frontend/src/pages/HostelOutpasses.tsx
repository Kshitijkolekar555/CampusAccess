import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelOutpassApi } from '../api/hostelOutpasses';
import { HostelOutpass } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Plus, LogOut, LogIn, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

export const HostelOutpasses: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approveOutpass, setApproveOutpass] = useState<HostelOutpass | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [wardenRemarksInput, setWardenRemarksInput] = useState('');

  const toLocalISOString = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const getInitialForm = () => ({
    studentName: user?.fullName || '',
    studentPrn: user?.username || '',
    studentRoom: 'A-102',
    studentHostel: 'Block A',
    studentClass: 'BE',
    studentDivision: '1',
    studentMobile: user?.phone || '9876543210',
    parentContact: '9876543210',
    emergencyContact: '9876543210',
    reason: '',
    studentNote: '',
    destination: '',
    departureTime: toLocalISOString(new Date()),
    expectedReturnTime: toLocalISOString(new Date(Date.now() + 86400000)),
  });

  const [form, setForm] = useState(getInitialForm());

  React.useEffect(() => {
    setForm(getInitialForm());
  }, [user]);

  const { data: pageData, isLoading, refetch } = useQuery({
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
      refetch();
      setIsCreateOpen(false);
      setForm(getInitialForm());
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create hostel outpass';
      toast.error(msg);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: { outpassId: number; approved: boolean; rejectionReason?: string; wardenRemarks?: string }) =>
      hostelOutpassApi.approveOutpass(data.outpassId, { 
        approved: data.approved, 
        rejectionReason: data.rejectionReason,
        wardenRemarks: data.wardenRemarks 
      }),
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? 'Outpass approved successfully!' : 'Outpass rejected successfully!');
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      refetch();
      setApproveOutpass(null);
      setRejectionReasonInput('');
      setWardenRemarksInput('');
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
      refetch();
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
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record entry');
    },
  });

  const canReview = user?.role === 'ADMIN' || user?.role === 'SECURITY_GUARD' || user?.role === 'GUARD' || user?.role === 'SECURITY_OFFICER' || user?.role === 'HOSTEL_WARDEN';

  const columns: Column<HostelOutpass>[] = [
    {
      header: 'Outpass #',
      render: (o) => <span className="font-mono font-bold text-xs text-indigo-600 tracking-wider">{o.outpassNumber || `OP-#${o.id}`}</span>,
    },
    {
      header: 'Student & PRN',
      render: (o) => (
        <div>
          <p className="font-bold text-slate-900">{o.studentName}</p>
          <p className="text-xs text-slate-500 font-mono">PRN: {o.studentPrn}</p>
          <p className="text-xs text-slate-400">{o.studentHostel || o.hostelBlock || 'Hostel'} ({o.studentRoom || o.roomNumber || 'Room'})</p>
        </div>
      ),
    },
    {
      header: 'Reason & Note',
      render: (o) => (
        <div className="max-w-xs space-y-1">
          <p className="text-xs font-medium text-slate-800">{o.reason}</p>
          {o.studentNote && (
            <p className="text-[11px] text-amber-600 italic">Note: "{o.studentNote}"</p>
          )}
          <p className="text-[11px] text-slate-400">Dest: {o.destination || o.destinationAddress}</p>
          {o.rejectionReason && (
            <p className="text-[11px] text-rose-600 font-semibold">Rejected Reason: {o.rejectionReason}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (o) => (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant={o.status === 'APPROVED' ? 'success' : o.status === 'PENDING' ? 'warning' : o.status === 'REJECTED' ? 'danger' : 'default'}>
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
          {canReview && o.status === 'PENDING' && (
            <Button variant="outline" size="sm" onClick={() => { setApproveOutpass(o); setRejectionReasonInput(''); setWardenRemarksInput(''); }}>
              Review Request
            </Button>
          )}

          {canReview && o.status === 'APPROVED' && !o.gateExitAt && (
            <Button variant="primary" size="sm" onClick={() => exitMutation.mutate(o.id)} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              Exit Gate
            </Button>
          )}

          {canReview && o.gateExitAt && !o.actualReturnTime && (
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
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 22, color: 'var(--text)', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
            Hostel Outpasses
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--mute)', margin: 0 }}>Night outpasses and leave management with late return tracking.</p>
        </div>
        {(user?.role === 'STUDENT' || user?.role === 'ADMIN') && (
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
            New Outpass Request
          </Button>
        )}
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
            <Input label="Student Name" required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} disabled={user?.role === 'STUDENT'} />
            <Input label="Student PRN" required value={form.studentPrn} onChange={(e) => setForm({ ...form, studentPrn: e.target.value })} disabled={user?.role === 'STUDENT'} />
            <Input label="Hostel Block" required value={form.studentHostel} onChange={(e) => setForm({ ...form, studentHostel: e.target.value })} />
            <Input label="Room Number" required value={form.studentRoom} onChange={(e) => setForm({ ...form, studentRoom: e.target.value })} />
            <Input label="Student Mobile" required value={form.studentMobile} onChange={(e) => setForm({ ...form, studentMobile: e.target.value })} disabled={user?.role === 'STUDENT'} />
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
          <Input label="Student Note / Remarks (Optional)" placeholder="Any extra information for guard or warden..." value={form.studentNote} onChange={(e) => setForm({ ...form, studentNote: e.target.value })} />
          <Input label="Destination Address" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Submit Outpass</Button>
          </div>
        </form>
      </Modal>

      {/* Review / Approve / Reject Modal */}
      <Modal isOpen={!!approveOutpass} onClose={() => setApproveOutpass(null)} title="Review Hostel Outpass Request" maxWidth="md">
        {approveOutpass && (
          <div className="space-y-4">
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 4, padding: '12px 14px', fontSize: 13 }} className="space-y-1">
              <p><strong>Student:</strong> {approveOutpass.studentName} ({approveOutpass.studentPrn})</p>
              <p><strong>Reason:</strong> {approveOutpass.reason}</p>
              {approveOutpass.studentNote && (
                <p className="text-amber-600"><strong>Student Note:</strong> {approveOutpass.studentNote}</p>
              )}
              <p><strong>Destination:</strong> {approveOutpass.destination}</p>
            </div>

            <Input 
              label="Warden / Reviewer Remarks (Optional for approval)" 
              placeholder="e.g. Approved for weekend leave"
              value={wardenRemarksInput} 
              onChange={(e) => setWardenRemarksInput(e.target.value)} 
            />

            <Input 
              label="Rejection Reason (Required if rejecting)" 
              placeholder="e.g. Late timing not allowed / Invalid reason"
              value={rejectionReasonInput} 
              onChange={(e) => setRejectionReasonInput(e.target.value)} 
            />

            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
              <Button 
                variant="danger" 
                isLoading={approveMutation.isPending}
                onClick={() => {
                  if (!rejectionReasonInput.trim()) {
                    toast.error('Please enter a rejection reason before rejecting');
                    return;
                  }
                  approveMutation.mutate({ 
                    outpassId: approveOutpass.id, 
                    approved: false, 
                    rejectionReason: rejectionReasonInput,
                    wardenRemarks: wardenRemarksInput 
                  });
                }}
              >
                Reject Request
              </Button>
              <Button 
                variant="success" 
                isLoading={approveMutation.isPending}
                onClick={() => approveMutation.mutate({ 
                  outpassId: approveOutpass.id, 
                  approved: true,
                  wardenRemarks: wardenRemarksInput 
                })}
              >
                Approve Outpass
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

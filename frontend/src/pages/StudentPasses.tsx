import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentPassApi } from '../api/studentPasses';
import { gateApi } from '../api/gates';
import { StudentGatePass, PassStatus } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { GraduationCap, Plus, CheckCircle2, XCircle, LogOut, LogIn } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '../store/authStore';

export const StudentPasses: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approvePass, setApprovePass] = useState<StudentGatePass | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const toLocalISOString = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // Initial Form Values (Autofilled from signed in user profile)
  const getInitialForm = () => ({
    studentName: user?.fullName || '',
    studentPrn: user?.username || '',
    studentDepartment: 'CE',
    studentClass: 'BE',
    studentDivision: '1',
    studentMobile: user?.phone || '9876543210',
    purpose: '',
    destination: '',
    departureTime: toLocalISOString(new Date()),
    expectedReturnTime: toLocalISOString(new Date(Date.now() + 86400000)),
  });

  const [form, setForm] = useState(getInitialForm());

  React.useEffect(() => {
    setForm(getInitialForm());
  }, [user]);

  // Queries
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['student-passes', page],
    queryFn: () => studentPassApi.getPasses({ page, size: 10 }),
  });

  const { data: gates } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gateApi.getAllGates(true),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: typeof form) => studentPassApi.createPass({
      ...formData,
      departureTime: new Date(formData.departureTime).toISOString(),
      expectedReturnTime: new Date(formData.expectedReturnTime).toISOString(),
    }),
    onSuccess: () => {
      toast.success('Gate pass requested successfully!');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      setIsCreateOpen(false);
      setForm(getInitialForm());
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create gate pass';
      toast.error(msg);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: { passId: number; approved: boolean; notes?: string; rejectionReason?: string }) =>
      studentPassApi.approvePass(data.passId, { approved: data.approved, notes: data.notes, rejectionReason: data.rejectionReason }),
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? 'Gate pass approved!' : 'Gate pass rejected');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      setApprovePass(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  const exitMutation = useMutation({
    mutationFn: (passId: number) => studentPassApi.recordGateExit(passId, 1),
    onSuccess: () => {
      toast.success('Gate exit recorded!');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record exit');
    },
  });

  const entryMutation = useMutation({
    mutationFn: (passId: number) => studentPassApi.recordGateEntry(passId),
    onSuccess: () => {
      toast.success('Gate re-entry recorded!');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record entry');
    },
  });

  const columns: Column<StudentGatePass>[] = [
    {
      header: 'Pass #',
      render: (p) => <span className="font-mono font-bold text-xs text-indigo-600">{p.passNumber || `GP-#${p.id}`}</span>,
    },
    {
      header: 'Student',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900">{p.studentName}</p>
          <p className="text-xs text-slate-400">PRN: {p.studentPrn} ({p.studentDepartment})</p>
        </div>
      ),
    },
    {
      header: 'Purpose & Destination',
      render: (p) => (
        <div>
          <p className="text-xs font-medium text-slate-800">{p.purpose}</p>
          <p className="text-[11px] text-slate-400">Dest: {p.destination}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (p) => {
        const variants: Record<PassStatus, 'warning' | 'success' | 'danger' | 'info' | 'default'> = {
          PENDING: 'warning',
          APPROVED: 'success',
          REJECTED: 'danger',
          EXPIRED: 'info',
          COMPLETED: 'default',
        };
        return (
          <div>
            <Badge variant={variants[p.status]}>{p.status}</Badge>
            {p.status === 'REJECTED' && p.rejectionReason && (
              <p className="text-[10px] text-rose-500 font-medium mt-0.5">Reason: {p.rejectionReason}</p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      render: (p) => {
        const canReview = user?.role !== 'STUDENT';
        const canRecordExit = user?.role === 'SECURITY_GUARD' || user?.role === 'GUARD' || user?.role === 'ADMIN' || user?.role === 'SECURITY_OFFICER';

        return (
          <div className="flex items-center gap-2">
            {p.status === 'PENDING' && canReview && (
              <Button variant="outline" size="sm" onClick={() => { setApprovePass(p); setApprovalNotes(''); setRejectionReason(''); }}>
                Review Pass
              </Button>
            )}

            {p.status === 'APPROVED' && !p.gateExitAt && canRecordExit && (
              <Button variant="primary" size="sm" onClick={() => exitMutation.mutate(p.id)} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
                Exit Gate
              </Button>
            )}

            {p.gateExitAt && !p.actualReturnTime && canRecordExit && (
              <Button variant="success" size="sm" onClick={() => entryMutation.mutate(p.id)} leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                Record Entry
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 22, color: 'var(--text)', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
            Student Passes
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--mute)', margin: 0 }}>Official gate exit/entry permits for students with warden approval workflow.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
          New Gate Pass Request
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
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Issue Student Gate Pass Request">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Student Name (Auto-filled)" required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} disabled={user?.role === 'STUDENT'} />
            <Input label="Student PRN (Auto-filled)" required value={form.studentPrn} onChange={(e) => setForm({ ...form, studentPrn: e.target.value })} disabled={user?.role === 'STUDENT'} />
            <Input label="Student Mobile (Auto-filled)" required value={form.studentMobile} onChange={(e) => setForm({ ...form, studentMobile: e.target.value })} disabled={user?.role === 'STUDENT'} />
            <Input label="Department" required value={form.studentDepartment} onChange={(e) => setForm({ ...form, studentDepartment: e.target.value })} />
            <Input label="Class" required value={form.studentClass} onChange={(e) => setForm({ ...form, studentClass: e.target.value })} />
            <Input label="Division" required value={form.studentDivision} onChange={(e) => setForm({ ...form, studentDivision: e.target.value })} />
            <Input label="Departure Time" type="datetime-local" required value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} />
            <Input label="Expected Return" type="datetime-local" required value={form.expectedReturnTime} onChange={(e) => setForm({ ...form, expectedReturnTime: e.target.value })} />
          </div>
          <Input label="Purpose" required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          <Input label="Destination" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Submit Pass</Button>
          </div>
        </form>
      </Modal>

      {/* Warden / Guard Approval Modal */}
      <Modal isOpen={!!approvePass} onClose={() => setApprovePass(null)} title="Pass Review & Approval" maxWidth="sm">
        {approvePass && (
          <div className="space-y-4">
            <p className="text-sm">Pass Request for <strong>{approvePass.studentName}</strong> ({approvePass.purpose})</p>
            <Input label="Approval Notes (Optional)" value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} placeholder="e.g. Approved for weekend visit" />
            <Input label="Rejection Reason (Required if Rejecting)" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Insufficient documentation" />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="danger"
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error('Please enter a rejection reason');
                    return;
                  }
                  approveMutation.mutate({ passId: approvePass.id, approved: false, rejectionReason: rejectionReason.trim() });
                }}
              >
                Reject Pass
              </Button>
              <Button
                variant="success"
                onClick={() => approveMutation.mutate({ passId: approvePass.id, approved: true, notes: approvalNotes })}
              >
                Approve Pass
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

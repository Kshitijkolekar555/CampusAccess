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

export const StudentPasses: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approvePass, setApprovePass] = useState<StudentGatePass | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [form, setForm] = useState({
    studentName: '',
    studentPrn: '',
    studentDepartment: 'CE',
    studentClass: 'BE',
    studentDivision: '1',
    studentMobile: '',
    purpose: '',
    destination: '',
    departureTime: new Date().toISOString(),
    expectedReturnTime: new Date(Date.now() + 86400000).toISOString(),
  });

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
    mutationFn: studentPassApi.createPass,
    onSuccess: () => {
      toast.success('Gate pass requested successfully!');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      setIsCreateOpen(false);
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
  });

  const exitMutation = useMutation({
    mutationFn: (passId: number) => studentPassApi.recordGateExit(passId, 1),
    onSuccess: () => {
      toast.success('Gate exit recorded!');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
    },
  });

  const entryMutation = useMutation({
    mutationFn: (passId: number) => studentPassApi.recordGateEntry(passId),
    onSuccess: () => {
      toast.success('Gate re-entry recorded!');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
    },
  });

  const columns: Column<StudentGatePass>[] = [
    {
      header: 'Pass #',
      render: (p) => <span className="font-mono font-bold text-xs text-indigo-600">{p.passNumber}</span>,
    },
    {
      header: 'Student',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{p.studentName}</p>
          <p className="text-xs text-slate-400">PRN: {p.studentPrn} ({p.studentDepartment})</p>
        </div>
      ),
    },
    {
      header: 'Purpose & Destination',
      render: (p) => (
        <div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{p.purpose}</p>
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
        return <Badge variant={variants[p.status]}>{p.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.status === 'PENDING' && (
            <Button variant="outline" size="sm" onClick={() => setApprovePass(p)}>
              Review Pass
            </Button>
          )}

          {p.status === 'APPROVED' && !p.gateExitAt && (
            <Button variant="primary" size="sm" onClick={() => exitMutation.mutate(p.id)} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              Exit Gate
            </Button>
          )}

          {p.gateExitAt && !p.actualReturnTime && (
            <Button variant="success" size="sm" onClick={() => entryMutation.mutate(p.id)} leftIcon={<LogIn className="w-3.5 h-3.5" />}>
              Record Entry
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
            Student Gate Pass Management
          </h2>
          <p className="text-sm text-slate-500">Official gate exit/entry permits for students with warden approval workflow.</p>
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
            <Input label="Student Name" required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
            <Input label="Student PRN" required value={form.studentPrn} onChange={(e) => setForm({ ...form, studentPrn: e.target.value })} />
            <Input label="Student Mobile" required value={form.studentMobile} onChange={(e) => setForm({ ...form, studentMobile: e.target.value })} />
            <Input label="Purpose" required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>
          <Input label="Destination" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Submit Pass</Button>
          </div>
        </form>
      </Modal>

      {/* Warden Approval Modal */}
      <Modal isOpen={!!approvePass} onClose={() => setApprovePass(null)} title="Warden Pass Review" maxWidth="sm">
        {approvePass && (
          <div className="space-y-4">
            <p className="text-sm">Pass Request for <strong>{approvePass.studentName}</strong> ({approvePass.purpose})</p>
            <Input label="Approval Notes" value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="danger"
                onClick={() => approveMutation.mutate({ passId: approvePass.id, approved: false, rejectionReason: 'Declined by Warden' })}
              >
                Reject
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

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentPassApi } from '../api/studentPasses';
import { hostelOutpassApi } from '../api/hostelOutpasses';
import { gateApi } from '../api/gates';
import { StudentGatePass, HostelOutpass, PassStatus } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { GraduationCap, Plus, CheckCircle2, XCircle, LogOut, LogIn, Search, RefreshCw, Eye, Ticket, ShieldCheck, MapPin, Calendar, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '../store/authStore';

type UnifiedPass = (StudentGatePass | HostelOutpass) & {
  passType: 'GATE_PASS' | 'HOSTEL_OUTPASS';
  rawStatus: string;
  displayPassNumber: string;
  displayPurpose: string;
  displayDestination: string;
  displayStatus: PassStatus;
  displayDeparture: string;
  displayReturn: string;
};

export const StudentPasses: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [prnSearch, setPrnSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'GATE_PASSES' | 'HOSTEL_OUTPASSES'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approvePass, setApprovePass] = useState<UnifiedPass | null>(null);
  const [viewCardPass, setViewCardPass] = useState<UnifiedPass | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const toLocalISOString = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const effectivePrn = prnSearch.trim() ? prnSearch.trim().toUpperCase() : undefined;

  // 1. Query Regular Gate Passes
  const {
    data: gatePassData,
    isLoading: isGatePassLoading,
    isRefetching: isGatePassRefetching,
    refetch: refetchGatePasses,
  } = useQuery({
    queryKey: ['student-passes', page, effectivePrn],
    queryFn: () => studentPassApi.getPasses({ 
      page, 
      size: 15,
      studentPrn: effectivePrn,
    }),
    refetchInterval: 5000,
  });

  // 2. Query Hostel Outpasses (so accepted student outpasses appear right here on /student-passes!)
  const {
    data: hostelOutpassData,
    isLoading: isHostelLoading,
    isRefetching: isHostelRefetching,
    refetch: refetchHostelOutpasses,
  } = useQuery({
    queryKey: ['hostel-outpasses-for-student-passes', page, effectivePrn],
    queryFn: () => hostelOutpassApi.getOutpasses({
      page,
      size: 15,
      query: effectivePrn,
    }),
    refetchInterval: 5000,
  });

  const isLoading = isGatePassLoading && isHostelLoading;
  const isRefetching = isGatePassRefetching || isHostelRefetching;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchGatePasses(),
        refetchHostelOutpasses(),
        queryClient.invalidateQueries({ queryKey: ['student-passes'] }),
        queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] }),
      ]);
      toast.success('Passes refreshed successfully');
    } catch {
      toast.error('Failed to refresh student passes');
    }
  };

  // Map and combine passes into unified stream
  const unifiedPasses: UnifiedPass[] = React.useMemo(() => {
    const gateList: UnifiedPass[] = (gatePassData?.content || []).map((p) => ({
      ...p,
      passType: 'GATE_PASS' as const,
      rawStatus: p.status,
      displayPassNumber: p.passNumber || `GP-#${p.id}`,
      displayPurpose: p.purpose || 'Academic Leave',
      displayDestination: p.destination || 'Pune',
      displayStatus: p.status,
      displayDeparture: p.departureTime,
      displayReturn: p.expectedReturnTime,
    }));

    const hostelList: UnifiedPass[] = (hostelOutpassData?.content || []).map((o) => {
      let mappedStatus: PassStatus = 'PENDING';
      if (o.status === 'APPROVED') mappedStatus = 'APPROVED';
      else if (o.status === 'REJECTED') mappedStatus = 'REJECTED';
      else if (o.status === 'EXITED') mappedStatus = 'ACTIVE';
      else if (o.status === 'RETURNED' || o.status === 'COMPLETED') mappedStatus = 'COMPLETED';
      else if (o.status === 'EXPIRED') mappedStatus = 'EXPIRED';

      return {
        ...o,
        passType: 'HOSTEL_OUTPASS' as const,
        rawStatus: o.status,
        displayPassNumber: o.outpassNumber || `OP-#${o.id}`,
        displayPurpose: o.reason || 'Campus Leave',
        displayDestination: o.destination || o.destinationAddress || 'Pune',
        displayStatus: mappedStatus,
        displayDeparture: o.departureTime || o.departureDate || '',
        displayReturn: o.expectedReturnTime || o.expectedReturnDate || '',
      };
    });

    let combined = [...gateList, ...hostelList];

    if (activeTab === 'GATE_PASSES') {
      combined = combined.filter((p) => p.passType === 'GATE_PASS');
    } else if (activeTab === 'HOSTEL_OUTPASSES') {
      combined = combined.filter((p) => p.passType === 'HOSTEL_OUTPASS');
    }

    // Sort newest first
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  }, [gatePassData, hostelOutpassData, activeTab]);
  // Initial Form Values (Autofilled from signed in user profile or past records)
  const getInitialForm = () => {
    const existing = unifiedPasses.find((p) => p.studentPrn === user?.username);
    const dept = existing && 'studentDepartment' in existing ? (existing as any).studentDepartment : '';
    return {
      studentName: user?.fullName || '',
      studentPrn: user?.username || '',
      studentDepartment: dept || '',
      studentClass: existing?.studentClass || '',
      studentDivision: existing?.studentDivision || '',
      studentMobile: user?.phone || existing?.studentMobile || '',
      purpose: '',
      destination: '',
      departureTime: toLocalISOString(new Date()),
      expectedReturnTime: toLocalISOString(new Date(Date.now() + 86400000)),
    };
  };

  const [form, setForm] = useState(getInitialForm());

  React.useEffect(() => {
    const existing = unifiedPasses.find((p) => p.studentPrn === user?.username);
    const dept = existing && 'studentDepartment' in existing ? (existing as any).studentDepartment : '';
    setForm((prev) => ({
      ...prev,
      studentName: user?.fullName || prev.studentName,
      studentPrn: user?.username || prev.studentPrn,
      studentDepartment: prev.studentDepartment || dept || '',
      studentClass: prev.studentClass || existing?.studentClass || '',
      studentDivision: prev.studentDivision || existing?.studentDivision || '',
      studentMobile: prev.studentMobile || user?.phone || existing?.studentMobile || '',
    }));
  }, [user, unifiedPasses]);

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
    mutationFn: async (data: { passId: number; approved: boolean; notes?: string; rejectionReason?: string; isHostel?: boolean }) => {
      if (data.isHostel) {
        return hostelOutpassApi.approveOutpass(data.passId, {
          approved: data.approved,
          wardenRemarks: data.notes,
          rejectionReason: data.rejectionReason,
        });
      }
      return studentPassApi.approvePass(data.passId, {
        approved: data.approved,
        notes: data.notes,
        rejectionReason: data.rejectionReason,
      });
    },
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? 'Pass approved successfully!' : 'Pass rejected');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses-for-student-passes'] });
      setApprovePass(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  const exitMutation = useMutation({
    mutationFn: async (pass: UnifiedPass) => {
      if (pass.passType === 'HOSTEL_OUTPASS') {
        return hostelOutpassApi.recordGateExit(pass.id, 1);
      }
      return studentPassApi.recordGateExit(pass.id, 1);
    },
    onSuccess: () => {
      toast.success('Gate exit recorded!');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses-for-student-passes'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record exit');
    },
  });

  const entryMutation = useMutation({
    mutationFn: async (pass: UnifiedPass) => {
      if (pass.passType === 'HOSTEL_OUTPASS') {
        return hostelOutpassApi.recordGateEntry(pass.id);
      }
      return studentPassApi.recordGateEntry(pass.id);
    },
    onSuccess: () => {
      toast.success('Gate re-entry recorded!');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses-for-student-passes'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record entry');
    },
  });

  const columns: Column<UnifiedPass>[] = [
    {
      header: 'Pass #',
      render: (p) => (
        <div className="space-y-1">
          <span className="font-mono font-bold text-xs text-indigo-600 block">
            {p.displayPassNumber}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${p.passType === 'HOSTEL_OUTPASS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {p.passType === 'HOSTEL_OUTPASS' ? 'Hostel Outpass' : 'Gate Pass'}
          </span>
        </div>
      ),
    },
    {
      header: 'Student',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900">{p.studentName}</p>
          <p className="text-xs text-slate-500 font-normal">
            PRN: <span className="font-mono text-slate-700">{p.studentPrn}</span>
            {('studentDepartment' in p && p.studentDepartment) ? ` (${p.studentDepartment})` : ''}
            {('studentHostel' in p && p.studentHostel) ? ` • ${p.studentHostel}` : ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Purpose & Destination',
      render: (p) => (
        <div>
          <p className="text-xs font-medium text-slate-800">{p.displayPurpose}</p>
          <p className="text-[11px] text-slate-400">Dest: {p.displayDestination}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (p) => {
        const variants: Record<PassStatus, 'warning' | 'success' | 'danger' | 'info' | 'default'> = {
          PENDING: 'warning',
          APPROVED: 'success',
          ACTIVE: 'info',
          COMPLETED: 'default',
          CANCELLED: 'default',
          REJECTED: 'danger',
          EXPIRED: 'danger',
        };
        return (
          <div>
            <Badge variant={variants[p.displayStatus]}>{p.displayStatus}</Badge>
            {p.displayStatus === 'REJECTED' && p.rejectionReason && (
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
            {p.displayStatus === 'PENDING' && canReview && (
              <Button variant="outline" size="sm" onClick={() => { setApprovePass(p); setApprovalNotes(''); setRejectionReason(''); }}>
                Review Pass
              </Button>
            )}

            {p.rawStatus === 'APPROVED' && !p.gateExitAt && canRecordExit && (
              <Button variant="primary" size="sm" onClick={() => exitMutation.mutate(p)} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
                Exit Gate
              </Button>
            )}

            {(p.rawStatus === 'EXITED' || (p.gateExitAt && !p.actualReturnTime && p.rawStatus !== 'RETURNED')) && canRecordExit && (
              <Button variant="success" size="sm" onClick={() => entryMutation.mutate(p)} leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                Record Entry
              </Button>
            )}

            {(p.displayStatus === 'APPROVED' || p.displayStatus === 'ACTIVE' || p.displayStatus === 'COMPLETED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewCardPass(p)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Pass Card
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
            Student Passes & Gate Verification
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--mute)', margin: 0 }}>
            Official gate exit/entry permits for students with real-time guard clearance tracking.
          </p>
        </div>
        {user?.role === 'STUDENT' ? (
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
            New Gate Pass Request
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Guard Desk: Review & Verify Student Passes Below
            </span>
          </div>
        )}
      </div>

      {/* PRN Search & Type Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search / Look up student by PRN (e.g. F24IT32, S25ET034)..."
              value={prnSearch}
              onChange={(e) => {
                setPrnSearch(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          {prnSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrnSearch('');
                setPage(0);
              }}
            >
              Clear Search
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${(isLoading || isRefetching) ? 'animate-spin text-indigo-600' : ''}`} />}
          >
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-2.5 text-xs">
          <span className="text-slate-400 font-medium">Filter view:</span>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All Passes ({unifiedPasses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GATE_PASSES')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${activeTab === 'GATE_PASSES' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Academic Gate Passes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HOSTEL_OUTPASSES')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${activeTab === 'HOSTEL_OUTPASSES' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Hostel Outpasses
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={unifiedPasses} isLoading={isLoading} />

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Issue Student Gate Pass Request">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.studentMobile.trim() || !form.studentDepartment.trim() || !form.studentClass.trim() || !form.studentDivision.trim()) {
              toast.error('Please complete all academic and contact details before submitting');
              return;
            }
            createMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="Student Name" required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} disabled={user?.role === 'STUDENT'} />
            <Input label="Student PRN" required value={form.studentPrn} onChange={(e) => setForm({ ...form, studentPrn: e.target.value })} disabled={user?.role === 'STUDENT'} />
            <Input
              label="Student Mobile"
              required
              value={form.studentMobile}
              onChange={(e) => setForm({ ...form, studentMobile: e.target.value })}
              placeholder="e.g. 9822012345"
              disabled={user?.role === 'STUDENT' && !!user?.phone}
            />
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
            <p className="text-sm">Pass Request for <strong>{approvePass.studentName}</strong> ({approvePass.displayPurpose})</p>
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
                  approveMutation.mutate({
                    passId: approvePass.id,
                    approved: false,
                    rejectionReason: rejectionReason.trim(),
                    isHostel: approvePass.passType === 'HOSTEL_OUTPASS',
                  });
                }}
              >
                Reject Pass
              </Button>
              <Button
                variant="success"
                onClick={() =>
                  approveMutation.mutate({
                    passId: approvePass.id,
                    approved: true,
                    notes: approvalNotes,
                    isHostel: approvePass.passType === 'HOSTEL_OUTPASS',
                  })
                }
              >
                Approve Pass
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Student Digital Outpass Card Modal */}
      <Modal isOpen={!!viewCardPass} onClose={() => setViewCardPass(null)} title="Gate Outpass Permit" maxWidth="md">
        {viewCardPass && (
          <div className="space-y-4 text-slate-800 font-sans leading-relaxed">
            {/* Top Pass Card Summary Banner */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-semibold text-base shadow-xs shrink-0">
                  {viewCardPass.studentName?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-base font-semibold text-slate-900">
                      {viewCardPass.studentName}
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium tracking-normal">
                      PRN: {viewCardPass.studentPrn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    {('studentDepartment' in viewCardPass && viewCardPass.studentDepartment)
                      ? viewCardPass.studentDepartment
                      : ('studentHostel' in viewCardPass && viewCardPass.studentHostel)
                      ? `Hostel: ${viewCardPass.studentHostel}`
                      : 'Campus Student'}
                    {viewCardPass.studentClass ? ` • Class ${viewCardPass.studentClass}` : ''}
                    {viewCardPass.studentDivision ? ` • Division ${viewCardPass.studentDivision}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 gap-1 shrink-0">
                <span className="text-xs text-slate-500 font-normal">
                  Pass Ref: <span className="font-medium text-slate-800">{viewCardPass.displayPassNumber}</span>
                </span>
                <Badge
                  variant={
                    viewCardPass.displayStatus === 'APPROVED' ? 'success' :
                    viewCardPass.displayStatus === 'ACTIVE' ? 'info' :
                    viewCardPass.displayStatus === 'COMPLETED' ? 'default' :
                    viewCardPass.displayStatus === 'REJECTED' ? 'danger' : 'warning'
                  }
                  size="md"
                >
                  {viewCardPass.displayStatus}
                </Badge>
              </div>
            </div>

            {/* Travel & Purpose Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-200/90 rounded-lg p-3.5 bg-white space-y-1 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">
                  Purpose of Leave
                </span>
                <p className="text-sm font-medium text-slate-800">
                  {viewCardPass.displayPurpose}
                </p>
              </div>

              <div className="border border-slate-200/90 rounded-lg p-3.5 bg-white space-y-1 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">
                  Destination
                </span>
                <p className="text-sm font-medium text-slate-800">
                  {viewCardPass.displayDestination}
                </p>
              </div>
            </div>

            {/* Schedule Timing Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg p-3.5 border border-amber-200 bg-amber-50/50 space-y-1">
                <span className="text-xs font-medium text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Scheduled Departure
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {viewCardPass.displayDeparture
                    ? new Date(viewCardPass.displayDeparture).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Scheduled'}
                </p>
              </div>

              <div className="rounded-lg p-3.5 border border-emerald-200 bg-emerald-50/50 space-y-1">
                <span className="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Expected Return
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {viewCardPass.displayReturn
                    ? new Date(viewCardPass.displayReturn).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Scheduled'}
                </p>
              </div>
            </div>

            {/* Guard Gate Log Records (if exited or returned) */}
            {(viewCardPass.gateExitAt || viewCardPass.actualReturnTime) && (
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-3.5 text-xs space-y-2">
                <span className="text-xs font-semibold text-slate-600 block">
                  Security Gate Verification Records
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                  {viewCardPass.gateExitAt && (
                    <div className="bg-white border border-slate-200 rounded-md px-3 py-2 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Recorded Exit:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(viewCardPass.gateExitAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  )}
                  {viewCardPass.actualReturnTime && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-md px-3 py-2 flex items-center justify-between text-emerald-900">
                      <span className="text-emerald-800 font-medium">Recorded Return:</span>
                      <span className="font-semibold text-emerald-950">
                        {new Date(viewCardPass.actualReturnTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Action */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setViewCardPass(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

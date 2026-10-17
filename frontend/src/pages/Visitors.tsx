import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorApi } from '../api/visitors';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/axios';
import { Visitor, HostType, ApiResponse, GuardSelfDashboardResponse } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { LogOut, Search, CheckCircle, Shield, FileText, Ticket, ArrowLeft, Clock, AlertTriangle, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

const VisitorAvatar: React.FC<{ photoUrl?: string; name: string }> = ({ photoUrl, name }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const getResolvedUrl = (url?: string) => {
    if (!url || typeof url !== 'string' || !url.trim()) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
  };

  const resolvedUrl = !imgError ? getResolvedUrl(photoUrl) : null;

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt=""
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500/30 flex-shrink-0 shadow-xs bg-slate-100"
      />
    );
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'V';

  return (
    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0 uppercase shadow-xs">
      {initials}
    </div>
  );
};

export const Visitors: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven query params for robust browser back/forward and refresh support
  const search = searchParams.get('q') || '';
  const hostTypeFilter = searchParams.get('hostType') || '';
  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const [checkoutVisitor, setCheckoutVisitor] = useState<Visitor | null>(null);
  const [detailVisitor, setDetailVisitor] = useState<Visitor | null>(null);

  const updateParam = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (!value) {
        updated.delete(key);
      } else {
        updated.set(key, value);
      }
      if (key !== 'page') {
        updated.delete('page');
      }
      return updated;
    });
  };

  // Query Visitors with backend pagination & filtering
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['visitors', page, search, hostTypeFilter, statusFilter],
    queryFn: () =>
      visitorApi.getVisitors({
        page,
        size: 10,
        query: search || undefined,
        hostType: hostTypeFilter ? (hostTypeFilter as HostType) : undefined,
        activeInside: statusFilter === 'ACTIVE' ? true : statusFilter === 'CHECKED_OUT' ? false : undefined,
        status: statusFilter === 'AUTO_CLOSED_EOD' ? 'AUTO_CLOSED_EOD' : undefined,
      }),
  });

  // Query Active Visitors Inside
  const { data: activeVisitors = [] } = useQuery({
    queryKey: ['visitors-active'],
    queryFn: visitorApi.getActiveInside,
  });

  // Query Guard Dashboard Metrics (for real-time daily entered count including auto-closed)
  const { data: guardSummary } = useQuery<GuardSelfDashboardResponse>({
    queryKey: ['guard-self-dashboard'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GuardSelfDashboardResponse>>('/dashboard/guard');
      return res.data.data;
    },
    refetchInterval: 3000,
  });

  // CheckOut Mutation
  const checkOutMutation = useMutation({
    mutationFn: visitorApi.checkOut,
    onSuccess: () => {
      toast.success('Visitor exit logged successfully!');
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitors-active'] });
      queryClient.invalidateQueries({ queryKey: ['active-visitors-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      setCheckoutVisitor(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-out failed');
    },
  });

  const { user } = useAuthStore();
  const isGuard = user?.role === 'SECURITY_GUARD' || user?.role === 'GUARD' || user?.role === 'SECURITY_OFFICER';

  const columns: Column<Visitor>[] = [
    {
      header: 'Visitor Details',
      render: (v) => (
        <div className="flex items-center gap-3">
          <VisitorAvatar photoUrl={v.photoUrl || v.photoPath} name={v.name} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-slate-900 text-xs sm:text-sm">{v.name}</p>
              {v.faceId && (
                <Badge variant="purple" className="text-[9px] py-0 px-1">
                  Face Enrolled
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">{v.mobile}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Pass # / ID',
      accessor: 'passNumber',
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
          {v.passNumber || `#${v.id}`}
        </span>
      ),
    },
    {
      header: 'Host & Department',
      render: (v) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{v.hostName}</p>
          <p className="text-[11px] text-slate-500">{v.hostDepartment} ({v.hostType})</p>
        </div>
      ),
    },
    {
      header: 'Purpose',
      render: (v) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-[150px]" title={v.purpose}>
          {v.purpose}
        </span>
      ),
    },
    {
      header: 'Visit Status',
      render: (v) => {
        if (v.status === 'AUTO_CLOSED_EOD') {
          return (
            <Badge variant="warning" icon={<Clock className="w-3 h-3 text-amber-600" />}>
              Auto-Closed (EOD)
            </Badge>
          );
        }
        if (v.status === 'PENDING') {
          return <Badge variant="warning">Pending Clearance</Badge>;
        }
        if (v.status === 'REJECTED') {
          return <Badge variant="danger">Access Denied</Badge>;
        }
        if (v.timeOut) {
          return (
            <Badge variant="default" icon={<CheckCircle className="w-3 h-3 text-slate-500" />}>
              Checked Out
            </Badge>
          );
        }
        return (
          <Badge variant="success" icon={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}>
            Active Inside
          </Badge>
        );
      },
    },
    {
      header: 'Check-In / Out',
      render: (v) => (
        <div className="text-xs font-mono">
          <p className="text-slate-800">In: {new Date(v.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          {v.timeOut ? (
            <p className="text-slate-500 text-[11px]">Out: {new Date(v.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          ) : v.status === 'AUTO_CLOSED_EOD' ? (
            <p className="text-amber-700 text-[11px] font-sans">EOD Auto-Closed</p>
          ) : (
            <p className="text-emerald-700 text-[11px] font-sans font-medium">On Campus</p>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (v) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailVisitor(v)}
            title="Inspect Visit Audit Details"
          >
            <FileText className="w-4 h-4 text-slate-600 hover:text-indigo-600" />
          </Button>

          {!v.timeOut && v.status !== 'AUTO_CLOSED_EOD' && isGuard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCheckoutVisitor(v)}
              className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Log Exit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Contextual Back Navigation & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/dashboard');
              }
            }}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            title="Return to previous page"
          >
            Back
          </Button>

          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Visitor Registers & Visit History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive audit log of campus visitor entries, verified exits, and automated end-of-day closures.
            </p>
          </div>
        </div>

        {/* Live Metrics Header Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Total Visitors Entered Today (includes checked out & auto-closed) */}
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg shadow-xs">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-950">
              Entered Today: <strong className="font-bold text-indigo-700">{guardSummary?.visitorsEnteredToday ?? pageData?.totalElements ?? 0}</strong>
            </span>
          </div>

          {/* Currently Inside Badge */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-xs">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-900">
              Currently Inside: <strong className="font-bold text-emerald-700">{activeVisitors.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar (State preserved in URL) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by visitor name, mobile, or pass #..."
            value={search}
            onChange={(e) => updateParam('q', e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-900"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => updateParam('status', e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Visit Statuses</option>
            <option value="ACTIVE">Active Inside Only</option>
            <option value="CHECKED_OUT">Checked Out & Completed</option>
            <option value="AUTO_CLOSED_EOD">Auto-Closed (EOD)</option>
          </select>

          {/* Host Category Filter */}
          <select
            value={hostTypeFilter}
            onChange={(e) => updateParam('hostType', e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Host Categories</option>
            <option value="FACULTY">Faculty / Teachers</option>
            <option value="HOD">Department HOD</option>
            <option value="ADMIN_STAFF">Admin Staff</option>
            <option value="STUDENT">Student Host</option>
            <option value="ALUMNI">Alumni</option>
            <option value="VENDOR">Vendor / Contractor</option>
          </select>

          {(search || hostTypeFilter || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchParams(new URLSearchParams())}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Visitor Record Table */}
      <DataTable
        columns={columns}
        data={pageData?.content || []}
        isLoading={isLoading}
        emptyTitle="No visitor records found"
        emptyDescription="No visit entries match your active search or category filters."
      />

      {pageData && pageData.totalPages > 1 && (
        <Pagination
          currentPage={pageData.page ?? pageData.pageNumber ?? page}
          totalPages={pageData.totalPages}
          totalElements={pageData.totalElements}
          pageSize={pageData.size ?? pageData.pageSize}
          onPageChange={(p) => updateParam('page', p.toString())}
        />
      )}

      {/* Detail Audit Drawer/Modal */}
      <Modal
        isOpen={!!detailVisitor}
        onClose={() => setDetailVisitor(null)}
        title="Visitor Identity & Access Audit Record"
        subtitle="Complete record details for security, compliance, and gate audit"
        maxWidth="lg"
      >
        {detailVisitor && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <VisitorAvatar photoUrl={detailVisitor.photoUrl || detailVisitor.photoPath} name={detailVisitor.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{detailVisitor.name}</h3>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded">
                    Pass #{detailVisitor.passNumber || detailVisitor.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Mobile: {detailVisitor.mobile}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-white border border-slate-200 rounded-lg p-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Host Person</span>
                <span className="font-semibold text-slate-800">{detailVisitor.hostName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Host Department & Role</span>
                <span className="font-semibold text-slate-800">{detailVisitor.hostDepartment} ({detailVisitor.hostType})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Visit Purpose</span>
                <span className="font-medium text-slate-800">{detailVisitor.purpose}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Vehicle Number</span>
                <span className="font-mono font-medium text-slate-800">{detailVisitor.vehicleNumber || 'Pedestrian (No Vehicle)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">ID Proof Type & No.</span>
                <span className="font-mono text-slate-800">{detailVisitor.idProofType}: {detailVisitor.idProofNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Campus Entry Timestamp</span>
                <span className="font-mono text-slate-800">{new Date(detailVisitor.timeIn).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Verified Exit Timestamp</span>
                <span className="font-mono text-slate-800">
                  {detailVisitor.timeOut ? new Date(detailVisitor.timeOut).toLocaleString() : 'Not Checked Out (Unverified)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Visit Status & Closure Info</span>
                {detailVisitor.status === 'AUTO_CLOSED_EOD' ? (
                  <span className="text-amber-800 font-semibold block">
                    Auto-Closed at EOD ({detailVisitor.closedAt ? new Date(detailVisitor.closedAt).toLocaleTimeString() : 'Campus Cutoff'})
                    <span className="block text-[10px] text-amber-600 font-normal">Reason: {detailVisitor.closureReason || 'END_OF_DAY_AUTO_CLOSURE'}</span>
                  </span>
                ) : detailVisitor.timeOut ? (
                  <span className="text-emerald-700 font-semibold">Verified Departure</span>
                ) : (
                  <span className="text-indigo-700 font-semibold">Active On Campus</span>
                )}
              </div>
            </div>

            {detailVisitor.notes && (
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                <span className="text-slate-400 block text-[11px] font-semibold mb-0.5">Guard / Audit Remarks:</span>
                <p className="text-slate-700 m-0">{detailVisitor.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setDetailVisitor(null)}>
                Close Audit View
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Check Out Modal */}
      <Modal
        isOpen={!!checkoutVisitor}
        onClose={() => setCheckoutVisitor(null)}
        title="Confirm Visitor Exit"
        subtitle="Log verified departure from campus terminal"
        maxWidth="sm"
      >
        {checkoutVisitor && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Confirm physical departure for <strong>{checkoutVisitor.name}</strong> (Pass #{checkoutVisitor.passNumber || checkoutVisitor.id})?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCheckoutVisitor(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={checkOutMutation.isPending}
                onClick={() => checkOutMutation.mutate({ visitorId: checkoutVisitor.id })}
              >
                Confirm Exit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

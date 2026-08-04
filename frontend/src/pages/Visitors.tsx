import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorApi } from '../api/visitors';
import { gateApi } from '../api/gates';
import { useAuthStore } from '../store/authStore';
import { Visitor, HostType, HostDepartment } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { UserPlus, LogOut, Search, QrCode, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const Visitors: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [hostTypeFilter, setHostTypeFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkoutVisitor, setCheckoutVisitor] = useState<Visitor | null>(null);
  const [qrVisitor, setQrVisitor] = useState<Visitor | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    purpose: '',
    hostName: '',
    hostType: 'FACULTY' as HostType,
    hostDepartment: 'CE' as HostDepartment,
    studentPrn: '',
    gateId: 1,
    vehicleNumber: '',
    idProofType: 'Aadhaar Card',
    idProofNumber: '',
    notes: '',
  });

  // Query Visitors with hostType filter support
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['visitors', page, search, hostTypeFilter],
    queryFn: () => visitorApi.getVisitors({
      page,
      size: 10,
      query: search || undefined,
      hostType: hostTypeFilter ? (hostTypeFilter as HostType) : undefined,
    }),
  });

  // Query Active Visitors Inside
  const { data: activeVisitors } = useQuery({
    queryKey: ['visitors-active'],
    queryFn: visitorApi.getActiveInside,
  });

  // Query Gates for selection
  const { data: gates } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gateApi.getAllGates(true),
  });

  // CheckIn Mutation
  const checkInMutation = useMutation({
    mutationFn: visitorApi.checkIn,
    onSuccess: (data) => {
      toast.success('Visitor checked in successfully!');
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitors-active'] });
      setIsCheckInOpen(false);
      setQrVisitor(data);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-in failed');
    },
  });

  // CheckOut Mutation
  const checkOutMutation = useMutation({
    mutationFn: visitorApi.checkOut,
    onSuccess: () => {
      toast.success('Visitor checked out successfully!');
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitors-active'] });
      setCheckoutVisitor(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-out failed');
    },
  });

  const { user } = useAuthStore();

  const columns: Column<Visitor>[] = [
    {
      header: 'Visitor',
      render: (v) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{v.name}</p>
          <p className="text-xs text-slate-400">{v.mobile}</p>
        </div>
      ),
    },
    {
      header: 'Pass #',
      accessor: 'passNumber',
      render: (v) => <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{v.passNumber || `#${v.id}`}</span>,
    },
    {
      header: 'Host & Dept',
      render: (v) => (
        <div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{v.hostName}</p>
          <p className="text-[11px] text-slate-400">{v.hostDepartment} ({v.hostType})</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (v) => (
        <Badge variant={v.timeOut ? 'default' : 'success'}>
          {v.timeOut ? 'Checked Out' : 'Active Inside'}
        </Badge>
      ),
    },
    {
      header: 'Check In Time',
      render: (v) => <span className="text-xs text-slate-500">{new Date(v.timeIn).toLocaleTimeString()}</span>,
    },
    {
      header: 'Actions',
      render: (v) => {
        const canCheckOut = user?.role === 'SECURITY_GUARD' || user?.role === 'GUARD' || user?.role === 'ADMIN' || user?.role === 'SECURITY_OFFICER';

        return (
          <div className="flex items-center gap-2">
            {v.qrCodeDataUrl && (
              <Button variant="ghost" size="sm" onClick={() => setQrVisitor(v)}>
                <QrCode className="w-4 h-4 text-indigo-600" />
              </Button>
            )}
            {!v.timeOut && canCheckOut && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckoutVisitor(v)}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Exit
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Visitor Management
          </h2>
          <p className="text-sm text-slate-500">
            Real-time visitor registration, QR digital pass generation, and checkout tracking.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsCheckInOpen(true)}
        >
          Check-In New Visitor
        </Button>
      </div>

      {/* Active Visitors Stat Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Active Visitors Inside</p>
              <h3 className="text-3xl font-extrabold mt-1">{activeVisitors?.length ?? 0}</h3>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-2xl">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Watchlist Auto-Check Enabled</h4>
            <p className="text-xs text-slate-500 mt-0.5">Every visitor is cross-referenced against the campus security blacklist upon check-in.</p>
          </div>
          <Badge variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}>Active</Badge>
        </Card>
      </div>

      {/* Search & Host Type Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search visitor by name, mobile, or pass #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Host Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Host Category:</span>
          <select
            value={hostTypeFilter}
            onChange={(e) => {
              setHostTypeFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Host Categories</option>
            <option value="FACULTY">Teachers / Faculty</option>
            <option value="HOD">Department HOD</option>
            <option value="ADMIN_STAFF">Admin Staff</option>
            <option value="STUDENT">Student Host</option>
            <option value="ALUMNI">Alumni</option>
            <option value="VENDOR">Vendor / Contractor</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={pageData?.content || []}
        isLoading={isLoading}
        emptyTitle="No visitors found"
        emptyDescription="Get started by clicking Check-In New Visitor."
      />

      {pageData && (
        <Pagination
          currentPage={pageData.pageNumber}
          totalPages={pageData.totalPages}
          totalElements={pageData.totalElements}
          pageSize={pageData.pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Check In Modal */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Check-In Visitor & Issue Digital Pass"
        subtitle="Registers visitor details and generates a QR pass"
        maxWidth="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkInMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Visitor Name"
              placeholder="Full Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Mobile Number"
              placeholder="10-digit mobile"
              required
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
            <Input
              label="Purpose of Visit"
              placeholder="Meeting, Inspection..."
              required
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />
            <Input
              label="Host Person Name"
              placeholder="Prof. Sharma / Admin Officer"
              required
              value={form.hostName}
              onChange={(e) => setForm({ ...form, hostName: e.target.value })}
            />

            <Select
              label="Host Category"
              value={form.hostType}
              onChange={(e) => setForm({ ...form, hostType: e.target.value as HostType })}
              options={[
                { label: 'Faculty / Professor', value: 'FACULTY' },
                { label: 'Head of Department (HOD)', value: 'HOD' },
                { label: 'Admin Staff', value: 'ADMIN_STAFF' },
                { label: 'Student', value: 'STUDENT' },
                { label: 'Alumni', value: 'ALUMNI' },
                { label: 'Vendor', value: 'VENDOR' },
                { label: 'Other', value: 'OTHER' },
              ]}
            />

            <Select
              label="Host Department"
              value={form.hostDepartment}
              onChange={(e) => setForm({ ...form, hostDepartment: e.target.value as HostDepartment })}
              options={[
                { label: 'Computer Engineering (CE)', value: 'CE' },
                { label: 'Information Technology (IT)', value: 'IT' },
                { label: 'Electronics & Telecomm (ENTC)', value: 'ENTC' },
                { label: 'Electronics & Computer (ECE)', value: 'ECE' },
                { label: 'AI & Data Science (AIDS)', value: 'AIDS' },
                { label: 'Administrative Office (ADMIN)', value: 'ADMIN' },
              ]}
            />

            <Select
              label="Gate"
              value={form.gateId}
              onChange={(e) => setForm({ ...form, gateId: Number(e.target.value) })}
              options={gates && gates.length > 0
                ? gates.map((g) => ({ label: g.name, value: g.id }))
                : [{ label: 'Gate 1 - Main Entrance', value: 1 }]}
            />

            <Input
              label="ID Proof Type"
              placeholder="Aadhaar / Driving License"
              required
              value={form.idProofType}
              onChange={(e) => setForm({ ...form, idProofType: e.target.value })}
            />
            <Input
              label="ID Proof Number"
              placeholder="ID Number"
              required
              value={form.idProofNumber}
              onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })}
            />
            <Input
              label="Vehicle Number (Optional)"
              placeholder="MH 12 AB 1234"
              value={form.vehicleNumber}
              onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsCheckInOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={checkInMutation.isPending}>
              Complete Check-In
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Pass Preview Modal */}
      <Modal
        isOpen={!!qrVisitor}
        onClose={() => setQrVisitor(null)}
        title="Visitor Digital Gate Pass & QR Code"
        subtitle="Present or scan this pass at campus security checkpoints"
        maxWidth="md"
      >
        {qrVisitor && (
          <div className="p-2 space-y-5">
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">PICT Digital Access Pass</span>
                  <h4 className="font-extrabold text-lg text-white">{qrVisitor.name}</h4>
                </div>
                <Badge variant="purple" className="font-mono text-xs">{qrVisitor.passNumber || `PICT-PASS-${qrVisitor.id}`}</Badge>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {qrVisitor.qrCodeDataUrl ? (
                  <div className="bg-white p-3 rounded-2xl shrink-0 shadow-lg">
                    <img src={qrVisitor.qrCodeDataUrl} alt="QR Digital Pass Code" className="w-40 h-40" />
                  </div>
                ) : (
                  <div className="p-8 bg-slate-800 rounded-2xl font-mono text-center font-bold text-indigo-400">
                    {qrVisitor.passNumber}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs w-full">
                  <div>
                    <p className="text-slate-400">Mobile</p>
                    <p className="font-semibold">{qrVisitor.mobile}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Visiting Host</p>
                    <p className="font-semibold text-indigo-300">{qrVisitor.hostName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Department</p>
                    <p className="font-semibold">{qrVisitor.hostDepartment}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Host Type</p>
                    <p className="font-semibold text-emerald-400">{qrVisitor.hostType || 'FACULTY'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Purpose</p>
                    <p className="font-semibold truncate">{qrVisitor.purpose}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <Badge variant={qrVisitor.timeOut ? 'default' : 'success'}>
                      {qrVisitor.timeOut ? 'Checked Out' : 'Active Inside'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="primary" className="w-full" onClick={() => setQrVisitor(null)}>
                Close Pass View
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
        subtitle="Log visitor checkout from campus"
        maxWidth="sm"
      >
        {checkoutVisitor && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to check out <strong>{checkoutVisitor.name}</strong> (Pass #{checkoutVisitor.passNumber})?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCheckoutVisitor(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={checkOutMutation.isPending}
                onClick={() => checkOutMutation.mutate({ visitorId: checkoutVisitor.id })}
              >
                Log Exit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

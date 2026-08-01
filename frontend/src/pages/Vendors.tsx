import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../api/vendors';
import { gateApi } from '../api/gates';
import { Vendor, VendorVisit } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Truck, Plus, ShieldAlert, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const Vendors: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'vendors' | 'visits'>('vendors');
  const [page, setPage] = useState(0);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [entryVendor, setEntryVendor] = useState<Vendor | null>(null);

  // Initial Form State
  const initialForm = {
    companyName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    assignedDepartment: 'Maintenance',
    workDescription: '',
  };

  const [form, setForm] = useState(initialForm);

  const [visitGateId, setVisitGateId] = useState(1);
  const [workerCount, setWorkerCount] = useState(1);
  const [visitPurpose, setVisitPurpose] = useState('');

  // Queries
  const { data: vendorPage, isLoading: loadingVendors } = useQuery({
    queryKey: ['vendors', page],
    queryFn: () => vendorApi.getVendors({ page, size: 10 }),
    enabled: activeTab === 'vendors',
  });

  const { data: visitPage, isLoading: loadingVisits } = useQuery({
    queryKey: ['vendor-visits', page],
    queryFn: () => vendorApi.getVisits({ page, size: 10 }),
    enabled: activeTab === 'visits',
  });

  const { data: gates } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gateApi.getAllGates(true),
  });

  // Mutations
  const registerMutation = useMutation({
    mutationFn: (formData: typeof form) => vendorApi.register({
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail || undefined,
      assignedDepartment: formData.assignedDepartment,
      workDescription: formData.workDescription || undefined,
    }),
    onSuccess: () => {
      toast.success('Vendor registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsRegisterOpen(false);
      setForm(initialForm);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).join(', ')
        : (err.response?.data?.message || 'Failed to register vendor');
      toast.error(msg);
    },
  });

  const entryMutation = useMutation({
    mutationFn: (data: { vendorId: number; payload: any }) =>
      vendorApi.recordEntry(data.vendorId, data.payload),
    onSuccess: () => {
      toast.success('Vendor visit logged!');
      queryClient.invalidateQueries({ queryKey: ['vendor-visits'] });
      setEntryVendor(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record entry');
    },
  });

  const exitMutation = useMutation({
    mutationFn: (visitId: number) => vendorApi.recordExit(visitId),
    onSuccess: () => {
      toast.success('Vendor exit logged!');
      queryClient.invalidateQueries({ queryKey: ['vendor-visits'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record exit');
    },
  });

  const vendorColumns: Column<Vendor>[] = [
    {
      header: 'Company / Vendor',
      render: (v) => (
        <div>
          <p className="font-extrabold text-slate-900 dark:text-slate-100">{v.companyName}</p>
          <p className="text-xs text-slate-400">{v.assignedDepartment || v.serviceType || 'Vendor'}</p>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      render: (v) => (
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{v.contactPerson}</p>
          <p className="text-[11px] text-slate-400">{v.contactPhone || v.phone}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (v) => (
        <Badge variant={v.isBlacklisted ? 'danger' : 'success'}>
          {v.isBlacklisted ? 'Blacklisted' : 'Approved'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (v) => (
        <Button variant="outline" size="sm" onClick={() => setEntryVendor(v)}>
          Log Visit Entry
        </Button>
      ),
    },
  ];

  const visitColumns: Column<VendorVisit>[] = [
    {
      header: 'Vendor',
      accessor: 'companyName',
    },
    {
      header: 'Gate',
      accessor: 'gateName',
    },
    {
      header: 'Workers',
      accessor: 'workerCount',
    },
    {
      header: 'Entry Time',
      render: (v) => <span className="text-xs text-slate-500">{new Date(v.entryTime).toLocaleString()}</span>,
    },
    {
      header: 'Status / Exit',
      render: (v) =>
        v.exitTime ? (
          <span className="text-xs text-slate-500">{new Date(v.exitTime).toLocaleString()}</span>
        ) : (
          <Button variant="outline" size="sm" onClick={() => exitMutation.mutate(v.id)} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
            Record Exit
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Vendor & Delivery Operations
          </h2>
          <p className="text-sm text-slate-500">Contractor registry, material delivery logs, and worker headcounts.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsRegisterOpen(true)}>
          Register Vendor
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('vendors'); setPage(0); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase border-b-2 ${
            activeTab === 'vendors' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          Approved Vendors
        </button>
        <button
          onClick={() => { setActiveTab('visits'); setPage(0); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase border-b-2 ${
            activeTab === 'visits' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          Visit & Work Logs
        </button>
      </div>

      {activeTab === 'vendors' ? (
        <DataTable columns={vendorColumns} data={vendorPage?.content || []} isLoading={loadingVendors} />
      ) : (
        <DataTable columns={visitColumns} data={visitPage?.content || []} isLoading={loadingVisits} />
      )}

      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register Vendor/Contractor">
        <form onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(form); }} className="space-y-4">
          <Input label="Company Name" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <Input label="Contact Person" required value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <Input label="Contact Phone" required placeholder="10-15 digits" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          <Input label="Department" value={form.assignedDepartment} onChange={(e) => setForm({ ...form, assignedDepartment: e.target.value })} />
          <Input label="Work Description" value={form.workDescription} onChange={(e) => setForm({ ...form, workDescription: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={registerMutation.isPending}>Save Vendor</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!entryVendor} onClose={() => setEntryVendor(null)} title="Log Vendor Campus Entry" maxWidth="sm">
        <div className="space-y-4">
          <Input label="Purpose of Visit" placeholder="Maintenance, Material..." value={visitPurpose} onChange={(e) => setVisitPurpose(e.target.value)} />
          <Input label="Worker Count" type="number" min={1} value={workerCount} onChange={(e) => setWorkerCount(Number(e.target.value))} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEntryVendor(null)}>Cancel</Button>
            <Button
              variant="primary"
              isLoading={entryMutation.isPending}
              onClick={() => entryVendor && entryMutation.mutate({ vendorId: entryVendor.id, payload: { gateId: visitGateId, workerCount, purpose: visitPurpose } })}
            >
              Confirm Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

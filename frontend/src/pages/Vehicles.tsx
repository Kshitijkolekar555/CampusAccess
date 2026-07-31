import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleApi } from '../api/vehicles';
import { gateApi } from '../api/gates';
import { Vehicle, VehicleLog, VehicleCategory } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Car, Plus, ShieldAlert, ShieldCheck, LogOut, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

export const Vehicles: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'registered' | 'logs'>('registered');
  const [page, setPage] = useState(0);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [entryVehicle, setEntryVehicle] = useState<Vehicle | null>(null);
  const [blacklistVehicle, setBlacklistVehicle] = useState<Vehicle | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');

  // Form State
  const [form, setForm] = useState({
    registrationNumber: '',
    vehicleType: 'Car',
    category: 'STUDENT' as VehicleCategory,
    ownerName: '',
    ownerContact: '',
    color: '',
  });

  // Entry Form State
  const [entryGateId, setEntryGateId] = useState(1);
  const [driverName, setDriverName] = useState('');

  // Queries
  const { data: vehiclePage, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles', page],
    queryFn: () => vehicleApi.getVehicles({ page, size: 10 }),
    enabled: activeTab === 'registered',
  });

  const { data: logsPage, isLoading: loadingLogs } = useQuery({
    queryKey: ['vehicle-logs', page],
    queryFn: () => vehicleApi.getVehicleLogs({ page, size: 10 }),
    enabled: activeTab === 'logs',
  });

  const { data: gates } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gateApi.getAllGates(true),
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: vehicleApi.register,
    onSuccess: () => {
      toast.success('Vehicle registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsRegisterOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Registration failed');
    },
  });

  // Entry Mutation
  const entryMutation = useMutation({
    mutationFn: (data: { vehicleId: number; payload: any }) =>
      vehicleApi.recordEntry(data.vehicleId, data.payload),
    onSuccess: () => {
      toast.success('Vehicle entry logged!');
      queryClient.invalidateQueries({ queryKey: ['vehicle-logs'] });
      setEntryVehicle(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Entry log failed');
    },
  });

  // Exit Mutation
  const exitMutation = useMutation({
    mutationFn: (logId: number) => vehicleApi.recordExit(logId),
    onSuccess: () => {
      toast.success('Vehicle exit logged!');
      queryClient.invalidateQueries({ queryKey: ['vehicle-logs'] });
    },
  });

  // Blacklist Mutation
  const blacklistMutation = useMutation({
    mutationFn: (id: number) => vehicleApi.blacklist(id, blacklistReason),
    onSuccess: () => {
      toast.success('Vehicle blacklisted!');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setBlacklistVehicle(null);
    },
  });

  const vehicleColumns: Column<Vehicle>[] = [
    {
      header: 'Registration',
      render: (v) => (
        <div>
          <p className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">{v.registrationNumber}</p>
          <p className="text-xs text-slate-400">{v.vehicleType} ({v.color})</p>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (v) => <Badge variant="purple">{v.category}</Badge>,
    },
    {
      header: 'Owner',
      render: (v) => (
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{v.ownerName || 'N/A'}</p>
          <p className="text-[11px] text-slate-400">{v.ownerContact}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (v) => (
        <Badge variant={v.isBlacklisted ? 'danger' : 'success'}>
          {v.isBlacklisted ? 'Blacklisted' : 'Allowed'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (v) => (
        <div className="flex items-center gap-2">
          {!v.isBlacklisted && (
            <Button variant="outline" size="sm" onClick={() => setEntryVehicle(v)}>
              Record Entry
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBlacklistVehicle(v)}
            className="text-rose-500 hover:text-rose-600"
          >
            <ShieldAlert className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const logColumns: Column<VehicleLog>[] = [
    {
      header: 'Registration',
      accessor: 'registrationNumber',
      render: (l) => <span className="font-mono font-bold">{l.registrationNumber}</span>,
    },
    {
      header: 'Gate',
      accessor: 'gateName',
    },
    {
      header: 'Entry Time',
      render: (l) => <span className="text-xs text-slate-500">{new Date(l.entryTime).toLocaleString()}</span>,
    },
    {
      header: 'Exit Time',
      render: (l) =>
        l.exitTime ? (
          <span className="text-xs text-slate-500">{new Date(l.exitTime).toLocaleString()}</span>
        ) : (
          <Badge variant="warning">Inside Campus</Badge>
        ),
    },
    {
      header: 'Actions',
      render: (l) =>
        !l.exitTime && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exitMutation.mutate(l.id)}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Record Exit
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Vehicle & ANPR Management
          </h2>
          <p className="text-sm text-slate-500">Vehicle registration, gate access logs, and security blacklisting.</p>
        </div>

        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsRegisterOpen(true)}>
          Register Vehicle
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('registered'); setPage(0); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'registered'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Registered Vehicles
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setPage(0); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Gate Entry/Exit Logs
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'registered' ? (
        <>
          <DataTable columns={vehicleColumns} data={vehiclePage?.content || []} isLoading={loadingVehicles} />
          {vehiclePage && (
            <Pagination
              currentPage={vehiclePage.pageNumber}
              totalPages={vehiclePage.totalPages}
              totalElements={vehiclePage.totalElements}
              pageSize={vehiclePage.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <>
          <DataTable columns={logColumns} data={logsPage?.content || []} isLoading={loadingLogs} />
          {logsPage && (
            <Pagination
              currentPage={logsPage.pageNumber}
              totalPages={logsPage.totalPages}
              totalElements={logsPage.totalElements}
              pageSize={logsPage.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Register Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Campus Vehicle"
        subtitle="Adds a vehicle to authorized database"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <Input
            label="Registration Number"
            placeholder="e.g. MH12AB1234"
            required
            value={form.registrationNumber}
            onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Owner Name"
              placeholder="Full Name"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
            <Input
              label="Owner Contact"
              placeholder="Mobile Number"
              value={form.ownerContact}
              onChange={(e) => setForm({ ...form, ownerContact: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={registerMutation.isPending}>Register</Button>
          </div>
        </form>
      </Modal>

      {/* Record Entry Modal */}
      <Modal
        isOpen={!!entryVehicle}
        onClose={() => setEntryVehicle(null)}
        title="Record Vehicle Gate Entry"
        subtitle={`Vehicle: ${entryVehicle?.registrationNumber}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Gate</label>
            <select
              className="w-full p-2.5 border rounded-xl text-sm"
              value={entryGateId}
              onChange={(e) => setEntryGateId(Number(e.target.value))}
            >
              {gates?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <Input label="Driver Name (Optional)" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEntryVehicle(null)}>Cancel</Button>
            <Button
              variant="primary"
              isLoading={entryMutation.isPending}
              onClick={() =>
                entryVehicle &&
                entryMutation.mutate({
                  vehicleId: entryVehicle.id,
                  payload: { gateId: entryGateId, driverName },
                })
              }
            >
              Log Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Blacklist Modal */}
      <Modal
        isOpen={!!blacklistVehicle}
        onClose={() => setBlacklistVehicle(null)}
        title="Blacklist Vehicle"
        subtitle={`Vehicle: ${blacklistVehicle?.registrationNumber}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Blacklist Reason"
            placeholder="Security violation..."
            value={blacklistReason}
            onChange={(e) => setBlacklistReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBlacklistVehicle(null)}>Cancel</Button>
            <Button
              variant="danger"
              isLoading={blacklistMutation.isPending}
              onClick={() => blacklistVehicle && blacklistMutation.mutate(blacklistVehicle.id)}
            >
              Blacklist
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

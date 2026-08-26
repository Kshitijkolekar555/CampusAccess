import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guardApi } from '../api/guards';
import { gateApi } from '../api/gates';
import { Shift, ShiftLog } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Clock, Play, Square, PlusCircle, Activity, Shield, DoorClosed, History, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const Shifts: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedGateId, setSelectedGateId] = useState(1);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logDescription, setLogDescription] = useState('');
  const [logType, setLogType] = useState('GENERAL');

  // Local Storage state fallback for instantaneous shift history sync
  const [localHistory, setLocalHistory] = useState<Shift[]>(() => {
    try {
      const saved = localStorage.getItem('campus_access_shift_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveToLocalHistory = (shift: Shift) => {
    setLocalHistory((prev) => {
      const filtered = prev.filter((s) => s.id !== shift.id);
      const updated = [shift, ...filtered];
      try {
        localStorage.setItem('campus_access_shift_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Query Current Active Shift
  const { data: currentShift, isLoading: loadingShift } = useQuery({
    queryKey: ['current-shift'],
    queryFn: guardApi.getCurrentShift,
    retry: false,
  });

  // Sync current active shift to local history if present
  useEffect(() => {
    if (currentShift) {
      saveToLocalHistory(currentShift);
    }
  }, [currentShift]);

  // Query Shift Logs
  const { data: logsPage } = useQuery({
    queryKey: ['shift-logs', currentShift?.id],
    queryFn: () => guardApi.getShiftLogs(currentShift!.id),
    enabled: !!currentShift?.id,
    retry: false,
  });

  // Query Shift History from Backend API
  const { data: shiftHistory } = useQuery({
    queryKey: ['shift-history'],
    queryFn: () => guardApi.getShiftHistory({ page: 0, size: 20 }),
    retry: false,
  });

  const combinedHistory = React.useMemo(() => {
    const backendItems = shiftHistory?.content || [];
    const map = new Map<number | string, Shift>();
    localHistory.forEach((item) => {
      if (item.id) map.set(item.id, item);
    });
    backendItems.forEach((item) => {
      if (item.id) map.set(item.id, item);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [localHistory, shiftHistory]);

  const { data: gates } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gateApi.getAllGates(true),
    retry: false,
  });

  // Start Shift Mutation
  const startMutation = useMutation({
    mutationFn: () => guardApi.startShift({ gateId: selectedGateId }),
    onSuccess: (newShift) => {
      toast.success('Duty shift started!');
      if (newShift) {
        saveToLocalHistory(newShift);
      }
      queryClient.setQueryData(['current-shift'], newShift);
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shift-history'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start shift');
    },
  });

  // End Shift Mutation
  const endMutation = useMutation({
    mutationFn: guardApi.endShift,
    onSuccess: (endedShift) => {
      toast.success('Duty shift completed!');
      if (endedShift) {
        saveToLocalHistory(endedShift);
      } else if (currentShift) {
        saveToLocalHistory({
          ...currentShift,
          endTime: new Date().toISOString(),
          status: 'COMPLETED' as any,
        });
      }
      queryClient.setQueryData(['current-shift'], null);
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shift-history'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to end shift');
    },
  });

  // Add Shift Log Mutation
  const addLogMutation = useMutation({
    mutationFn: () => guardApi.addShiftLog(currentShift!.id, { description: logDescription, logType }),
    onSuccess: () => {
      toast.success('Shift activity logged!');
      queryClient.invalidateQueries({ queryKey: ['shift-logs'] });
      setIsLogModalOpen(false);
      setLogDescription('');
    },
  });

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Duty Shifts
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Clock in/out duty shifts at campus gates and record real-time security logs.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Duty Status</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {currentShift ? 'ON DUTY' : 'OFF DUTY'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentShift ? currentShift.gateName : 'No active shift'}
            </p>
          </div>
          <div className={`w-10 h-10 rounded flex items-center justify-center ${currentShift ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Assigned Gate</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {currentShift ? currentShift.gateName : 'Main Gate'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Primary Entry Checkpoint</p>
          </div>
          <div className="w-10 h-10 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <DoorClosed className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Shifts Logged</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {combinedHistory.length}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Total shift history records</p>
          </div>
          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Shift Status Panel - Clean Banner aligned with CampusAccess Theme */}
      <div className="bg-[#0f172a] text-white border border-slate-800 rounded-md p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Badge variant={currentShift ? 'success' : 'info'}>
                {currentShift ? 'SHIFT ONGOING' : 'NO ACTIVE SHIFT'}
              </Badge>
              {currentShift && (
                <span className="font-mono text-xs text-slate-400">
                  Started: {new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              {currentShift ? `Duty Active at ${currentShift.gateName}` : 'Clock In for Security Shift'}
            </h3>

            <p className="text-xs text-slate-400 max-w-lg">
              {currentShift
                ? 'Your shift is active. Record gate activities, routine rounds, or security logs below.'
                : 'Select your assigned campus entrance gate to begin your active duty shift.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {!currentShift ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Select Gate:
                  </label>
                  <select
                    className="bg-white text-slate-900 border border-slate-300 rounded px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                    value={selectedGateId}
                    onChange={(e) => setSelectedGateId(Number(e.target.value))}
                  >
                    {gates && gates.length > 0 ? (
                      gates.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Main Entrance Gate</option>
                        <option value={2}>Back Gate</option>
                        <option value={3}>Hostel Gate</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => startMutation.mutate()}
                    disabled={startMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded transition shadow-xs flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    Start Shift
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded transition shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  Log Activity
                </button>
                <button
                  onClick={() => endMutation.mutate()}
                  disabled={endMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-4 py-2.5 rounded transition shadow-xs flex items-center gap-1.5"
                >
                  <Square className="w-4 h-4" />
                  End Shift
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shift Logs Feed */}
      {currentShift && (
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Activity Log — Current Shift
            </h3>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded transition"
            >
              + Add Entry
            </button>
          </div>

          {logsPage?.content && logsPage.content.length > 0 ? (
            <div className="space-y-3">
              {logsPage.content.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.logType === 'INCIDENT' ? 'danger' : 'info'}>{log.logType}</Badge>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800">{log.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No activity entries logged yet for this shift.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click '+ Add Entry' to record routine rounds or incidents.</p>
            </div>
          )}
        </div>
      )}

      {/* Shift History Log Table */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            Shift History
          </h3>
        </div>

        {combinedHistory && combinedHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Gate</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Start Time</th>
                  <th className="py-2.5 px-3">End Time</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {combinedHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">{s.gateName}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">{s.date}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">
                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">
                      {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={s.status === 'ONGOING' ? 'success' : 'info'}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded border border-dashed border-slate-200">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No previous shift records found.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Start a new duty shift above to log gate activity history.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Add Shift Activity Entry" maxWidth="sm">
        <div className="space-y-4">
          <Select
            label="Log Type"
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            options={[
              { label: 'GENERAL', value: 'GENERAL' },
              { label: 'INCIDENT', value: 'INCIDENT' },
              { label: 'CHECK_ROUNDS', value: 'CHECK_ROUNDS' },
              { label: 'HANDOVER', value: 'HANDOVER' },
            ]}
          />
          <Input
            label="Activity Description"
            placeholder="Routine perimeter check completed..."
            required
            value={logDescription}
            onChange={(e) => setLogDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
            <Button variant="primary" isLoading={addLogMutation.isPending} onClick={() => addLogMutation.mutate()}>
              Save Log Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

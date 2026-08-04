import React, { useState } from 'react';
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
import { Clock, Play, Square, PlusCircle, Activity, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const Shifts: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedGateId, setSelectedGateId] = useState(1);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logDescription, setLogDescription] = useState('');
  const [logType, setLogType] = useState('GENERAL');

  // Query Current Active Shift
  const { data: currentShift, isLoading: loadingShift } = useQuery({
    queryKey: ['current-shift'],
    queryFn: guardApi.getCurrentShift,
  });

  // Query Shift Logs
  const { data: logsPage } = useQuery({
    queryKey: ['shift-logs', currentShift?.id],
    queryFn: () => guardApi.getShiftLogs(currentShift!.id),
    enabled: !!currentShift?.id,
  });

  const { data: gates } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gateApi.getAllGates(true),
  });

  // Start Shift Mutation
  const startMutation = useMutation({
    mutationFn: () => guardApi.startShift({ gateId: selectedGateId }),
    onSuccess: () => {
      toast.success('Duty shift started!');
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start shift');
    },
  });

  // End Shift Mutation
  const endMutation = useMutation({
    mutationFn: guardApi.endShift,
    onSuccess: () => {
      toast.success('Duty shift completed!');
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Guard Shift Terminal & Activity Logging
        </h2>
        <p className="text-sm text-slate-500">Clock in/out duty shifts at campus gates and record real-time security logs.</p>
      </div>

      {/* Shift Status Panel */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant={currentShift ? 'success' : 'default'}>
                {currentShift ? 'SHIFT ONGOING' : 'NO ACTIVE SHIFT'}
              </Badge>
              {currentShift && <span className="text-xs text-slate-400 font-mono">Started: {new Date(currentShift.startTime).toLocaleTimeString()}</span>}
            </div>

            <h3 className="text-2xl font-bold">
              {currentShift ? `Duty Active at ${currentShift.gateName}` : 'Clock In for Security Shift'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              {currentShift
                ? 'Your shift is currently active. Record any gate activities, incidents, or routine inspection checks below.'
                : 'Select your assigned gate entrance below to start your active duty shift.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {!currentShift ? (
              <div className="flex items-center gap-3">
                <select
                  className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none"
                  value={selectedGateId}
                  onChange={(e) => setSelectedGateId(Number(e.target.value))}
                >
                  {gates?.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="success"
                  size="lg"
                  isLoading={startMutation.isPending}
                  onClick={() => startMutation.mutate()}
                  leftIcon={<Play className="w-4 h-4" />}
                >
                  Start Shift
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsLogModalOpen(true)}
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  Log Activity
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  isLoading={endMutation.isPending}
                  onClick={() => endMutation.mutate()}
                  leftIcon={<Square className="w-4 h-4" />}
                >
                  End Shift
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Shift Logs Feed */}
      {currentShift && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Activity Log Stream for Current Shift
            </h3>
            <Button variant="outline" size="sm" onClick={() => setIsLogModalOpen(true)}>
              + Add Entry
            </Button>
          </div>

          {logsPage?.content && logsPage.content.length > 0 ? (
            <div className="space-y-4">
              {logsPage.content.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.logType === 'INCIDENT' ? 'danger' : 'info'}>{log.logType}</Badge>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{log.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No activity entries logged yet for this shift.</p>
          )}
        </Card>
      )}

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
          <div className="flex justify-end gap-3 pt-2">
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

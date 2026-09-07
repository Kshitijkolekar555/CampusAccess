import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyApi } from '../../api/faculty';
import { useAuthStore } from '../../store/authStore';
import { FacultyAvailabilityStatus } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Calendar, Clock, Edit, History, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const FacultyAvailabilityPanel: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const facultyId = user?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [status, setStatus] = useState<FacultyAvailabilityStatus>('AVAILABLE');
  const [note, setNote] = useState('');

  // Fetch today's availability
  const { data: currentAvailability, isLoading } = useQuery({
    queryKey: ['faculty-availability', facultyId, todayStr],
    queryFn: () => facultyId ? facultyApi.getAvailability(facultyId, todayStr) : null,
    enabled: !!facultyId,
  });

  // Fetch history
  const { data: historyList } = useQuery({
    queryKey: ['faculty-availability-history', facultyId],
    queryFn: () => facultyId ? facultyApi.getHistory(facultyId) : [],
    enabled: !!facultyId && showHistory,
  });

  // Mutation to update
  const updateMutation = useMutation({
    mutationFn: (data: { availabilityDate: string; status: FacultyAvailabilityStatus; note?: string }) => {
      if (!facultyId) throw new Error('User not identified');
      return facultyApi.setAvailability(facultyId, data);
    },
    onSuccess: () => {
      toast.success('Availability status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['faculty-availability'] });
      queryClient.invalidateQueries({ queryKey: ['faculty-availability-history'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update availability');
    },
  });

  const handleOpenModal = () => {
    setSelectedDate(todayStr);
    if (currentAvailability) {
      setStatus(currentAvailability.status);
      setNote(currentAvailability.note || '');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      availabilityDate: selectedDate,
      status,
      note: note.trim() || undefined,
    });
  };

  const getStatusBadgeVariant = (st?: FacultyAvailabilityStatus) => {
    switch (st) {
      case 'AVAILABLE':
        return 'success';
      case 'BUSY':
        return 'warning';
      case 'HALF_DAY_LEAVE':
      case 'FULL_DAY_LEAVE':
        return 'danger';
      case 'OUT_OF_CAMPUS':
        return 'default';
      default:
        return 'info';
    }
  };

  const formatStatus = (st?: string) => {
    if (!st) return 'Available';
    return st.replace(/_/g, ' ');
  };

  return (
    <Card className="p-6 mb-8 border border-indigo-100 dark:border-slate-800 shadow-sm bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Availability Status</h2>
              <Badge variant={getStatusBadgeVariant(currentAvailability?.status)} className="text-sm px-3 py-1 font-semibold uppercase tracking-wider">
                {isLoading ? 'Checking...' : formatStatus(currentAvailability?.status)}
              </Badge>
            </div>
            <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
              {currentAvailability?.note ? (
                <span className="italic font-medium text-slate-700 dark:text-slate-300">"{currentAvailability.note}"</span>
              ) : (
                'Visitors will see your real-time status before requesting meetings.'
              )}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            {showHistory ? 'Hide History' : 'View History'}
          </Button>
          <Button
            size="sm"
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Edit className="w-4 h-4" />
            Update Status
          </Button>
        </div>
      </div>

      {/* History Collapsible Table */}
      {showHistory && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Availability Audit History</h3>
          {historyList && historyList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-2">Date</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Note</th>
                    <th className="py-2">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyList.map((h) => (
                    <tr key={h.id} className="text-slate-600 dark:text-slate-300">
                      <td className="py-2.5 font-medium">{h.availabilityDate}</td>
                      <td className="py-2.5">
                        <Badge variant={getStatusBadgeVariant(h.status)} size="sm">
                          {formatStatus(h.status)}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-xs text-slate-500">{h.note || '—'}</td>
                      <td className="py-2.5 text-xs text-slate-400">
                        {h.createdAt ? new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-2">No availability history recorded yet.</p>
          )}
        </div>
      )}

      {/* Update Availability Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update Availability Status"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Availability Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as FacultyAvailabilityStatus)}
              options={[
                { value: 'AVAILABLE', label: 'Available (Ready for visitor meetings)' },
                { value: 'BUSY', label: 'Busy (In class, lab, or academic duty)' },
                { value: 'HALF_DAY_LEAVE', label: 'Half Day Leave' },
                { value: 'FULL_DAY_LEAVE', label: 'Full Day Leave' },
                { value: 'OUT_OF_CAMPUS', label: 'Out of Campus (Official visit / off-duty)' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Note for Visitors & Security (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. In Computer Lab 3 until 3:30 PM, available after 4 PM"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Availability
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

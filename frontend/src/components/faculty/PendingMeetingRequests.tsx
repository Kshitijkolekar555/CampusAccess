import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingRequestsApi } from '../../api/meetingRequests';
import { VisitorMeetingRequest } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Check, X, Calendar, Clock, MapPin, User, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const PendingMeetingRequests: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedRequest, setSelectedRequest] = useState<VisitorMeetingRequest | null>(null);
  const [modalType, setModalType] = useState<'APPROVE' | 'REJECT' | 'RESCHEDULE' | null>(null);

  // Approve form
  const [meetingLocation, setMeetingLocation] = useState('CE Department - Staff Room');
  const [building, setBuilding] = useState('Main Academic Block');
  const [floor, setFloor] = useState('2nd Floor');
  const [roomNumber, setRoomNumber] = useState('Room 204');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Reject form
  const [rejectionReason, setRejectionReason] = useState('');

  // Reschedule form
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [suggestedDate, setSuggestedDate] = useState(tomorrowStr);
  const [suggestedTime, setSuggestedTime] = useState('11:00');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Real-time polling every 5s for pending requests
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['faculty-pending-requests'],
    queryFn: () => meetingRequestsApi.getPendingForFaculty({ page: 0, size: 20 }),
    refetchInterval: 5000,
  });

  const pendingList = pageData?.content || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => meetingRequestsApi.approve(id, data),
    onSuccess: () => {
      toast.success('Meeting request approved!');
      queryClient.invalidateQueries({ queryKey: ['faculty-pending-requests'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => meetingRequestsApi.reject(id, data),
    onSuccess: () => {
      toast.success('Meeting request rejected');
      queryClient.invalidateQueries({ queryKey: ['faculty-pending-requests'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    },
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => meetingRequestsApi.reschedule(id, data),
    onSuccess: () => {
      toast.success('Meeting request rescheduled');
      queryClient.invalidateQueries({ queryKey: ['faculty-pending-requests'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reschedule request');
    },
  });

  const handleOpenApprove = (req: VisitorMeetingRequest) => {
    setSelectedRequest(req);
    setMeetingLocation('Main Building - Faculty Cabin');
    setBuilding('Main Academic Block');
    setFloor('2nd Floor');
    setRoomNumber('Cabin 12');
    setApprovalNotes('Please meet at the department reception');
    setModalType('APPROVE');
  };

  const handleOpenReject = (req: VisitorMeetingRequest) => {
    setSelectedRequest(req);
    setRejectionReason('');
    setModalType('REJECT');
  };

  const handleOpenReschedule = (req: VisitorMeetingRequest) => {
    setSelectedRequest(req);
    setSuggestedDate(tomorrowStr);
    setSuggestedTime('11:00');
    setRescheduleReason('Busy with scheduled lectures today. Available tomorrow.');
    setModalType('RESCHEDULE');
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setModalType(null);
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      data: {
        meetingLocation,
        building,
        floor,
        roomNumber,
        notes: approvalNotes,
      },
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectMutation.mutate({
      id: selectedRequest.id,
      data: { reason: rejectionReason.trim() },
    });
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!rescheduleReason.trim()) {
      toast.error('Please provide a reason for rescheduling');
      return;
    }
    rescheduleMutation.mutate({
      id: selectedRequest.id,
      data: {
        suggestedDate,
        suggestedTime: suggestedTime.length === 5 ? `${suggestedTime}:00` : suggestedTime,
        reason: rescheduleReason.trim(),
      },
    });
  };

  return (
    <Card className="p-6 mb-8 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Visitor Meeting Requests</h2>
            <Badge variant="warning" className="font-semibold text-xs px-2.5 py-0.5">
              {pendingList.length} Pending
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review, approve with venue instructions, reject, or reschedule visitor meeting requests in real-time.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-400">Loading meeting requests...</div>
      ) : pendingList.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">All caught up!</h4>
          <p className="text-xs text-slate-400 mt-1">No pending visitor meeting requests awaiting your review.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Visitor Details</th>
                <th className="py-3 px-3">Purpose & ID</th>
                <th className="py-3 px-3">Gate & Time</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingList.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {req.visitorName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{req.visitorName}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Phone className="w-3 h-3" />
                          <span>{req.visitorMobile}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      "{req.visitorPurpose}"
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {req.visitorIdProofType}: <span className="font-mono">{req.visitorIdProofNumber}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {req.gateName || `Gate #${req.gateId}`}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(req.requestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenApprove(req)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-xs h-8 px-2.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReschedule(req)}
                        className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-1 text-xs h-8 px-2.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReject(req)}
                        className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1 text-xs h-8 px-2.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* APPROVE MODAL */}
      <Modal
        isOpen={modalType === 'APPROVE'}
        onClose={handleCloseModal}
        title={`Approve Meeting — ${selectedRequest?.visitorName}`}
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Specify where and how the visitor should meet you. Security watchman and visitor will receive these details immediately.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Meeting Location / Venue *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Main Academic Block - Faculty Room 204"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Building
              </label>
              <Input
                type="text"
                placeholder="Main Block"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Floor
              </label>
              <Input
                type="text"
                placeholder="2nd Floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Room No.
              </label>
              <Input
                type="text"
                placeholder="Cabin 12"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Instructions for Visitor / Security
            </label>
            <Input
              type="text"
              placeholder="e.g. Please wait in the department lobby, I will arrive shortly."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm & Allow Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        isOpen={modalType === 'REJECT'}
        onClose={handleCloseModal}
        title={`Reject Meeting — ${selectedRequest?.visitorName}`}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Reason for Rejection *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Currently in confidential department meeting; unable to meet today."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={rejectMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESCHEDULE MODAL */}
      <Modal
        isOpen={modalType === 'RESCHEDULE'}
        onClose={handleCloseModal}
        title={`Reschedule Meeting — ${selectedRequest?.visitorName}`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Proposed Date *
              </label>
              <Input
                type="date"
                required
                value={suggestedDate}
                onChange={(e) => setSuggestedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Proposed Time *
              </label>
              <Input
                type="time"
                required
                value={suggestedTime}
                onChange={(e) => setSuggestedTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Reason / Remarks for Rescheduling *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Today's schedule is fully booked with lab sessions."
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={rescheduleMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Send Reschedule Proposal
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

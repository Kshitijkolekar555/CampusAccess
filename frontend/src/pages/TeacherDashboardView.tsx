import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { visitorApi } from '../api/visitors';
import { Visitor } from '../types';
import {
  Users,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Clock,
  Calendar,
  Building,
  Phone,
  Search,
  RefreshCw,
  LogOut,
  Send,
  X,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const TeacherDashboardView: React.FC = () => {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [filterPeriod, setFilterPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');

  // 1-Click clearance note modal state
  const [clearanceModal, setClearanceModal] = useState<{
    isOpen: boolean;
    visitor: Visitor | null;
    action: 'APPROVE' | 'DENY';
    notes: string;
    roomNumber: string;
  }>({
    isOpen: false,
    visitor: null,
    action: 'APPROVE',
    notes: '',
    roomNumber: '',
  });

  // Pre-approved invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteMobile, setInviteMobile] = useState('');
  const [inviteDate, setInviteDate] = useState(new Date().toISOString().slice(0, 10));
  const [invitePurpose, setInvitePurpose] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Real-time pending visitor requests awaiting approval (polling every 3s)
  const { data: allPendingTokens = [], isLoading: isPendingLoading, refetch: refetchPending } = useQuery<Visitor[]>({
    queryKey: ['teacher-pending-visitors'],
    queryFn: async () => {
      try {
        return await visitorApi.getPendingTokens();
      } catch {
        return [];
      }
    },
    refetchInterval: 3000,
  });

  // Filter pending tokens specifically for this faculty/staff or department
  const facultyName = (user?.fullName || '').toLowerCase().trim();
  const pendingVisitors = allPendingTokens.filter((v) => {
    if (!v.hostName) return true;
    const vHost = v.hostName.toLowerCase().trim();
    return (
      vHost === facultyName ||
      facultyName.includes(vHost) ||
      vHost.includes(facultyName) ||
      vHost.includes(user?.username || '')
    );
  });

  // Active visitors currently inside campus
  const { data: activeInsideVisitors = [], isLoading: isActiveLoading } = useQuery<Visitor[]>({
    queryKey: ['teacher-active-visitors'],
    queryFn: async () => {
      try {
        return await visitorApi.getActiveInside();
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const myActiveInside = activeInsideVisitors.filter((v) => {
    if (!v.hostName) return false;
    const vHost = v.hostName.toLowerCase().trim();
    return vHost === facultyName || facultyName.includes(vHost) || vHost.includes(facultyName);
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => visitorApi.approveToken(id),
    onSuccess: (data) => {
      toast.success(`Entry approved for ${data.name}! Campus security gate notified.`);
      queryClient.invalidateQueries({ queryKey: ['teacher-pending-visitors'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-active-visitors'] });
      setClearanceModal({ isOpen: false, visitor: null, action: 'APPROVE', notes: '', roomNumber: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to approve visitor');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (id: number) => visitorApi.rejectToken(id),
    onSuccess: (data) => {
      toast.info(`Access denied for ${data.name}. Security gate updated.`);
      queryClient.invalidateQueries({ queryKey: ['teacher-pending-visitors'] });
      setClearanceModal({ isOpen: false, visitor: null, action: 'DENY', notes: '', roomNumber: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to deny visitor');
    },
  });

  // Pre-approved Invite submission
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteMobile.trim() || !invitePurpose.trim()) {
      toast.error('Please fill in visitor name, mobile, and purpose');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      await visitorApi.requestToken({
        name: inviteName.trim(),
        mobile: inviteMobile.trim(),
        purpose: `[Pre-Approved Appointment] ${invitePurpose.trim()}`,
        hostName: user?.fullName || 'Faculty Host',
        hostType: 'FACULTY',
        hostDepartment: 'IT',
        notes: `Pre-approved by Faculty @${user?.username} for ${inviteDate}`,
      });
      toast.success(`Appointment registered for ${inviteName}! Gate terminal can issue pass upon arrival.`);
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteMobile('');
      setInvitePurpose('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to schedule appointment');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 font-sans px-2 sm:px-4">
      {/* ── TOP HEADER & FACULTY PROFILE CARD ────────────────────────────── */}
      <div className="bg-[#0f172a] text-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                Staff & Faculty Portal
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-400/30 rounded text-[11px] font-medium text-emerald-400">
                Live Gate Connection Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-2 text-white">
              Welcome, {user?.fullName || 'Faculty Member'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Employee ID: <strong className="text-slate-200">#{user?.username}</strong></span>
              <span>•</span>
              <span>Role: <strong className="text-blue-300">{user?.role}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Pre-Approve Guest</span>
            </button>
            <button
              onClick={() => refetchPending()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-lg transition"
              title="Refresh requests"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── METRIC STATS ROW ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">
            At Gate Awaiting You
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600">{pendingVisitors.length}</span>
            <span className="text-[11px] text-slate-400">requests</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">
            Currently Inside
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">{myActiveInside.length}</span>
            <span className="text-[11px] text-slate-400">visitors</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">
            Gate Clearance Speed
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-600">&lt; 1 min</span>
            <span className="text-[11px] text-slate-400">instant 1-click</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: LIVE VISITOR ALERTS AT GATE ────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Live Gate Requests Awaiting Your Approval ({pendingVisitors.length})
            </h2>
          </div>
          <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-medium">
            Real-Time Push
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingVisitors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              No visitors currently waiting at the gate for you. All clear!
            </div>
          ) : (
            pendingVisitors.map((visitor) => (
              <div key={visitor.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50 transition">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{visitor.name}</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold">
                      PENDING CLEARANCE
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {visitor.mobile}
                    </span>
                    <span>•</span>
                    <span className="text-slate-700 font-medium">Purpose: {visitor.purpose}</span>
                    {visitor.vehicleNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-600">Vehicle: {visitor.vehicleNumber}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() =>
                      setClearanceModal({
                        isOpen: true,
                        visitor,
                        action: 'APPROVE',
                        notes: '',
                        roomNumber: '',
                      })
                    }
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Entry
                  </button>
                  <button
                    onClick={() =>
                      setClearanceModal({
                        isOpen: true,
                        visitor,
                        action: 'DENY',
                        notes: '',
                        roomNumber: '',
                      })
                    }
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Deny Access
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── SECTION 2: MY VISITORS LOG ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              My Visitors Log
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Filter past and active campus visitors who met you</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['TODAY', 'WEEK', 'MONTH'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  filterPeriod === period ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period === 'TODAY' ? 'Today' : period === 'WEEK' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search visitor name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {myActiveInside.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active visitors currently in campus for your department under this filter.
            </div>
          ) : (
            myActiveInside.map((v) => (
              <div key={v.id} className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{v.name}</h4>
                  <p className="text-slate-500 font-mono mt-0.5">{v.mobile} • In: {new Date(v.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-[10px]">
                  INSIDE CAMPUS
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 1-CLICK GATE CLEARANCE MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {clearanceModal.isOpen && clearanceModal.visitor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className={`p-4 text-white flex justify-between items-center ${clearanceModal.action === 'APPROVE' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
                <h3 className="font-bold text-sm">
                  {clearanceModal.action === 'APPROVE' ? 'Approve Visitor Gate Clearance' : 'Deny Visitor Access'}
                </h3>
                <button
                  onClick={() => setClearanceModal({ ...clearanceModal, isOpen: false })}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-800 text-sm">{clearanceModal.visitor.name}</p>
                  <p className="text-slate-500 font-mono">{clearanceModal.visitor.mobile}</p>
                  <p className="text-slate-600">Purpose: {clearanceModal.visitor.purpose}</p>
                </div>

                {clearanceModal.action === 'APPROVE' && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Direct Visitor to Room / Lab (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. IT-304 / Staff Room 2"
                      value={clearanceModal.roomNumber}
                      onChange={(e) => setClearanceModal({ ...clearanceModal, roomNumber: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {clearanceModal.action === 'APPROVE' ? 'Note for Security Guard (Optional)' : 'Reason for Denial *'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={clearanceModal.action === 'APPROVE' ? 'e.g. Cleared to meet for project review' : 'e.g. Busy in lecture, please reschedule'}
                    value={clearanceModal.notes}
                    onChange={(e) => setClearanceModal({ ...clearanceModal, notes: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setClearanceModal({ ...clearanceModal, isOpen: false })}
                    className="px-3.5 py-2 text-slate-600 font-medium hover:text-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (clearanceModal.action === 'APPROVE') {
                        approveMutation.mutate(clearanceModal.visitor!.id);
                      } else {
                        rejectMutation.mutate(clearanceModal.visitor!.id);
                      }
                    }}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className={`px-4 py-2 text-white font-semibold rounded-lg transition disabled:opacity-50 ${
                      clearanceModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {clearanceModal.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Denial'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRE-APPROVED INVITES / APPOINTMENTS MODAL ────────────────────── */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-4 bg-blue-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Pre-Approve Guest / Invite</h3>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-white/80 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateInvite} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Kumar"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Guest Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={inviteMobile}
                    onChange={(e) => setInviteMobile(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected Visit Date *</label>
                  <input
                    type="date"
                    required
                    value={inviteDate}
                    onChange={(e) => setInviteDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Purpose of Visit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Guest Lecture / Project Evaluation"
                    value={invitePurpose}
                    onChange={(e) => setInvitePurpose(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-3.5 py-2 text-slate-600 font-medium hover:text-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInvite}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {isSubmittingInvite ? 'Scheduling...' : 'Issue Pre-Approval'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

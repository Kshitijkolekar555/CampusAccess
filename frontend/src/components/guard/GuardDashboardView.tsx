import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorApi } from '../../api/visitors';
import { hostelOutpassApi } from '../../api/hostelOutpasses';
import { Visitor, GuardSelfDashboardResponse } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  Users,
  PlusCircle,
  QrCode,
  GraduationCap,
  Search,
  CheckCircle2,
  X,
  Clock,
  Phone,
  Building,
  FileText,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface GuardDashboardViewProps {
  user: any;
  guardSummary: GuardSelfDashboardResponse | null;
  activeVisitors: Visitor[];
  onToggleDetailedView?: () => void;
}

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
    const clean = url.startsWith('/') ? url : `/${url}`;
    return `http://localhost:8080${clean}`;
  };

  const resolvedUrl = !imgError ? getResolvedUrl(photoUrl) : null;

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={name}
        onError={() => setImgError(true)}
        className="w-11 h-11 rounded-full object-cover border border-slate-200 flex-shrink-0 bg-slate-100"
      />
    );
  }

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'V';

  return (
    <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
      {initials}
    </div>
  );
};

export const GuardDashboardView: React.FC<GuardDashboardViewProps> = ({
  user,
  guardSummary,
  activeVisitors,
  onToggleDetailedView
}) => {
  const queryClient = useQueryClient();
  const [searchFilter, setSearchFilter] = useState('');
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());

  // Modal States
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isStudentOutpassOpen, setIsStudentOutpassOpen] = useState(false);

  // Quick Form States
  const [checkInName, setCheckInName] = useState('');
  const [checkInMobile, setCheckInMobile] = useState('');
  const [checkInHost, setCheckInHost] = useState('');
  const [checkInPurpose, setCheckInPurpose] = useState('');
  const [checkInVehicle, setCheckInVehicle] = useState('');

  // Quick Exit Search State
  const [exitQuery, setExitQuery] = useState('');
  const [selectedVisitorForExit, setSelectedVisitorForExit] = useState<Visitor | null>(null);

  // Student Outpass State
  const [studentSearchPrn, setStudentSearchPrn] = useState('');
  const [searchedOutpass, setSearchedOutpass] = useState<any>(null);
  const [isOutpassSearching, setIsOutpassSearching] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick Visitor Check-in Mutation
  const checkInMutation = useMutation({
    mutationFn: (payload: any) => visitorApi.checkIn(payload),
    onSuccess: (data) => {
      toast.success(`Entry logged! Pass #${data.passNumber || data.id}`);
      queryClient.invalidateQueries({ queryKey: ['active-visitors-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      setIsCheckInOpen(false);
      setCheckInName('');
      setCheckInMobile('');
      setCheckInHost('');
      setCheckInPurpose('');
      setCheckInVehicle('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to log entry');
    }
  });

  // Quick Visitor Check-out Mutation
  const checkOutMutation = useMutation({
    mutationFn: (payload: { visitorId?: number; passNumber?: string; mobile?: string }) =>
      visitorApi.checkOut(payload),
    onSuccess: (data) => {
      toast.success(`Exit logged for ${data.name || 'Visitor'}`);
      queryClient.invalidateQueries({ queryKey: ['active-visitors-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      setIsExitOpen(false);
      setSelectedVisitorForExit(null);
      setExitQuery('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  });

  const handleQuickCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInName.trim() || !checkInMobile.trim() || !checkInPurpose.trim()) {
      toast.error('Please fill Visitor Name, Mobile, and Purpose');
      return;
    }
    checkInMutation.mutate({
      name: checkInName.trim(),
      mobile: checkInMobile.trim(),
      purpose: checkInPurpose.trim(),
      hostName: checkInHost.trim() || 'General Inquiry',
      hostType: 'FACULTY',
      hostDepartment: 'IT',
      gateId: 1,
      idProofType: 'Aadhaar',
      idProofNumber: 'ID-' + Math.floor(100000 + Math.random() * 900000),
      vehicleNumber: checkInVehicle.trim() || undefined
    });
  };

  const handleExitLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitQuery.trim()) return;

    const queryLower = exitQuery.trim().toLowerCase();
    const found = activeVisitors.find(
      (v) =>
        v.mobile?.toLowerCase().includes(queryLower) ||
        v.passNumber?.toLowerCase().includes(queryLower) ||
        v.name?.toLowerCase().includes(queryLower) ||
        v.id.toString() === queryLower
    );

    if (found) {
      setSelectedVisitorForExit(found);
    } else {
      toast.error('No active visitor found matching that Mobile or Pass #');
      setSelectedVisitorForExit(null);
    }
  };

  const handleSearchStudentOutpass = async () => {
    if (!studentSearchPrn.trim()) return;
    setIsOutpassSearching(true);
    try {
      const res = await hostelOutpassApi.getOutpasses({ prn: studentSearchPrn.trim() });
      if (res && res.content && res.content.length > 0) {
        setSearchedOutpass(res.content[0]);
      } else {
        toast.error('No active outpass found for PRN: ' + studentSearchPrn);
        setSearchedOutpass(null);
      }
    } catch (err) {
      toast.error('Outpass lookup failed');
    } finally {
      setIsOutpassSearching(false);
    }
  };

  // Filtered Active Visitors
  const filteredVisitors = activeVisitors.filter(
    (v) =>
      v.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.mobile?.includes(searchFilter) ||
      v.hostName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.passNumber?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const summaryData = guardSummary || {
    guardName: user?.fullName || 'Duty Officer',
    guardId: 'G-' + user?.id,
    gateName: 'Main Entrance Gate',
    dutyStatus: 'ON DUTY',
    visitorsEnteredToday: activeVisitors.length + 4,
    visitorsExitedToday: 3,
    activeVisitorsInsideCampus: activeVisitors.length
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* HEADER BANNER - Aligned with CampusAccess --ink Theme */}
      <div className="bg-[#0f172a] text-white rounded-md p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              Gate Duty Terminal
            </span>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {liveTime}
            </span>
          </div>

          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            {summaryData.guardName}
          </h1>

          <p className="text-xs text-slate-400 mt-0.5">
            Assigned Gate: <span className="text-slate-200 font-medium">{summaryData.gateName}</span> • Shift: <span className="text-slate-200 font-medium">Morning Duty</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onToggleDetailedView && (
            <button
              onClick={onToggleDetailedView}
              className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded transition font-medium"
            >
              Detailed View
            </button>
          )}

          <div className="bg-emerald-950/50 border border-emerald-500/30 px-3 py-1 rounded text-right">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">Status</span>
            <span className="text-xs font-bold text-emerald-300">ON DUTY</span>
          </div>
        </div>
      </div>

      {/* 3 ESSENTIAL STAT CARDS - Matched to StatsCard style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Visitors Inside
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {activeVisitors.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">On campus grounds</p>
          </div>
          <div className="w-10 h-10 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Entered Today
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {summaryData.visitorsEnteredToday}
            </p>
            <p className="text-xs text-slate-500 mt-1">Check-in entries</p>
          </div>
          <div className="w-10 h-10 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Exited Today
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {summaryData.visitorsExitedToday}
            </p>
            <p className="text-xs text-slate-500 mt-1">Check-out exits</p>
          </div>
          <div className="w-10 h-10 rounded bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <LogOut className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* GATE QUICK ACTIONS - Clean Minimal Action Cards */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Gate Quick Actions
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* QUICK ENTRY */}
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-md p-4 transition shadow-xs text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                  Quick Visitor Entry
                </h3>
                <p className="text-xs text-slate-500">Log new visitor arrival</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
          </button>

          {/* QUICK EXIT */}
          <button
            onClick={() => setIsExitOpen(true)}
            className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-rose-300 rounded-md p-4 transition shadow-xs text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 flex-shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-rose-600 transition">
                  Scan QR / Pass Exit
                </h3>
                <p className="text-xs text-slate-500">Log visitor departure</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
          </button>

          {/* STUDENT OUTPASS */}
          <button
            onClick={() => setIsStudentOutpassOpen(true)}
            className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-md p-4 transition shadow-xs text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 flex-shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                  Student Outpass Check
                </h3>
                <p className="text-xs text-slate-500">Verify PRN gate approval</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      </div>

      {/* LIVE ACTIVE VISITORS GRID */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Active Visitors Inside Campus ({activeVisitors.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click <span className="text-rose-600 font-semibold">Check Out</span> when visitor leaves the campus gate.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Name, Phone or Pass #"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {filteredVisitors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredVisitors.map((visitor) => (
              <div
                key={visitor.id}
                className="bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-indigo-200 rounded p-3.5 transition flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <VisitorAvatar photoUrl={visitor.photoUrl} name={visitor.name} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{visitor.name}</h3>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                        INSIDE
                      </span>
                    </div>

                    <div className="space-y-0.5 mt-1 text-xs text-slate-600">
                      <p className="flex items-center gap-1 font-mono font-medium text-slate-800">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {visitor.mobile}
                      </p>
                      <p className="flex items-center gap-1 text-slate-600 truncate">
                        <Building className="w-3 h-3 text-slate-400" />
                        Host: <span className="font-medium text-slate-800">{visitor.hostName || 'General Inquiry'}</span>
                      </p>
                      <p className="flex items-center gap-1 text-slate-500 truncate">
                        <FileText className="w-3 h-3 text-slate-400" />
                        Purpose: <span>{visitor.purpose}</span>
                      </p>
                      <p className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Entry Time: <span className="font-mono text-slate-700">{new Date(visitor.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Pass #{visitor.passNumber || visitor.id}
                  </span>

                  <button
                    onClick={() => {
                      if (window.confirm(`Log exit for visitor ${visitor.name}?`)) {
                        checkOutMutation.mutate({ visitorId: visitor.id });
                      }
                    }}
                    disabled={checkOutMutation.isPending}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-3 py-1.5 rounded transition shadow-xs flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No active visitors currently inside campus.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click 'Quick Visitor Entry' above when a visitor arrives.</p>
          </div>
        )}
      </div>

      {/* QUICK CHECK-IN MODAL */}
      <AnimatePresence>
        {isCheckInOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-md w-full max-w-md overflow-hidden shadow-lg"
            >
              <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold">Quick Visitor Check-In</h3>
                </div>
                <button
                  onClick={() => setIsCheckInOpen(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickCheckInSubmit} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Visitor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={checkInName}
                    onChange={(e) => setCheckInName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mobile Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={checkInMobile}
                    onChange={(e) => setCheckInMobile(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Host Person / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Sharma / IT Dept"
                    value={checkInHost}
                    onChange={(e) => setCheckInHost(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Purpose of Visit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parent Meeting / Document Submission"
                    value={checkInPurpose}
                    onChange={(e) => setCheckInPurpose(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Vehicle Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH12AB1234"
                    value={checkInVehicle}
                    onChange={(e) => setCheckInVehicle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckInOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={checkInMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm & Check In
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK PASS EXIT / QR SCAN MODAL */}
      <AnimatePresence>
        {isExitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-md w-full max-w-md overflow-hidden shadow-lg"
            >
              <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm font-bold">Scan QR / Pass Exit</h3>
                </div>
                <button
                  onClick={() => {
                    setIsExitOpen(false);
                    setSelectedVisitorForExit(null);
                    setExitQuery('');
                  }}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <form onSubmit={handleExitLookup} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Mobile, Pass #, or scan QR"
                    value={exitQuery}
                    onChange={(e) => setExitQuery(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-3.5 py-2 rounded transition flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Lookup
                  </button>
                </form>

                {selectedVisitorForExit ? (
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <VisitorAvatar photoUrl={selectedVisitorForExit.photoUrl} name={selectedVisitorForExit.name} />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{selectedVisitorForExit.name}</h4>
                        <p className="text-xs text-slate-600 font-mono">{selectedVisitorForExit.mobile}</p>
                        <p className="text-xs text-slate-500">Host: {selectedVisitorForExit.hostName}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => checkOutMutation.mutate({ visitorId: selectedVisitorForExit.id })}
                      disabled={checkOutMutation.isPending}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-2 rounded transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Confirm Check Out
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded">
                    <QrCode className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500">
                      Scan visitor QR code or search by 10-digit mobile number above.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDENT OUTPASS GATE CHECK MODAL */}
      <AnimatePresence>
        {isStudentOutpassOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-md w-full max-w-md overflow-hidden shadow-lg"
            >
              <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold">Student Outpass Verification</h3>
                </div>
                <button
                  onClick={() => {
                    setIsStudentOutpassOpen(false);
                    setSearchedOutpass(null);
                    setStudentSearchPrn('');
                  }}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Student PRN (e.g. F24IT32)"
                    value={studentSearchPrn}
                    onChange={(e) => setStudentSearchPrn(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSearchStudentOutpass}
                    disabled={isOutpassSearching}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3.5 py-2 rounded transition flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Verify
                  </button>
                </div>

                {searchedOutpass ? (
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{searchedOutpass.studentName || 'Student'}</h4>
                        <p className="text-xs text-slate-500 font-mono">PRN: {searchedOutpass.studentPrn}</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded font-semibold uppercase">
                        {searchedOutpass.status || 'APPROVED'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>Reason: <span className="text-slate-900 font-medium">{searchedOutpass.reason}</span></p>
                      <p>Destination: <span className="text-slate-900">{searchedOutpass.destination}</span></p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => {
                          toast.success(`Student Exit Logged for PRN ${searchedOutpass.studentPrn}`);
                          setIsStudentOutpassOpen(false);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 rounded transition shadow-xs flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Allow Exit
                      </button>

                      <button
                        onClick={() => {
                          toast.success(`Student Return Logged for PRN ${searchedOutpass.studentPrn}`);
                          setIsStudentOutpassOpen(false);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 rounded transition shadow-xs flex items-center justify-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Allow Return
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded">
                    <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500">
                      Enter student PRN to verify outpass warden approval.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

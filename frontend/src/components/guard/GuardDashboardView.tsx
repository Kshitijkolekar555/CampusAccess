import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorApi } from '../../api/visitors';
import { hostelOutpassApi } from '../../api/hostelOutpasses';
import { studentPassApi } from '../../api/studentPasses';
import { userApi } from '../../api/users';
import { gateApi } from '../../api/gates';
import { VisitorWebcamModal } from '../visitor/VisitorWebcamModal';
import {
  Visitor,
  GuardSelfDashboardResponse,
  VisitorRecognitionResponse,
  StudentGatePass,
  HostelOutpass,
  User,
  Gate
} from '../../types';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  Users,
  PlusCircle,
  GraduationCap,
  Search,
  CheckCircle2,
  X,
  Clock,
  Phone,
  Building,
  FileText,
  Camera,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calendar,
  AlertCircle,
  LogIn,
  Check,
  XCircle,
  ArrowRight,
  BookOpen
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
    return `http://localhost:8081${clean}`;
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
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());

  // Top-Level Mode Selection: 'VISITOR' vs 'STUDENT'
  const [primaryMode, setPrimaryMode] = useState<'VISITOR' | 'STUDENT'>('VISITOR');

  // Student Subcategory: 'REGULAR' vs 'OUTPASS'
  const [studentMode, setStudentMode] = useState<'REGULAR' | 'OUTPASS'>('REGULAR');

  // Gate list query
  const { data: gates = [] } = useQuery<Gate[]>({
    queryKey: ['gates-active'],
    queryFn: () => gateApi.getAllGates(true),
  });
  const currentGateId = guardSummary?.gateId || gates[0]?.id || 1;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. VISITOR WORKFLOW STATES & MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [visitorCapturedBlob, setVisitorCapturedBlob] = useState<Blob | null>(null);
  const [visitorPhotoPreview, setVisitorPhotoPreview] = useState<string | null>(null);
  const [isNewVisitorModalOpen, setIsNewVisitorModalOpen] = useState(false);
  const [isVisitorExitOpen, setIsVisitorExitOpen] = useState(false);
  const [visitorExitQuery, setVisitorExitQuery] = useState('');
  const [selectedVisitorForExit, setSelectedVisitorForExit] = useState<Visitor | null>(null);
  const [visitorSearchFilter, setVisitorSearchFilter] = useState('');

  // Returning visitor review state
  const [recognizedVisitorData, setRecognizedVisitorData] = useState<VisitorRecognitionResponse | null>(null);

  // Visitor Manual / Pre-filled Form fields
  const [vFormName, setVFormName] = useState('');
  const [vFormMobile, setVFormMobile] = useState('');
  const [vFormHost, setVFormHost] = useState('');
  const [vFormDept, setVFormDept] = useState('IT');
  const [vFormPurpose, setVFormPurpose] = useState('');
  const [vFormVehicle, setVFormVehicle] = useState('');
  const [vFormIdType, setVFormIdType] = useState('Aadhaar');
  const [vFormIdNumber, setVFormIdNumber] = useState('');

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup blob preview URL on unmount
  useEffect(() => {
    return () => {
      if (visitorPhotoPreview) URL.revokeObjectURL(visitorPhotoPreview);
    };
  }, [visitorPhotoPreview]);

  // Query pending digital tokens awaiting approval
  const { data: pendingTokens = [] } = useQuery<Visitor[]>({
    queryKey: ['guard-pending-tokens'],
    queryFn: async () => {
      try {
        return await visitorApi.getPendingTokens();
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  // Approve Token Mutation
  const approveTokenMutation = useMutation({
    mutationFn: (id: number) => visitorApi.approveToken(id),
    onSuccess: (data) => {
      toast.success(`Digital token approved for ${data.name}! Entrance granted.`);
      queryClient.invalidateQueries({ queryKey: ['guard-pending-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['active-visitors-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve token');
    },
  });

  // Reject Token Mutation
  const rejectTokenMutation = useMutation({
    mutationFn: (id: number) => visitorApi.rejectToken(id),
    onSuccess: (data) => {
      toast.info(`Token rejected for ${data.name || 'visitor'}.`);
      queryClient.invalidateQueries({ queryKey: ['guard-pending-tokens'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject token');
    },
  });

  // Visitor Check-In Mutation (Direct or with photo)
  const visitorCheckInMutation = useMutation({
    mutationFn: async (payload: { photoBlob: Blob | null; data: any }) => {
      if (payload.photoBlob) {
        return visitorApi.registerWithPhoto(payload.photoBlob, payload.data);
      }
      return visitorApi.checkIn(payload.data);
    },
    onSuccess: (data) => {
      toast.success(`Entry authorized! Pass #${data.passNumber || data.id} issued for ${data.name}.`);
      queryClient.invalidateQueries({ queryKey: ['active-visitors-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      setIsNewVisitorModalOpen(false);
      setRecognizedVisitorData(null);
      setVisitorCapturedBlob(null);
      if (visitorPhotoPreview) URL.revokeObjectURL(visitorPhotoPreview);
      setVisitorPhotoPreview(null);
      resetVisitorForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to authorize visitor entry');
    }
  });

  // Visitor Check-Out Mutation
  const visitorCheckOutMutation = useMutation({
    mutationFn: (payload: { visitorId?: number; passNumber?: string; mobile?: string }) =>
      visitorApi.checkOut(payload),
    onSuccess: (data) => {
      toast.success(`Exit logged for ${data.name || 'Visitor'}`);
      queryClient.invalidateQueries({ queryKey: ['active-visitors-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      setIsVisitorExitOpen(false);
      setSelectedVisitorForExit(null);
      setVisitorExitQuery('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  });

  const resetVisitorForm = () => {
    setVFormName('');
    setVFormMobile('');
    setVFormHost('');
    setVFormDept('IT');
    setVFormPurpose('');
    setVFormVehicle('');
    setVFormIdNumber('');
  };

  const handleVisitorRecognized = (match: VisitorRecognitionResponse, blob: Blob | null) => {
    setRecognizedVisitorData(match);
    if (blob) {
      setVisitorCapturedBlob(blob);
      setVisitorPhotoPreview(URL.createObjectURL(blob));
    } else if (match.photoPath) {
      setVisitorPhotoPreview(`http://localhost:8081/${match.photoPath.replace(/^\/+/, '')}`);
    }
    // Pre-fill form values
    if (match.visitorName) setVFormName(match.visitorName);
    if (match.mobileNumber) setVFormMobile(match.mobileNumber);
    if (match.hostName) setVFormHost(match.hostName);
    if (match.hostDepartment) setVFormDept(match.hostDepartment);
    if (match.purpose) setVFormPurpose(match.purpose);
    if (match.vehicleNumber) setVFormVehicle(match.vehicleNumber);
    if (match.idProofNumber) setVFormIdNumber(match.idProofNumber);
    setIsWebcamOpen(false);
    setIsNewVisitorModalOpen(true);
  };

  const handleVisitorRegisterNew = (blob: Blob | null) => {
    setRecognizedVisitorData(null);
    if (blob) {
      setVisitorCapturedBlob(blob);
      setVisitorPhotoPreview(URL.createObjectURL(blob));
    }
    resetVisitorForm();
    setIsWebcamOpen(false);
    setIsNewVisitorModalOpen(true);
  };

  const handleVisitorFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vFormName.trim() || !vFormMobile.trim() || !vFormPurpose.trim()) {
      toast.error('Please enter Name, Mobile, and Purpose');
      return;
    }
    const idNum = vFormIdNumber.trim() || `VT-${Math.floor(100000 + Math.random() * 900000)}`;
    visitorCheckInMutation.mutate({
      photoBlob: visitorCapturedBlob,
      data: {
        name: vFormName.trim(),
        mobile: vFormMobile.trim(),
        purpose: vFormPurpose.trim(),
        hostName: vFormHost.trim() || 'General Inquiry',
        hostType: 'FACULTY',
        hostDepartment: vFormDept || 'IT',
        gateId: currentGateId,
        idProofType: vFormIdType,
        idProofNumber: idNum,
        vehicleNumber: vFormVehicle.trim() || undefined,
      }
    });
  };

  const handleVisitorExitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorExitQuery.trim()) return;
    const q = visitorExitQuery.trim().toLowerCase();
    const found = activeVisitors.find(
      (v) =>
        v.mobile?.toLowerCase().includes(q) ||
        v.passNumber?.toLowerCase().includes(q) ||
        v.name?.toLowerCase().includes(q) ||
        v.id.toString() === q
    );
    if (found) {
      setSelectedVisitorForExit(found);
    } else {
      toast.error('No active visitor found matching that Mobile or Pass #');
      setSelectedVisitorForExit(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. REGULAR STUDENT WORKFLOW STATES & MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const [regularStudentQuery, setRegularStudentQuery] = useState('');
  const [regularStudentResult, setRegularStudentResult] = useState<User | null>(null);
  const [regularStudentPasses, setRegularStudentPasses] = useState<StudentGatePass[]>([]);
  const [isSearchingRegular, setIsSearchingRegular] = useState(false);
  const [regularSearchError, setRegularSearchError] = useState<string | null>(null);

  const handleRegularStudentSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = regularStudentQuery.trim();
    if (!query) {
      toast.error('Please enter a Student PRN or Username');
      return;
    }

    setIsSearchingRegular(true);
    setRegularSearchError(null);
    setRegularStudentResult(null);
    setRegularStudentPasses([]);

    try {
      // 1. Look up user record
      const userRes = await userApi.getUsers({ query, size: 5 });
      const foundUser = userRes?.content?.find(
        (u) =>
          u.username.toUpperCase() === query.toUpperCase() ||
          u.fullName.toLowerCase().includes(query.toLowerCase())
      ) || (userRes?.content && userRes.content.length === 1 ? userRes.content[0] : null);

      if (!foundUser) {
        setRegularSearchError(`No student account found for PRN / Query "${query}". Verify the student PRN.`);
        setIsSearchingRegular(false);
        return;
      }

      setRegularStudentResult(foundUser);

      // 2. Look up student passes to check active authorization status
      try {
        const passRes = await studentPassApi.getPasses({ studentPrn: foundUser.username, size: 5 });
        setRegularStudentPasses(passRes?.content || []);
      } catch {
        setRegularStudentPasses([]);
      }
    } catch (err: any) {
      setRegularSearchError(err.response?.data?.message || 'Failed to search student record');
    } finally {
      setIsSearchingRegular(false);
    }
  };

  // Regular Student Pass Exit Mutation
  const regularStudentExitMutation = useMutation({
    mutationFn: (passId: number) => studentPassApi.recordGateExit(passId, currentGateId),
    onSuccess: (data) => {
      toast.success(`Authorized Exit recorded for student ${data.studentName}!`);
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      handleRegularStudentSearch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record student exit');
    }
  });

  // Regular Student Pass Entry Mutation
  const regularStudentEntryMutation = useMutation({
    mutationFn: (passId: number) => studentPassApi.recordGateEntry(passId),
    onSuccess: (data) => {
      toast.success(`Authorized Re-entry recorded for student ${data.studentName}!`);
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      handleRegularStudentSearch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record student entry');
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. OUTPASS STUDENT WORKFLOW STATES & MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const [outpassStudentQuery, setOutpassStudentQuery] = useState('');
  const [searchedOutpasses, setSearchedOutpasses] = useState<HostelOutpass[]>([]);
  const [isOutpassSearching, setIsOutpassSearching] = useState(false);
  const [outpassSearchError, setOutpassSearchError] = useState<string | null>(null);

  const handleOutpassSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = outpassStudentQuery.trim();
    if (!query) {
      toast.error('Please enter student PRN to verify outpass');
      return;
    }

    setIsOutpassSearching(true);
    setOutpassSearchError(null);
    setSearchedOutpasses([]);

    try {
      const res = await hostelOutpassApi.getOutpasses({ studentPrn: query, size: 10 });
      if (res && res.content && res.content.length > 0) {
        setSearchedOutpasses(res.content);
      } else {
        setOutpassSearchError(`No hostel outpass records found for PRN "${query}".`);
      }
    } catch (err: any) {
      setOutpassSearchError(err.response?.data?.message || 'Outpass verification lookup failed');
    } finally {
      setIsOutpassSearching(false);
    }
  };

  // Outpass Exit Mutation
  const outpassExitMutation = useMutation({
    mutationFn: (outpassId: number) => hostelOutpassApi.recordGateExit(outpassId, currentGateId),
    onSuccess: (data) => {
      toast.success(`Departure recorded! Outpass #${data.outpassNumber || data.id} exited at ${new Date().toLocaleTimeString()}`);
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      handleOutpassSearch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Exit record denied');
    }
  });

  // Outpass Entry Mutation
  const outpassEntryMutation = useMutation({
    mutationFn: (outpassId: number) => hostelOutpassApi.recordGateEntry(outpassId),
    onSuccess: (data) => {
      const lateNote = data.isLateReturn ? ' ⚠️ Flagged as Late Return' : '';
      toast.success(`Return recorded for ${data.studentName}!${lateNote}`);
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      handleOutpassSearch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Entry record denied');
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary Stats
  // ─────────────────────────────────────────────────────────────────────────────
  const summaryData = guardSummary || {
    guardName: user?.fullName || 'Duty Officer',
    guardId: 'G-' + user?.id,
    gateName: 'Main Entrance Gate',
    dutyStatus: 'ON DUTY',
    visitorsEnteredToday: activeVisitors.length,
    visitorsExitedToday: 0,
    activeVisitorsInsideCampus: activeVisitors.length,
    studentPassesProcessedToday: 0,
  };

  const filteredVisitors = activeVisitors.filter(
    (v) =>
      v.name?.toLowerCase().includes(visitorSearchFilter.toLowerCase()) ||
      v.mobile?.includes(visitorSearchFilter) ||
      v.hostName?.toLowerCase().includes(visitorSearchFilter.toLowerCase()) ||
      v.passNumber?.toLowerCase().includes(visitorSearchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* 1. HEADER BANNER */}
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
            Assigned Gate: <span className="text-slate-200 font-medium">{summaryData.gateName}</span> • Terminal ID: <span className="text-slate-200 font-mono font-medium">{summaryData.guardId}</span>
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

      {/* 2. PENDING DIGITAL TOKEN CLEARANCE BANNER */}
      {pendingTokens && pendingTokens.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Pending Visitor Pass Requests ({pendingTokens.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded">
              Awaiting Guard Approval
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingTokens.map((token) => (
              <div
                key={token.id}
                className="bg-white border border-amber-200 rounded p-3 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <VisitorAvatar photoUrl={token.photoUrl} name={token.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{token.name}</h3>
                      <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">
                        #{token.id}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-600 mt-0.5">{token.mobile}</p>
                    <p className="text-[11px] text-slate-500 truncate">Host: {token.hostName || 'Campus Faculty'}</p>
                    <p className="text-[11px] text-slate-600 truncate">Purpose: {token.purpose}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => approveTokenMutation.mutate(token.id)}
                    disabled={approveTokenMutation.isPending || rejectTokenMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-1.5 rounded transition flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectTokenMutation.mutate(token.id)}
                    disabled={approveTokenMutation.isPending || rejectTokenMutation.isPending}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-1.5 rounded transition flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PRIMARY GATE CATEGORY SELECTION: VISITOR (CAMERA) vs STUDENT */}
      <div className="bg-white border border-slate-200 rounded-md p-1.5 sm:p-2 shadow-xs">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPrimaryMode('VISITOR')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 px-2 sm:px-4 rounded text-xs sm:text-sm font-semibold transition min-h-[44px] ${
              primaryMode === 'VISITOR'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Camera className={`w-4 h-4 shrink-0 ${primaryMode === 'VISITOR' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span className="truncate">1. Visitor (Camera)</span>
          </button>

          <button
            onClick={() => setPrimaryMode('STUDENT')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 px-2 sm:px-4 rounded text-xs sm:text-sm font-semibold transition min-h-[44px] ${
              primaryMode === 'STUDENT'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GraduationCap className={`w-4 h-4 shrink-0 ${primaryMode === 'STUDENT' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span className="truncate">2. Student</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 4. VISITOR (CAMERA) MAIN WORKFLOW INTERFACE */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {primaryMode === 'VISITOR' && (
        <div className="space-y-6">
          {/* VISITOR ACTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SCAN VISITOR (CAMERA) */}
            <button
              onClick={() => setIsWebcamOpen(true)}
              className="group bg-white hover:bg-slate-50 border-2 border-indigo-200 hover:border-indigo-400 rounded-md p-4 transition shadow-xs text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 flex-shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      Scan Visitor (Camera)
                    </h3>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                      AI Face
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Identify returning visitor / Capture photo</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
            </button>

            {/* MANUAL VISITOR REGISTRATION */}
            <button
              onClick={() => {
                setRecognizedVisitorData(null);
                setVisitorCapturedBlob(null);
                if (visitorPhotoPreview) URL.revokeObjectURL(visitorPhotoPreview);
                setVisitorPhotoPreview(null);
                resetVisitorForm();
                setIsNewVisitorModalOpen(true);
              }}
              className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-md p-4 transition shadow-xs text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    Manual Visitor Entry
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Direct entry without camera</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition" />
            </button>

            {/* VISITOR EXIT / CHECK-OUT */}
            <button
              onClick={() => setIsVisitorExitOpen(true)}
              className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-rose-300 rounded-md p-4 transition shadow-xs text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 flex-shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition">
                    Visitor Departure (Exit)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Lookup by mobile or pass number</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          {/* ACTIVE VISITORS CURRENTLY INSIDE */}
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Active Visitors Currently Inside Campus ({activeVisitors.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record departure when the visitor exits through Gate {currentGateId}.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, phone, pass #"
                  value={visitorSearchFilter}
                  onChange={(e) => setVisitorSearchFilter(e.target.value)}
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
                            visitorCheckOutMutation.mutate({ visitorId: visitor.id });
                          }
                        }}
                        disabled={visitorCheckOutMutation.isPending}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-3 py-1.5 rounded transition shadow-xs flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Exit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No active visitors currently inside campus.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use camera scan or manual entry when a visitor arrives.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 5. STUDENT WORKFLOW INTERFACE (REGULAR STUDENT vs OUTPASS STUDENT) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {primaryMode === 'STUDENT' && (
        <div className="space-y-6">
          {/* STUDENT SUBCATEGORY TOGGLE */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-md px-3 sm:px-4 pt-3 gap-3 sm:gap-6 overflow-x-auto">
            <button
              onClick={() => setStudentMode('REGULAR')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition min-h-[44px] shrink-0 ${
                studentMode === 'REGULAR'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Regular Student</span>
            </button>

            <button
              onClick={() => setStudentMode('OUTPASS')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition min-h-[44px] shrink-0 ${
                studentMode === 'OUTPASS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Outpass Student</span>
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────────────── */}
          {/* OPTION A: REGULAR STUDENT */}
          {/* ───────────────────────────────────────────────────────────────────── */}
          {studentMode === 'REGULAR' && (
            <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 shadow-xs space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Regular Student Verification & Access Control
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search student record by PRN, verify access permission status, and record gate entry/exit events.
                </p>
              </div>

              {/* SEARCH FORM */}
              <form onSubmit={handleRegularStudentSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Student PRN (e.g. F24IT32, student1)"
                    value={regularStudentQuery}
                    onChange={(e) => setRegularStudentQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-9 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingRegular}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded transition flex items-center justify-center gap-1.5 min-h-[44px] w-full sm:w-auto"
                >
                  {isSearchingRegular ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Search Student</span>
                </button>
              </form>

              {/* NOT FOUND / ERROR STATE */}
              {regularSearchError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded p-4 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{regularSearchError}</span>
                </div>
              )}

              {/* STUDENT RECORD DISPLAY */}
              {regularStudentResult && (
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{regularStudentResult.fullName}</h3>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">
                          PRN: {regularStudentResult.username}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Email: <span className="font-mono text-slate-700">{regularStudentResult.email || 'N/A'}</span> • Phone: <span className="font-mono text-slate-700">{regularStudentResult.phone || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded font-semibold border ${
                        regularStudentResult.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {regularStudentResult.active ? 'ACTIVE ACCOUNT' : 'SUSPENDED'}
                      </span>

                      <span className={`text-xs px-2.5 py-1 rounded font-semibold border ${
                        regularStudentResult.isLateComerPermitted !== false
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {regularStudentResult.isLateComerPermitted !== false ? 'LATE PERMITTED' : 'LATE RESTRICTED'}
                      </span>
                    </div>
                  </div>

                  {/* ACTIVE GATE PASSES / ACCESS STATUS */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Associated Gate Passes & Authorizations
                    </h4>

                    {regularStudentPasses.length > 0 ? (
                      <div className="space-y-2">
                        {regularStudentPasses.map((pass) => (
                          <div
                            key={pass.id}
                            className="bg-white border border-slate-200 rounded p-3 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-700">Pass #{pass.passNumber || pass.id}</span>
                                <span className={`px-2 py-0.2 rounded font-semibold text-[10px] uppercase border ${
                                  pass.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  pass.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  pass.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                  pass.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {pass.status}
                                </span>
                              </div>
                              <p className="text-slate-600">Purpose: {pass.purpose || 'Academic / Personal'}</p>
                              <p className="text-slate-500 text-[11px]">
                                Expected Return: {new Date(pass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {pass.status === 'APPROVED' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Record authorized exit for student ${pass.studentName}?`)) {
                                      regularStudentExitMutation.mutate(pass.id);
                                    }
                                  }}
                                  disabled={regularStudentExitMutation.isPending}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-1.5 rounded transition flex items-center gap-1"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  Record Exit
                                </button>
                              )}

                              {pass.status === 'ACTIVE' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Record authorized return for student ${pass.studentName}?`)) {
                                      regularStudentEntryMutation.mutate(pass.id);
                                    }
                                  }}
                                  disabled={regularStudentEntryMutation.isPending}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1.5 rounded transition flex items-center gap-1"
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                  Record Re-Entry
                                </button>
                              )}

                              {(pass.status === 'COMPLETED' || pass.status === 'REJECTED') && (
                                <span className="text-slate-400 font-mono text-[11px]">
                                  {pass.status === 'COMPLETED' ? 'Pass finalized' : 'Pass rejected'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded p-3 text-xs text-slate-500">
                        No active gate passes currently on record for this student. Regular campus day entrance/exit logged under student PRN identity.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────── */}
          {/* OPTION B: OUTPASS STUDENT */}
          {/* ───────────────────────────────────────────────────────────────────── */}
          {studentMode === 'OUTPASS' && (
            <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Hostel Outpass Verification & Gate Operations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify hostel warden approval, check time validity, and record departure (exit) or return (entry) events.
                </p>
              </div>

              {/* SEARCH FORM */}
              <form onSubmit={handleOutpassSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Student PRN (e.g. F24IT32, student1)"
                    value={outpassStudentQuery}
                    onChange={(e) => setOutpassStudentQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-9 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isOutpassSearching}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded transition flex items-center justify-center gap-1.5 min-h-[44px] w-full sm:w-auto"
                >
                  {isOutpassSearching ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Verify Outpass</span>
                </button>
              </form>

              {/* ERROR / NOT FOUND STATE */}
              {outpassSearchError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded p-4 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{outpassSearchError}</span>
                </div>
              )}

              {/* OUTPASS RESULTS LIST */}
              {searchedOutpasses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Hostel Outpasses Found ({searchedOutpasses.length})
                  </h3>

                  {searchedOutpasses.map((outpass) => {
                    const isApproved = outpass.status === 'APPROVED';
                    const isExited = outpass.status === 'EXITED';
                    const isReturned = outpass.status === 'RETURNED';
                    const isRejected = outpass.status === 'REJECTED';
                    const isPending = outpass.status === 'PENDING';
                    const isExpired =
                      (isApproved || isPending) &&
                      new Date(outpass.expectedReturnTime) < new Date();

                    return (
                      <div
                        key={outpass.id}
                        className={`bg-slate-50/70 border rounded-md p-4 space-y-3 transition ${
                          isApproved ? 'border-emerald-300 bg-emerald-50/30' :
                          isExited ? 'border-blue-300 bg-blue-50/30' :
                          isRejected ? 'border-rose-300 bg-rose-50/30' :
                          'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{outpass.studentName}</h4>
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                PRN: {outpass.studentPrn}
                              </span>
                              <span className="text-xs text-slate-500">
                                Hostel: <span className="font-medium text-slate-700">{outpass.studentHostel || 'Campus Hostel'}</span> (Room {outpass.studentRoom || '-'})
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Reason: <span className="text-slate-800 font-medium">{outpass.reason}</span> • Destination: <span className="text-slate-700">{outpass.destination}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isExpired && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                EXPIRED / OVERDUE
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                              isApproved ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              isExited ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              isReturned ? 'bg-slate-100 text-slate-800 border-slate-300' :
                              isRejected ? 'bg-rose-100 text-rose-800 border-rose-300' :
                              'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {outpass.status}
                            </span>
                          </div>
                        </div>

                        {/* TIME RESTRICTIONS & WARDEN VERIFICATION */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white border border-slate-200 rounded p-2.5">
                          <div>
                            <span className="text-slate-400 block">Departure</span>
                            <span className="font-mono text-slate-700 font-medium">
                              {new Date(outpass.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Expected Return</span>
                            <span className="font-mono text-slate-700 font-medium">
                              {new Date(outpass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Actual Exit</span>
                            <span className="font-mono text-slate-700 font-medium">
                              {outpass.gateExitAt ? new Date(outpass.gateExitAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not yet exited'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Warden Remarks</span>
                            <span className="text-slate-700 truncate block">
                              {outpass.wardenRemarks || (isApproved ? 'Approved by Warden' : isPending ? 'Pending Approval' : 'No remarks')}
                            </span>
                          </div>
                        </div>

                        {/* ACTION BUTTONS WITH BACKEND ENFORCEMENT */}
                        <div className="pt-2 flex justify-end gap-2">
                          {isPending && (
                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Cannot allow exit: Outpass must be APPROVED by Warden first.</span>
                            </div>
                          )}

                          {isRejected && (
                            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Departure prohibited: Outpass was REJECTED ({outpass.rejectionReason || 'No reason provided'}).</span>
                            </div>
                          )}

                          {isReturned && (
                            <span className="text-xs text-slate-500 font-mono self-center">
                              Outpass returned & closed.
                            </span>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Confirm departure (exit) for student ${outpass.studentName}?`)) {
                                  outpassExitMutation.mutate(outpass.id);
                                }
                              }}
                              disabled={outpassExitMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded transition shadow-xs flex items-center gap-1.5"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Record Gate Departure (Exit)
                            </button>
                          )}

                          {isExited && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Confirm return (entry) for student ${outpass.studentName}?`)) {
                                  outpassEntryMutation.mutate(outpass.id);
                                }
                              }}
                              disabled={outpassEntryMutation.isPending}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded transition shadow-xs flex items-center gap-1.5"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              Record Gate Return (Entry)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 6. MODALS & SUB-FLOWS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}

      {/* A. VISITOR WEBCAM MODAL */}
      <VisitorWebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onRecognized={handleVisitorRecognized}
        onRegisterNew={handleVisitorRegisterNew}
      />

      {/* B. VISITOR REGISTRATION / VERIFICATION REVIEW MODAL */}
      <AnimatePresence>
        {isNewVisitorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-md w-full max-w-lg overflow-hidden shadow-lg max-h-[90vh] flex flex-col"
            >
              <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  {recognizedVisitorData?.matched ? (
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <PlusCircle className="w-5 h-5 text-emerald-400" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold">
                      {recognizedVisitorData?.matched ? 'Returning Visitor Identified' : 'Register & Authorize Visitor'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {recognizedVisitorData?.matched
                        ? 'Details auto-filled from facial match record'
                        : 'Review details and log authorized gate entry'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewVisitorModalOpen(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleVisitorFormSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
                {/* Photo Preview Badge */}
                {visitorPhotoPreview && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center gap-3">
                    <img
                      src={visitorPhotoPreview}
                      alt="Captured"
                      className="w-14 h-14 rounded object-cover border border-slate-200 bg-white"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">
                        {recognizedVisitorData?.matched ? 'Matched Returning Face' : 'Captured Visitor Photo'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Stored in database for automated recognition on future visits.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Visitor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={vFormName}
                    onChange={(e) => setVFormName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={vFormMobile}
                      onChange={(e) => setVFormMobile(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Host Department
                    </label>
                    <select
                      value={vFormDept}
                      onChange={(e) => setVFormDept(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="IT">Information Technology (IT)</option>
                      <option value="COMP">Computer Engineering (COMP)</option>
                      <option value="ENTC">Electronics & Telecom (ENTC)</option>
                      <option value="ADMIN">Administration</option>
                      <option value="HOSTEL">Hostel Office</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Host Person / Faculty Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Sharma / Warden Office"
                    value={vFormHost}
                    onChange={(e) => setVFormHost(e.target.value)}
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
                    placeholder="e.g. Parent Meeting / Guest Lecture"
                    value={vFormPurpose}
                    onChange={(e) => setVFormPurpose(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ID Proof Type
                    </label>
                    <select
                      value={vFormIdType}
                      onChange={(e) => setVFormIdType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="College ID">College ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ID Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={vFormIdNumber}
                      onChange={(e) => setVFormIdNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Vehicle Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH12AB1234"
                    value={vFormVehicle}
                    onChange={(e) => setVFormVehicle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewVisitorModalOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={visitorCheckInMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authorize & Log Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. VISITOR EXIT SEARCH MODAL */}
      <AnimatePresence>
        {isVisitorExitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-md w-full max-w-md overflow-hidden shadow-lg"
            >
              <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm font-bold">Visitor Departure (Exit)</h3>
                </div>
                <button
                  onClick={() => {
                    setIsVisitorExitOpen(false);
                    setSelectedVisitorForExit(null);
                    setVisitorExitQuery('');
                  }}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <form onSubmit={handleVisitorExitSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Mobile number or Pass #"
                    value={visitorExitQuery}
                    onChange={(e) => setVisitorExitQuery(e.target.value)}
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
                      onClick={() => visitorCheckOutMutation.mutate({ visitorId: selectedVisitorForExit.id })}
                      disabled={visitorCheckOutMutation.isPending}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-2 rounded transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Confirm & Log Departure
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded">
                    <Search className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500">
                      Search visitor by 10-digit mobile number or Pass number above.
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

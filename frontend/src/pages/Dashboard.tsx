import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { StatsCard } from '../components/ui/StatsCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Input } from '../components/ui/Input';
import { api } from '../api/axios';
import { visitorApi } from '../api/visitors';
import { guardApi } from '../api/guards';

import { ApiResponse, GuardSelfDashboardResponse, SystemStatisticsResponse, Visitor } from '../types';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Clock,
  PlusCircle,
  Car,
  GraduationCap,
  Activity,
  Ticket,
  LogOut,
  CheckCircle,
  Package,
  Play,
  History as HistoryIcon,
  MapPin,
  Calendar,
  Building,
  Send,
  Eye,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Home,
  Camera,
  ScanFace,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Printer,
  XCircle,
} from 'lucide-react';
import { hostelOutpassApi } from '../api/hostelOutpasses';
import { studentPassApi } from '../api/studentPasses';
import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';
import { GuardDashboardView } from '../components/guard/GuardDashboardView';
import { GraphicalAnalyticsHub } from '../components/guard/GraphicalAnalyticsHub';
import { VisitorWebcamModal } from '../components/visitor/VisitorWebcamModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Role detection
  const role = user?.role || '';
  const isGuard = role === 'SECURITY_GUARD' || role === 'GUARD' || role === 'SECURITY_OFFICER';
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'FACULTY' || role === 'STAFF';

  // Redirect unsupported roles or teacher role
  useEffect(() => {
    if (isTeacher) {
      navigate('/teacher', { replace: true });
    } else if (!isGuard && !isStudent) {
      navigate('/enter');
    }
  }, [isGuard, isStudent, isTeacher, navigate]);

  const [isSimplifiedGuardView, setIsSimplifiedGuardView] = useState(true);

  // Real-time Active Visitors Inside Campus (polling every 3s) — guards only
  const { 
    data: activeVisitorsList,
    refetch: refetchActiveVisitors,
    isRefetching: isRefetchingActiveVisitors,
  } = useQuery<Visitor[]>({
    queryKey: ['active-visitors-dashboard'],
    queryFn: async () => {
      try {
        return await visitorApi.getActiveInside();
      } catch (err) {
        return [];
      }
    },
    enabled: isGuard,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Section F3: Real-time refresh / polling for Guard Dashboard (every 3s)
  const { 
    data: guardData, 
    isLoading: isGuardLoading,
    isError: isGuardError,
    refetch: refetchGuardDashboard,
    isRefetching: isRefetchingGuardDashboard,
  } = useQuery<GuardSelfDashboardResponse>({
    queryKey: ['guard-self-dashboard', user?.id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GuardSelfDashboardResponse>>('/dashboard/guard');
      return res.data.data;
    },
    enabled: isGuard,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 0,
    retry: 2,
  });

  // Details Tab Lifetime & Filtered Statistics State
  const [statsFilterType, setStatsFilterType] = useState<'LIFETIME' | 'CUSTOM'>('LIFETIME');
  const [statsCustomStart, setStatsCustomStart] = useState<string>('');
  const [statsCustomEnd, setStatsCustomEnd] = useState<string>('');
  const [appliedCustomStart, setAppliedCustomStart] = useState<string>('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState<string>('');
  const [customDateError, setCustomDateError] = useState<string | null>(null);

  const {
    data: systemStats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchSystemStats,
    isRefetching: isStatsRefetching,
  } = useQuery<SystemStatisticsResponse>({
    queryKey: ['system-statistics', statsFilterType, appliedCustomStart, appliedCustomEnd],
    queryFn: async () => {
      const params: any = { filterType: statsFilterType };
      if (statsFilterType === 'CUSTOM') {
        if (appliedCustomStart) params.fromDate = appliedCustomStart;
        if (appliedCustomEnd) params.toDate = appliedCustomEnd;
      }
      return await guardApi.getSystemStatistics(params);
    },
    enabled: isGuard && !isSimplifiedGuardView,
    staleTime: 4000,
  });

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statsCustomStart || !statsCustomEnd) {
      setCustomDateError('Please select both start date and end date.');
      return;
    }
    if (new Date(statsCustomEnd) < new Date(statsCustomStart)) {
      setCustomDateError('End date cannot be earlier than start date.');
      return;
    }
    setCustomDateError(null);
    setAppliedCustomStart(statsCustomStart);
    setAppliedCustomEnd(statsCustomEnd);
  };

  const handleResetToLifetime = () => {
    setStatsFilterType('LIFETIME');
    setCustomDateError(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleManualRefresh = async () => {
    try {
      await Promise.all([
        refetchGuardDashboard(),
        refetchActiveVisitors(),
        refetchSystemStats(),
        queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['active-visitors-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['system-statistics'] }),
      ]);
      toast.success('Dashboard metrics refreshed');
    } catch {
      toast.error('Failed to refresh dashboard');
    }
  };



  // Section I1: Visitor Autofill Profile Details & Digital Token State
  const [visitorName, setVisitorName] = useState(user?.fullName || '');
  const [visitorMobile, setVisitorMobile] = useState(user?.phone || '');
  const [hostDept, setHostDept] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [activeToken, setActiveToken] = useState<any>(null);

  // Visitor Webcam & Biometric state
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [webcamMode, setWebcamMode] = useState<'capture' | 'recognize'>('recognize');
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
  const [capturedPhotoPreview, setCapturedPhotoPreview] = useState<string | null>(null);
  const [recognizedMatch, setRecognizedMatch] = useState<any>(null);



  // Real-time visitor active/pending token query
  const { data: myActiveTokenData, refetch: refetchMyActiveToken } = useQuery<Visitor | null>({
    queryKey: ['visitor-my-active-token', user?.id],
    queryFn: async () => {
      try {
        return await visitorApi.getMyActiveToken();
      } catch (err) {
        return null;
      }
    },
    enabled: false,
    refetchInterval: 4000,
  });

  // Digital Token Request Mutation
  const requestTokenMutation = useMutation({
    mutationFn: (payload: { data: any; photo?: Blob | null }) =>
      visitorApi.requestToken(payload.data, payload.photo),
    onSuccess: (data) => {
      setActiveToken(data);
      refetchMyActiveToken();
      toast.success(`Digital Token #${data.passNumber || data.id} generated! Awaiting guard clearance.`);
      setPurpose('');
      setRecognizedMatch(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to request digital token');
    },
  });

  const handleVisitorRecognized = (match: any) => {
    if (match.matched) {
      if (match.visitorName) setVisitorName(match.visitorName);
      if (match.mobileNumber) setVisitorMobile(match.mobileNumber);
      if (match.hostName || match.hostDepartment) {
        setHostDept(match.hostName || `${match.hostDepartment} Dept`);
      }
      if (match.purpose) setPurpose(match.purpose);
      if (match.vehicleNumber) setVehicleNo(match.vehicleNumber);
      setRecognizedMatch(match);
      toast.success(`Welcome back, ${match.visitorName}! Details auto-filled from facial match.`);
    }
  };

  const handleVisitorCapture = (blob: Blob) => {
    setCapturedPhotoBlob(blob);
    setCapturedPhotoPreview(URL.createObjectURL(blob));
    setIsWebcamOpen(false);
    toast.info('Photo captured successfully! Ready for biometric enrollment and token generation.');
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorMobile.trim() || !purpose.trim()) {
      toast.error('Please fill Visitor Name, Mobile Number, and Purpose of Visit');
      return;
    }
    if (!capturedPhotoBlob && !recognizedMatch) {
      toast.warning('Please capture your photo first using the camera so guards can verify and approve your token.');
    }
    requestTokenMutation.mutate({
      data: {
        name: visitorName.trim(),
        mobile: visitorMobile.trim(),
        purpose: purpose.trim(),
        hostName: hostDept.trim() || 'General Inquiry',
        hostType: 'FACULTY',
        hostDepartment: 'IT',
        gateId: 1,
        idProofType: 'Aadhaar / Digital ID',
        idProofNumber: 'VT-' + Math.floor(100000 + Math.random() * 900000),
        vehicleNumber: vehicleNo.trim() || undefined,
      },
      photo: capturedPhotoBlob,
    });
  };

  // RENDER VISITOR DASHBOARD (Section I2)
  if (!user) {
    const currentToken = myActiveTokenData || activeToken;
    const isPending = currentToken?.status === 'PENDING';
    const isApproved = currentToken?.status === 'APPROVED' || currentToken?.status === 'ACTIVE' || (!currentToken?.status && currentToken?.timeIn);
    const isRejected = currentToken?.status === 'REJECTED';

    return (
      <div className="space-y-6">
        {/* Banner */}
        <div style={{ background: 'var(--ink)', padding: '20px 24px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(47,93,124,0.18)', border: '1px solid rgba(47,93,124,0.35)', borderRadius: 2, padding: '2px 8px', display: 'inline-block', marginBottom: 10 }}>
            Visitor Portal
          </span>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, color: '#f0ede8', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            Welcome, {user?.fullName || 'Visitor'}
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Generate your secure digital entry token, capture your biometric photo, and track guard gate clearance in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Visit Request Card */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PlusCircle style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} />
                New Visit Request
              </h3>
              <button
                type="button"
                onClick={() => {
                  setWebcamMode('recognize');
                  setIsWebcamOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition"
                title="Scan face to automatically look up your previous visits and pre-fill this form"
              >
                <ScanFace className="w-3.5 h-3.5 text-indigo-600" />
                <span>Scan Face to Auto-Fill</span>
              </button>
            </div>

            {/* Recognized Visitor Banner */}
            {recognizedMatch && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>Recognized Returning Visitor:</strong> {recognizedMatch.visitorName || 'Matched Subject'} ({(recognizedMatch.similarity ?? 85).toFixed(0)}% similarity).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecognizedMatch(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-[11px] underline ml-2"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Photo Capture Section */}
            <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <div className="flex items-center gap-3">
                {capturedPhotoPreview ? (
                  <img
                    src={capturedPhotoPreview}
                    alt="Captured Visitor"
                    className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-sm bg-white"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-800 m-0">
                    {capturedPhotoPreview ? 'Biometric Photo Attached' : 'Visitor Photo Required'}
                  </p>
                  <p className="text-[11px] text-slate-500 m-0">
                    {capturedPhotoPreview
                      ? 'Photo will be stored for gate verification and future quick recognition.'
                      : 'Capture a clear live photo to enable guard approval and future auto-match.'}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant={capturedPhotoPreview ? 'outline' : 'secondary'}
                size="sm"
                onClick={() => {
                  setWebcamMode('capture');
                  setIsWebcamOpen(true);
                }}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                {capturedPhotoPreview ? 'Retake' : 'Capture Photo'}
              </Button>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-4">
              <Input
                label="Visitor Name (Autofilled)"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                required
                placeholder="Your full name"
              />
              <Input
                label="Mobile Number (Autofilled)"
                value={visitorMobile}
                onChange={(e) => setVisitorMobile(e.target.value)}
                required
                placeholder="10-digit mobile number"
              />
              <Input
                label="Host Person or Department"
                value={hostDept}
                onChange={(e) => setHostDept(e.target.value)}
                placeholder="e.g. Prof. Sharma / IT Dept / Admin"
              />
              <Input
                label="Purpose of Visit"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                placeholder="e.g. Admission Enquiry, Campus Tour, Parent Meeting"
              />
              <Input
                label="Vehicle Number (Optional)"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="e.g. MH12AB1234"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={requestTokenMutation.isPending}
              >
                Generate Digital Token
              </Button>
            </form>
          </Card>

          {/* Active Token & Visit Status */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ticket style={{ width: 16, height: 16, color: '#047857', flexShrink: 0 }} />
                My Active Token & Status
              </h3>
              {currentToken && (
                <button
                  type="button"
                  onClick={() => refetchMyActiveToken()}
                  className="text-[11px] text-slate-500 hover:text-slate-700 underline"
                >
                  Refresh Status
                </button>
              )}
            </div>

            {currentToken ? (
              <div style={{ background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: 20 }}>
                {/* Header with Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12, marginBottom: 14 }}>
                  <div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                      Token Number
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
                      {currentToken.passNumber || `VT-${currentToken.id}`}
                    </span>
                  </div>

                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 rounded">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        PENDING GUARD APPROVAL
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 rounded">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        APPROVED — ACTIVE PASS
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-300 bg-rose-950/70 border border-rose-500/40 rounded">
                        REQUEST REJECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Notice Alert */}
                {isPending && (
                  <div className="mb-4 p-3 bg-amber-950/40 border border-amber-600/30 rounded text-xs text-amber-200">
                    <p className="font-semibold m-0 mb-1">⏳ Awaiting Security Guard Clearance</p>
                    <p className="text-[11px] text-amber-300/80 m-0">
                      Your digital token has been registered. When you arrive at the gate terminal, present this token number to the security guard for entrance approval.
                    </p>
                  </div>
                )}

                {isApproved && (
                  <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-600/30 rounded text-xs text-emerald-200">
                    <p className="font-semibold m-0 mb-1">✓ Entrance Cleared</p>
                    <p className="text-[11px] text-emerald-300/80 m-0">
                      Gate security has approved your token. You may proceed to your host destination on campus.
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', fontSize: 11 }}>Visitor Name</p>
                    <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>{currentToken.name}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', fontSize: 11 }}>Mobile</p>
                    <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>{currentToken.mobile}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', fontSize: 11 }}>Host / Dept</p>
                    <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>
                      {currentToken.hostName || currentToken.hostDepartment || 'General Inquiry'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', fontSize: 11 }}>Purpose</p>
                    <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>{currentToken.purpose}</p>
                  </div>
                  {currentToken.vehicleNumber && (
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', fontSize: 11 }}>Vehicle</p>
                      <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>{currentToken.vehicleNumber}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', fontSize: 11 }}>Request / Entry Time</p>
                    <p style={{ color: '#6ee7b7', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                      {new Date(currentToken.timeIn || currentToken.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', fontSize: 11 }}>Valid Till</p>
                    <p style={{ color: 'var(--accent)', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                      {new Date(new Date(currentToken.timeIn || currentToken.createdAt).getTime() + 4 * 3600000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveToken(null);
                      setCapturedPhotoBlob(null);
                      setCapturedPhotoPreview(null);
                    }}
                  >
                    Request New Token
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--line)', borderRadius: 4 }}>
                <Ticket style={{ width: 28, height: 28, color: 'var(--line)', margin: '0 auto 10px' }} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--mute)', fontWeight: 500, margin: '0 0 4px' }}>
                  No active token currently.
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--line)', margin: 0 }}>
                  Capture your photo and fill out the form on the left to request a digital pass.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Visitor Webcam Capture Modal */}
        <VisitorWebcamModal
          isOpen={isWebcamOpen}
          onClose={() => setIsWebcamOpen(false)}
          onRegisterNew={(blob) => {
            if (blob) handleVisitorCapture(blob);
            setIsWebcamOpen(false);
          }}
          onRecognized={(match, blob) => {
            handleVisitorRecognized(match);
            if (blob) handleVisitorCapture(blob);
            setIsWebcamOpen(false);
          }}
        />
      </div>
    );
  }

  // RENDER STUDENT DASHBOARD (PRN Verified & Outpass Management)
  if (isStudent) {
    const studentPrn = user?.username || 'F24IT32';
    const studentName = user?.fullName || 'Shanaya';

    return <StudentDashboardView studentName={studentName} studentPrn={studentPrn} user={user} navigate={navigate} />;
  }

  // RENDER GUARD DASHBOARD (Section F2 & F3: Dynamic Real-time Polling)
  if (isGuard) {
    if (isSimplifiedGuardView) {
      return (
        <GuardDashboardView
          user={user}
          guardSummary={guardData || null}
          activeVisitors={activeVisitorsList || []}
          onToggleDetailedView={() => setIsSimplifiedGuardView(false)}
        />
      );
    }

    const summary = guardData || {
      guardName: user?.fullName || 'Guard Officer',
      guardId: 'G-' + user?.id,
      gateName: 'Main Gate',
      shiftName: 'Morning Shift',
      shiftStartTime: new Date().toISOString(),
      shiftEndTime: null,
      dutyStatus: 'ON DUTY',
      visitorsEnteredToday: 0,
      visitorsExitedToday: 0,
      vehiclesEnteredToday: 0,
      vehiclesExitedToday: 0,
      materialsProcessedToday: 0,
      studentPassesProcessedToday: 0,
      activeVisitorsInsideCampus: 0,
      recentLogs: [],
    };

    const isLifetime = statsFilterType === 'LIFETIME';
    const isCustom = statsFilterType === 'CUSTOM';

    return (
      <div className="space-y-6">
        {/* Printable Report Header (Visible only in print) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">CAMPUSACCESS</h1>
              <p className="text-xs uppercase tracking-widest text-slate-600 font-semibold mt-0.5">
                Enterprise Gate Security & Biometric Access Terminal
              </p>
              <h2 className="text-lg font-bold text-slate-800 mt-2">
                Guard Dashboard — {isLifetime ? 'Lifetime Historical Statistics Report' : `${systemStats?.label || 'Period'} Statistics Report`}
              </h2>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Official Audit Document</p>
              <p>Generated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' })}</p>
              <p className="mt-1 font-mono text-[11px] bg-slate-100 p-1 rounded inline-block">
                Scope: {isLifetime ? 'Complete Lifetime Historical Dataset' : (systemStats?.label || statsFilterType)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-3 border-t border-slate-200 text-xs">
            <div><strong>Duty Officer:</strong> {summary.guardName} ({summary.guardId})</div>
            <div><strong>Assigned Gate:</strong> {summary.gateName}</div>
            <div><strong>Shift:</strong> {summary.shiftName} ({summary.dutyStatus})</div>
          </div>
        </div>

        {/* Modern Clean Duty Terminal Card (Screen only) */}
        <div className="print:hidden bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs transition-all hover:shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                {summary.guardName ? summary.guardName[0].toUpperCase() : 'G'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight capitalize">
                    {summary.guardName}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {summary.dutyStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                    {summary.shiftName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    ID: <strong className="font-semibold text-slate-700">{summary.guardId}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    Gate: <strong className="font-semibold text-slate-700">{summary.gateName}</strong>
                  </span>
                  {summary.shiftStartTime && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>
                        Shift In: <span className="font-mono text-slate-700">{new Date(summary.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSimplifiedGuardView(true)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5 text-slate-600" />}
                className="shadow-xs font-medium text-slate-700 hover:text-slate-900 border-slate-300 justify-center min-h-[38px]"
              >
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-3.5 h-3.5 text-indigo-600" />}
                className="shadow-xs font-semibold text-indigo-700 hover:text-indigo-900 border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer justify-center min-h-[38px]"
              >
                Print Statistics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${(isRefetchingGuardDashboard || isStatsRefetching) ? 'animate-spin text-indigo-600' : ''}`} />}
                className="shadow-xs cursor-pointer justify-center min-h-[38px]"
                disabled={isRefetchingGuardDashboard || isStatsRefetching}
              >
                {isRefetchingGuardDashboard || isStatsRefetching ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Date and Month Filters Bar (Screen only) */}
        <div className="print:hidden bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Statistics Scope & Period Filters</h3>
                <p className="text-xs text-slate-500">
                  Switch between complete lifetime data and custom date range
                </p>
              </div>
            </div>

            {/* Quick Lifetime Reset Button if not on lifetime */}
            {!isLifetime && (
              <button
                type="button"
                onClick={handleResetToLifetime}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Reset to Lifetime (All Records)
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3.5">
            <button
              type="button"
              onClick={() => { setStatsFilterType('LIFETIME'); setCustomDateError(null); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                isLifetime
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Lifetime (All Time)</span>
            </button>

            <button
              type="button"
              onClick={() => { setStatsFilterType('CUSTOM'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                isCustom
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Custom Date Range</span>
            </button>
          </div>

          {/* Sub-controls for Custom Range */}
          {isCustom && (
            <form onSubmit={handleApplyCustomRange} className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2">
                <label className="text-xs font-medium text-slate-600 shrink-0">Start Date:</label>
                <input
                  type="date"
                  value={statsCustomStart}
                  onChange={(e) => setStatsCustomStart(e.target.value)}
                  required
                  className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 w-full xs:w-auto min-h-[38px]"
                />
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2">
                <label className="text-xs font-medium text-slate-600 shrink-0">End Date:</label>
                <input
                  type="date"
                  value={statsCustomEnd}
                  onChange={(e) => setStatsCustomEnd(e.target.value)}
                  required
                  className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 w-full xs:w-auto min-h-[38px]"
                />
              </div>

              <Button type="submit" variant="primary" size="sm" className="text-xs py-2 px-4 justify-center min-h-[38px]">
                Apply Range
              </Button>

              {customDateError && (
                <span className="text-xs text-rose-600 font-semibold flex items-center gap-1 w-full sm:w-auto">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {customDateError}
                </span>
              )}
            </form>
          )}
        </div>

        {/* ADVANCED GRAPHICAL ANALYTICS & TREND VISUALIZATIONS */}
        <div className="print:hidden">
          <GraphicalAnalyticsHub />
        </div>

        {/* PRIMARY VISITOR METRICS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Visitor Access Lifecycle Metrics</span>
              <span className="text-[11px] font-normal normal-case text-slate-500">
                ({isLifetime ? 'Lifetime Cumulative' : systemStats?.label || 'Selected Period'})
              </span>
            </h2>
            {isStatsLoading && (
              <span className="text-xs text-indigo-600 animate-pulse font-medium">Calculating database totals...</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 1. Total Visitors Handled */}
            <StatsCard
              title={isLifetime ? "Total Visitors Handled" : "Visitors in Period"}
              value={isStatsLoading ? '...' : (systemStats?.totalVisitors ?? summary.visitorsEnteredToday)}
              icon={<Users className="w-6 h-6" />}
              colorTheme="indigo"
              description={isLifetime ? "All-time recorded entries" : `Recorded in selected period`}
            />

            {/* 2. Total Approved */}
            <StatsCard
              title="Approved Visitors"
              value={isStatsLoading ? '...' : (systemStats?.approvedVisitors ?? summary.visitorsEnteredToday)}
              icon={<CheckCircle2 className="w-6 h-6" />}
              colorTheme="emerald"
              description={isLifetime ? "Total entries approved" : "Approved within period"}
            />

            {/* 3. Total Rejected */}
            <StatsCard
              title="Rejected Visitors"
              value={isStatsLoading ? '...' : (systemStats?.rejectedVisitors ?? 0)}
              icon={<XCircle className="w-6 h-6" />}
              colorTheme="rose"
              description={isLifetime ? "Total tokens rejected" : "Rejected within period"}
            />

            {/* 4. Completed Visits */}
            <StatsCard
              title="Completed Visits"
              value={isStatsLoading ? '...' : (systemStats?.completedVisits ?? summary.visitorsExitedToday)}
              icon={<LogOut className="w-6 h-6" />}
              colorTheme="purple"
              description={isLifetime ? "All checked-out visits" : "Checked out in period"}
            />

            {/* 5. Currently Inside Campus */}
            <StatsCard
              title="Currently Inside Campus"
              value={isStatsLoading ? '...' : (systemStats?.currentlyInside ?? summary.activeVisitorsInsideCampus)}
              icon={<Building className="w-6 h-6" />}
              colorTheme="cyan"
              description="Live campus occupancy"
            />
          </div>
        </div>

        {/* SYSTEM-WIDE CROSS-DOMAIN METRICS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cross-Domain Campus Access Operations</span>
              <span className="text-[11px] font-normal normal-case text-slate-500">
                ({isLifetime ? 'System Lifetime' : systemStats?.label || 'Selected Period'})
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Vehicles Logged */}
            <StatsCard
              title="Vehicles Logged"
              value={isStatsLoading ? '...' : (systemStats?.totalVehicles ?? summary.vehiclesEnteredToday)}
              icon={<Car className="w-6 h-6" />}
              colorTheme="cyan"
              description={isLifetime ? "All-time vehicle logs" : "Logged in selected period"}
            />

            {/* Student Gate Passes */}
            <StatsCard
              title="Student Gate Passes"
              value={isStatsLoading ? '...' : (systemStats?.totalStudentPasses ?? summary.studentPassesProcessedToday ?? 0)}
              icon={<Ticket className="w-6 h-6" />}
              colorTheme="indigo"
              description={isLifetime ? "Total student passes" : "Issued in period"}
            />

            {/* Hostel Outpasses */}
            <StatsCard
              title="Hostel Outpasses"
              value={isStatsLoading ? '...' : (systemStats?.totalHostelOutpasses ?? summary.hostelVerifications ?? 0)}
              icon={<GraduationCap className="w-6 h-6" />}
              colorTheme="amber"
              description={isLifetime ? "Total hostel outpasses" : "Processed in period"}
            />

            {/* Vendor Visits */}
            <StatsCard
              title="Vendor & Material Visits"
              value={isStatsLoading ? '...' : (systemStats?.totalVendorVisits ?? summary.materialsProcessedToday)}
              icon={<Package className="w-6 h-6" />}
              colorTheme="emerald"
              description={isLifetime ? "Total vendor entries" : "Entries in period"}
            />

            {/* Pending Approvals */}
            <StatsCard
              title="Pending Pass Approvals"
              value={isStatsLoading ? '...' : (systemStats?.pendingTokens ?? 0)}
              icon={<Clock className="w-6 h-6" />}
              colorTheme="amber"
              description="Awaiting guard clearance"
            />
          </div>
        </div>

        {/* Printable Report Verification Footer (Visible only in print) */}
        <div className="hidden print:block mt-10 pt-6 border-t-2 border-slate-900 text-xs text-slate-600">
          <div className="flex justify-between items-end">
            <div>
              <p className="font-semibold text-slate-800">Verification & Sign-off:</p>
              <div className="mt-8 pt-1 border-t border-slate-400 w-64">
                <p>Authorized Guard Signature / Seal</p>
                <p className="text-[10px] text-slate-500">Name: {summary.guardName} (Terminal: {summary.guardId})</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-slate-500">Document ID: CA-SEC-{Date.now()}</p>
              <p className="text-[10px] text-slate-500">System Timezone: Asia/Kolkata (IST)</p>
              <p className="text-[10px] font-semibold text-slate-700 mt-1">CampusAccess Gate Security Terminal</p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // FALLBACK: Unsupported role - navigate to login (done via useEffect below)
  return null;
};

// ============================================================
// STUDENT DASHBOARD VIEW (Landing Page Match: Light Theme, Indigo & Emerald Accents)
// ============================================================
interface StudentDashboardViewProps {
  studentName: string;
  studentPrn: string;
  user: any;
  navigate: any;
}

const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ studentName, studentPrn, user, navigate }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pass' | 'apply' | 'history'>('pass');
  const [showGuardModal, setShowGuardModal] = useState(false);

  // Form State for New Outpass Application
  const toLocalISOString = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // Real API Query for Student Outpasses — declared first so we can use data in form init
  const { data: realOutpassesData, isLoading: isOutpassesLoading, refetch: refetchOutpasses } = useQuery({
    queryKey: ['student-outpasses-dashboard', studentPrn],
    queryFn: async () => {
      try {
        const res = await hostelOutpassApi.getOutpasses({ studentPrn });
        return res?.content || (Array.isArray(res) ? res : []);
      } catch (err) {
        return [];
      }
    },
    enabled: !!studentPrn,
    refetchInterval: 10000,
  });

  const outpassList = realOutpassesData || [];
  const latestRecorded = outpassList[0];

  const [studentHostel, setStudentHostel] = useState(latestRecorded?.studentHostel || '');
  const [studentRoom, setStudentRoom] = useState(latestRecorded?.studentRoom || latestRecorded?.roomNumber || '');
  const [studentClass, setStudentClass] = useState(latestRecorded?.studentClass || '');
  const [studentDivision, setStudentDivision] = useState(latestRecorded?.studentDivision || '');
  const [parentContact, setParentContact] = useState(latestRecorded?.parentContact || '');
  const [emergencyPhone, setEmergencyPhone] = useState(latestRecorded?.emergencyContact || '');
  const [studentMobile, setStudentMobile] = useState(user?.phone || latestRecorded?.studentMobile || '');
  const [outpassCategory, setOutpassCategory] = useState<'HOSTEL' | 'GATE_DAY'>('HOSTEL');

  const [reasonCategory, setReasonCategory] = useState('Medical Checkup');
  const [reasonDetails, setReasonDetails] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState(toLocalISOString(new Date()));
  const [expectedReturnTime, setExpectedReturnTime] = useState(toLocalISOString(new Date(Date.now() + 5 * 3600000)));
  const [parentConsent, setParentConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (latestRecorded) {
      setStudentHostel((prev) => prev || latestRecorded.studentHostel || '');
      setStudentRoom((prev) => prev || latestRecorded.studentRoom || latestRecorded.roomNumber || '');
      setStudentClass((prev) => prev || latestRecorded.studentClass || '');
      setStudentDivision((prev) => prev || latestRecorded.studentDivision || '');
      setParentContact((prev) => prev || latestRecorded.parentContact || '');
      setEmergencyPhone((prev) => prev || latestRecorded.emergencyContact || '');
      setStudentMobile((prev) => prev || user?.phone || latestRecorded.studentMobile || '');
    }
  }, [latestRecorded, user]);

  const activeOutpass = useMemo(() => {
    if (!realOutpassesData || realOutpassesData.length === 0) {
      return null;
    }
    return realOutpassesData.find((op: any) => op.status === 'APPROVED' || op.status === 'PENDING_WARDEN' || op.status === 'OUT_OF_CAMPUS') || null;
  }, [realOutpassesData]);

  // Handle New Outpass Form Submit
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonDetails.trim() || !destination.trim() || !studentHostel.trim() || !studentRoom.trim() || !parentContact.trim()) {
      toast.error('Please fill in Hostel Block, Room, Parent Mobile, Reason, and Destination');
      return;
    }

    setIsSubmitting(true);
    try {
      if (outpassCategory === 'GATE_DAY') {
        // Direct Gate Day Pass: Sent directly to Guard Terminal for review & approval
        const payload = {
          studentName: studentName || user?.fullName,
          studentPrn: (studentPrn || user?.username || '').toUpperCase(),
          studentDepartment: 'Engineering',
          studentClass: studentClass.trim() || 'BE',
          studentDivision: studentDivision.trim() || '1',
          studentMobile: studentMobile.trim() || user?.phone || '',
          purpose: `[${reasonCategory}] ${reasonDetails.trim()}`,
          destination: destination.trim(),
          departureTime: new Date(departureTime).toISOString(),
          expectedReturnTime: new Date(expectedReturnTime).toISOString(),
        };

        await studentPassApi.createPass(payload);
        toast.success('Gate pass requested successfully! Sent to Guard for approval.');
        queryClient.invalidateQueries({ queryKey: ['student-passes'] });
        queryClient.invalidateQueries({ queryKey: ['guard-pending-student-passes'] });
      } else {
        // Hostel Overnight Outpass
        const payload = {
          studentName: studentName || user?.fullName,
          studentPrn: studentPrn || user?.username,
          studentHostel: studentHostel.trim(),
          studentRoom: studentRoom.trim(),
          studentClass: studentClass.trim() || 'BE',
          studentDivision: studentDivision.trim() || '1',
          studentMobile: studentMobile.trim() || user?.phone || '',
          parentContact: parentContact.trim(),
          emergencyContact: emergencyPhone.trim() || undefined,
          reason: `[${reasonCategory}] ${reasonDetails.trim()}`,
          studentNote: `Parent consent verified: ${parentConsent ? 'Yes' : 'No'}`,
          destination: destination.trim(),
          departureTime: new Date(departureTime).toISOString(),
          expectedReturnTime: new Date(expectedReturnTime).toISOString(),
        };

        await hostelOutpassApi.createOutpass(payload);
        toast.success('Outpass application submitted to Hostel Warden!');
        queryClient.invalidateQueries({ queryKey: ['student-outpasses-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      }

      setActiveTab('pass');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit outpass');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Default Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [confirmStudentPassword, setConfirmStudentPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleStudentPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { toast.error('Current password is required'); return; }
    if (!newStudentPassword || newStudentPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (studentPrn && newStudentPassword.trim().toUpperCase() === studentPrn.trim().toUpperCase()) {
      toast.error('New password must not equal your college PRN');
      return;
    }
    if (newStudentPassword !== confirmStudentPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword: newStudentPassword,
        confirmPassword: confirmStudentPassword,
      });
      toast.success('Password changed successfully! Your account is now secured.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewStudentPassword('');
      setConfirmStudentPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Default Password Alert Advisory Card */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-300 font-sans m-0">
            <strong>Security Notice:</strong> If you are still using your default college PRN as your password, secure your account now.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-3 py-1 rounded font-medium transition"
        >
          Update Default Password
        </button>
      </div>

      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ background: 'var(--ink)', padding: '20px 24px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-400/30 rounded-md text-xs font-medium text-emerald-300 flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified Student Portal
              </span>
              <span className="px-2.5 py-1 bg-slate-800/90 border border-slate-700/80 rounded-md text-xs font-normal text-slate-300 font-sans">
                {latestRecorded?.studentHostel ? `${latestRecorded.studentHostel} • Room ${latestRecorded.studentRoom || latestRecorded.roomNumber}` : 'Hostel Resident: Self-declared'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold mt-2.5 tracking-tight text-white font-sans">
              Welcome, {studentName}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-2.5 font-sans">
              <span>PRN: <span className="font-semibold text-blue-400">{studentPrn}</span></span>
              {latestRecorded?.studentClass && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>Class: <strong className="text-slate-200">{latestRecorded.studentClass}</strong></span>
                </>
              )}
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Outpass Permitted
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              onClick={() => setActiveTab('apply')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Apply Outpass
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowGuardModal(true)}
              leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-300" />}
            className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Show Digital Pass
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('pass')}
            style={{
              padding: '7px 16px', borderRadius: 2, fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'all 0.15s',
              background: activeTab === 'pass' ? 'white' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'pass' ? 'var(--ink)' : 'rgba(255,255,255,0.5)',
              border: activeTab === 'pass' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <ShieldCheck style={{ width: 13, height: 13, color: '#34d399' }} />
            Active Digital Gate Pass
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            style={{
              padding: '7px 16px', borderRadius: 2, fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'all 0.15s',
              background: activeTab === 'apply' ? 'white' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'apply' ? 'var(--ink)' : 'rgba(255,255,255,0.5)',
              border: activeTab === 'apply' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <FileText style={{ width: 13, height: 13, color: 'var(--accent)' }} />
            Apply Outpass Form
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '7px 16px', borderRadius: 2, fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'all 0.15s',
              background: activeTab === 'history' ? 'white' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'history' ? 'var(--ink)' : 'rgba(255,255,255,0.5)',
              border: activeTab === 'history' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <HistoryIcon style={{ width: 13, height: 13, color: '#2dd4bf' }} />
            My Applications History ({outpassList.length})
          </button>
        </div>
      </motion.div>

      {/* TAB CONTENT SWITCHING WITH FRAMER MOTION */}
      <AnimatePresence mode="wait">
        {/* TAB 1: ACTIVE DIGITAL GATE PERMISSION PASS */}
        {activeTab === 'pass' && (
          <motion.div
            key="pass-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {!activeOutpass ? (
              <div className="lg:col-span-3">
                <Card className="border border-[--line] bg-white p-10 rounded-[4px] text-center max-w-xl mx-auto space-y-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">No Active Gate Permission Pass</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      You currently have no active or approved outpass on file. Total applications on record: {outpassList.length}.
                    </p>
                  </div>
                  <Button variant="primary" onClick={() => setActiveTab('apply')} leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Apply for New Outpass
                  </Button>
                </Card>
              </div>
            ) : (
              <>
                {/* Main Crisp White Digital Pass Card with Emerald Border */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border border-[--line] bg-white relative overflow-hidden p-6 rounded-[4px] text-slate-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <span className="px-3.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 w-fit shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          WARDEN APPROVED — PERMITTED FOR EXIT & ENTRY
                        </span>
                        <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                          Pass #{activeOutpass.outpassNumber}
                        </h3>
                      </div>

                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => setShowGuardModal(true)}
                        leftIcon={<Eye className="w-4 h-4" />}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs shadow-md shadow-emerald-600/20 shrink-0"
                      >
                        Show to Guard (Full View)
                      </Button>
                    </div>

                {/* Pass Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 hover:border-indigo-300 transition-colors">
                    <p className="text-slate-500 font-medium">Student Name & PRN</p>
                    <p className="text-slate-900 font-extrabold text-base mt-0.5">{activeOutpass.studentName}</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>PRN: {activeOutpass.studentPrn}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 hover:border-indigo-300 transition-colors">
                    <p className="text-slate-500 font-medium">Hostel & Room</p>
                    <p className="text-slate-900 font-extrabold text-base mt-0.5">{activeOutpass.studentHostel}</p>
                    <p className="text-slate-700 font-mono">Room: {activeOutpass.roomNumber}</p>
                  </div>

                  <div className="bg-amber-50/80 p-4 rounded-lg border border-amber-200 sm:col-span-2">
                    <p className="text-amber-800 font-extrabold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      Stated Reason for Outpass (Presented to Guard)
                    </p>
                    <p className="text-amber-950 font-bold text-sm mt-1 bg-white border border-amber-200 p-3 rounded-xl">
                      "{activeOutpass.reason}"
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                    <p className="text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Destination
                    </p>
                    <p className="text-slate-900 font-extrabold text-sm mt-0.5">{activeOutpass.destination}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                    <p className="text-slate-500 font-medium flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Verified Warden
                    </p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{activeOutpass.wardenName}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                    <p className="text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> Permitted Departure
                    </p>
                    <p className="text-emerald-700 font-mono font-extrabold text-sm mt-0.5">{activeOutpass.departureTime}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                    <p className="text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" /> Expected Return Cutoff
                    </p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{activeOutpass.expectedReturnTime}</p>
                  </div>
                </div>

                {/* Digital Gate Verification Badge */}
                <div style={{ background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} className="sm:flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white uppercase tracking-wider">Gate Checkpoint Ready</p>
                      <p className="text-[11px] text-slate-300">Guards verify student PRN <strong className="text-emerald-400 font-mono">{studentPrn}</strong> or Pass <span className="font-mono text-indigo-300 font-bold">{activeOutpass.outpassNumber}</span></p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => setShowGuardModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 px-4 shadow-md shrink-0"
                    leftIcon={<Ticket className="w-4 h-4 text-slate-950" />}
                  >
                    Present Security Pass
                  </Button>
                </div>
              </Card>
            </div>

            {/* Verification Progress Timeline Column */}
            <div className="space-y-6">
              <Card className="border border-[--line] bg-white p-6 rounded-[4px] text-slate-900">
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: '0 0 16px', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} />
                  Approval Status & Timeline
                </h3>

                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: Application Submitted */}
                  <div className="relative pl-10">
                    <div className="absolute left-1.5 top-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                      ✓
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">1. Student Application Filed</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Reason & Parent Consent Submitted</p>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">Completed</span>
                  </div>

                  {/* Step 2: Warden Verification */}
                  <div className="relative pl-10">
                    <div className="absolute left-1.5 top-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                      ✓
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">2. Hostel Warden Verified</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Approved by Mrs. S. Kulkarni</p>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">Verified & Stamp Attached</span>
                  </div>

                  {/* Step 3: Gate Security Permission */}
                  <div className="relative pl-10">
                    <div style={{ position: 'absolute', left: 6, top: 0, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, boxShadow: '0 1px 3px rgba(47,93,124,0.4)' }}
                      className="animate-pulse">
                      3
                    </div>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', margin: '0 0 2px' }}>3. Gate Security Active</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Present Pass #{activeOutpass.outpassNumber} at Gate 1 or Gate 2</p>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--accent)', fontWeight: 500 }}>Ready for Exit Log</span>
                  </div>
                </div>
              </Card>

                  <Card style={{ background: 'rgba(47,93,124,0.06)', border: '1px solid rgba(47,93,124,0.15)', borderRadius: 4, padding: '16px 20px' }}>
                    <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider mb-2.5">Campus Security Rules</h4>
                    <ul className="text-[11px] text-slate-600 space-y-2 list-disc list-inside font-medium">
                      <li>Show your Warden Approval reason to the guard when exiting.</li>
                      <li>Ensure return before <strong className="text-slate-900 font-bold">{activeOutpass.expectedReturnTime}</strong> to prevent late flags.</li>
                      <li>Emergency assistance phone: <strong className="text-indigo-700 font-bold">020-24371101</strong></li>
                    </ul>
                  </Card>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* TAB 2: APPLICATION FORM FOR HOSTEL OUTPASS / GATE PASS */}
        {activeTab === 'apply' && (
          <motion.div
            key="apply-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card className="w-full shadow-sm border border-slate-200 bg-white p-6 md:p-8 rounded-xl text-slate-900">
              <div className="border-b border-slate-200 pb-4 mb-6">
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  New Outpass Application Form
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in details for Warden verification. Once approved by your Hostel Warden, your digital permission pass will be active for security guards at the gate.
                </p>
              </div>

              <form onSubmit={handleSubmitApplication} className="space-y-6">
                {/* Outpass Type Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    Outpass Type Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOutpassCategory('HOSTEL')}
                       className={`p-5 rounded-[4px] border text-left transition-all duration-200 ${
                        outpassCategory === 'HOSTEL'
                          ? 'bg-[rgba(47,93,124,0.06)] border-[--accent] text-[--ink]'
                          : 'bg-[--paper] border-[--line] text-[--mute] hover:border-[--mute]'
                      }`}
                    >
                      <Building className="w-6 h-6 text-indigo-600 mb-2" />
                      <p className="text-sm font-bold text-slate-900">Hostel Overnight / Leave Pass</p>
                      <p className="text-xs text-slate-500 mt-1">For night out, weekend leave, or extended home visits</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutpassCategory('GATE_DAY')}
                       className={`p-5 rounded-[4px] border text-left transition-all duration-200 ${
                        outpassCategory === 'GATE_DAY'
                          ? 'bg-[rgba(47,93,124,0.06)] border-[--accent] text-[--ink]'
                          : 'bg-[--paper] border-[--line] text-[--mute] hover:border-[--mute]'
                      }`}
                    >
                      <LogOut className="w-6 h-6 text-teal-600 mb-2" />
                      <p className="text-sm font-bold text-slate-900">Gate Day Pass (Short Exit)</p>
                      <p className="text-xs text-slate-500 mt-1">For doctor visits, library work, or urgent errands (same day return)</p>
                    </button>
                  </div>
                </div>

                {/* Student Hostel & Room Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-[4px] border border-slate-200 text-xs">
                  <div>
                    <label className="text-slate-500 font-medium block mb-1">Student Name</label>
                    <p className="font-extrabold text-slate-900 text-sm">{studentName}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 font-medium block mb-1">PRN Number</label>
                    <p className="font-semibold text-blue-600 text-sm font-sans">{studentPrn}</p>
                  </div>
                  <div>
                    <Input
                      label="Hostel Block"
                      placeholder="e.g. Block A"
                      value={studentHostel}
                      onChange={(e) => setStudentHostel(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Room Number"
                      placeholder="e.g. 102"
                      value={studentRoom}
                      onChange={(e) => setStudentRoom(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Class"
                    placeholder="e.g. BE"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                  />
                  <Input
                    label="Division"
                    placeholder="e.g. 1"
                    value={studentDivision}
                    onChange={(e) => setStudentDivision(e.target.value)}
                  />
                  <Input
                    label="Student Mobile"
                    value={studentMobile}
                    onChange={(e) => setStudentMobile(e.target.value)}
                    placeholder="e.g. 9822012345"
                    disabled={!!user?.phone}
                    required
                  />
                </div>

                {/* Reason Selection & Details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Primary Reason Category</label>
                    <select
                      value={reasonCategory}
                      onChange={(e) => setReasonCategory(e.target.value)}
                      className="w-full bg-white border border-[--line] rounded-[4px] py-2.5 px-3 text-xs text-[--text] focus:outline-none focus:border-[--accent]"
                    >
                      <option value="Medical Checkup">Medical Checkup / Hospital Appointment</option>
                      <option value="Home Visit">Home Visit / Weekend Leave</option>
                      <option value="Academic Errand">Academic Project / Library Errand</option>
                      <option value="Personal Errand">Personal Errands / Shopping</option>
                      <option value="Emergency">Family Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Detailed Explanation of Reason (Required for Guard & Warden Verification)
                    </label>
                    <textarea
                      value={reasonDetails}
                      onChange={(e) => setReasonDetails(e.target.value)}
                      rows={3}
                      placeholder="Explain why you need to go outside (e.g., Doctor appointment at Sahyadri Hospital)..."
                      className="w-full bg-white border border-[--line] rounded-[4px] p-3 text-xs text-[--text] placeholder-[--mute] focus:outline-none focus:border-[--accent]"
                      required
                    />
                  </div>

                  <Input
                    label="Destination Address / City"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Sahyadri Hospital, Erandwane, Pune"
                    required
                  />
                </div>

                {/* Departure & Return Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Planned Departure Date & Time"
                    type="datetime-local"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                  />
                  <Input
                    label="Expected Return Date & Time"
                    type="datetime-local"
                    value={expectedReturnTime}
                    onChange={(e) => setExpectedReturnTime(e.target.value)}
                    required
                  />
                </div>

                {/* Emergency Contacts & Parent Consent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Parent Mobile Number"
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    required
                  />
                  <Input
                    label="Emergency Secondary Contact"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 bg-[--paper] p-4 rounded-[4px] border border-[--line]">
                  <input
                    type="checkbox"
                    id="parentConsent"
                    checked={parentConsent}
                    onChange={(e) => setParentConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300"
                  />
                  <label htmlFor="parentConsent" className="text-xs font-medium text-slate-700 cursor-pointer">
                    I confirm parent consent has been informed & Warden can verify with parent contact number.
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  leftIcon={<Send className="w-4.5 h-4.5" />}
                  className="w-full"
                >
                  Submit Application to Warden
                </Button>
              </form>
            </Card>
          </motion.div>
        )}

        {/* TAB 3: APPLICATION HISTORY */}
        {activeTab === 'history' && (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-slate-200 bg-white p-6 rounded-xl shadow-sm text-slate-900">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-indigo-600" />
                    My Outpass Applications History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Track all your past and current outpass requests and warden approval logs</p>
                </div>

                <Button variant="outline" size="sm" onClick={() => setActiveTab('apply')} leftIcon={<PlusCircle className="w-4 h-4" />}>
                  New Request
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                      <th className="py-3.5 px-4">Pass #</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Reason & Stated Purpose</th>
                      <th className="py-3.5 px-4">Destination</th>
                      <th className="py-3.5 px-4">Departure / Return</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outpassList.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{op.outpassNumber}</td>
                        <td className="py-4 px-4 font-medium text-slate-800">{op.category}</td>
                        <td className="py-4 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900">{op.reason}</p>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>{op.wardenStatus}</p>
                        </td>
                        <td className="py-4 px-4 text-slate-700">{op.destination}</td>
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                          <div>Out: {op.departureTime}</div>
                          <div>In: {op.expectedReturnTime}</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Badge
                            variant={
                              op.status === 'APPROVED'
                                ? 'success'
                                : op.status === 'PENDING_WARDEN'
                                ? 'warning'
                                : op.status === 'REJECTED'
                                ? 'danger'
                                : 'default'
                            }
                          >
                            {op.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN DIGITAL VERIFICATION PASS MODAL (LIGHT THEME MATCHING LANDING PAGE) */}
      <AnimatePresence>
        {showGuardModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setShowGuardModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full max-h-[90vh] overflow-y-auto bg-white border-2 border-emerald-500 rounded-xl p-4 sm:p-5 shadow-2xl relative space-y-3.5 text-slate-900"
            >
              {/* Top Close Button */}
              <button
                onClick={() => setShowGuardModal(false)}
                className="absolute right-3.5 top-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors border border-slate-200 z-10"
                title="Close Pass"
              >
                <X className="w-4 h-4" />
              </button>

              {activeOutpass ? (
                <>
                  <div className="text-center space-y-1 pr-6">
                    <span className="px-3 py-0.5 bg-emerald-100 border border-emerald-300 rounded-full text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      VERIFIED GATE PERMISSION PASS
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 pt-1 font-mono tracking-tight">
                      {activeOutpass.outpassNumber || `OP-${activeOutpass.id}`}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">PICT Main Campus Gate Security Pass</p>
                  </div>

                  {/* Student Photo / Avatar & Verified Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-indigo-400 font-semibold text-base flex items-center justify-center shrink-0">
                        {studentName ? studentName.charAt(0) : 'S'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">{studentName}</h4>
                        <p className="font-mono text-xs text-indigo-600 font-medium">PRN: {studentPrn}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {activeOutpass.studentHostel || 'Hostel'} • Room {activeOutpass.roomNumber || activeOutpass.studentRoom || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Stated Reason Box */}
                    {activeOutpass.reason && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        <p className="text-[9px] text-amber-800 font-extrabold uppercase tracking-wider">Reason Presented to Guard:</p>
                        <p className="text-xs text-amber-950 font-bold mt-0.5">"{activeOutpass.reason}"</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <p className="text-[9px] text-slate-500">Destination</p>
                        <p className="font-bold text-slate-900 truncate">{activeOutpass.destination || 'Pune City'}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <p className="text-[9px] text-slate-500 mb-0.5">Warden Verification</p>
                        <p className="font-mono text-xs text-emerald-700 font-medium">{activeOutpass.approvedByUsername || 'Warden Approved'}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <p className="text-[9px] text-slate-500 mb-0.5">Departure</p>
                        <p className="font-mono text-xs text-emerald-700 font-medium">
                          {activeOutpass.departureTime ? new Date(activeOutpass.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}
                        </p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <p className="text-[9px] text-slate-500 mb-0.5">Return Cutoff</p>
                        <p className="font-mono text-xs text-indigo-600 font-medium">
                          {activeOutpass.expectedReturnTime ? new Date(activeOutpass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verified Pass Security Token Badge */}
                  <div className="text-center bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-mono text-emerald-400 font-bold tracking-wider uppercase">AUTHENTICATED DIGITAL PASS</p>
                      <p className="text-lg font-black font-mono text-white tracking-tight">{activeOutpass.outpassNumber || `OP-${activeOutpass.id}`}</p>
                      <p className="text-[11px] font-mono text-slate-300">PRN: <span className="text-indigo-300 font-bold">{activeOutpass.studentPrn}</span></p>
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      Guard can verify this permit by student PRN or Pass number in Gate Terminal.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No Active Pass Currently Approved</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    You do not have an active outpass approved by the warden right now. Please submit a request from the "Apply Outpass Form" tab.
                  </p>
                </div>
              )}

              {/* Prominent Action / Close Button */}
              <Button
                variant="outline"
                onClick={() => setShowGuardModal(false)}
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold py-2.5 text-xs shadow-xs"
              >
                Close Presentation Pass
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPDATE DEFAULT PASSWORD MODAL */}
      <AnimatePresence>
        {showPasswordModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Update Default Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                If your account was provisioned with your PRN as the default password, create a secure, personalized password now.
              </p>

              <form onSubmit={handleStudentPasswordChange} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Current Password (e.g. Your PRN) *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">New Password (Min 6 characters, != PRN) *</label>
                  <input
                    type="password"
                    required
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmStudentPassword}
                    onChange={(e) => setConfirmStudentPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
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


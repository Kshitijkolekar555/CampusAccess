import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { facultyApi } from '../api/faculty';
import { FacultyOutpass } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Briefcase,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  ShieldCheck,
  Building,
  Calendar,
  X,
  Copy,
  Check,
  MapPin,
  FileText,
  UserCheck,
  Ticket,
  Send,
  Eye,
  LogOut,
  History as HistoryIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const OUTPASS_REASONS = [
  'Lunch Break',
  'Tea Break',
  'Official College Duty',
  'Personal Work',
  'Medical / Health',
  'Other',
];

export const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'pass' | 'apply' | 'history'>('pass');
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Lunch Break');
  const [explanation, setExplanation] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const facultyName = user?.fullName || 'Faculty Member';
  const empNo = user?.username || '510';
  const facultyDept = (user as any)?.department || 'Engineering Department';
  const facultyStaffType = (user as any)?.staffType || (user as any)?.designation || 'Teaching Staff';

  // Real-time Active Out-Pass query (polls every 3 seconds)
  const {
    data: activeOutpass,
    isLoading: isActiveLoading,
    refetch: refetchActive,
  } = useQuery<FacultyOutpass | null>({
    queryKey: ['faculty-my-active-outpass'],
    queryFn: async () => {
      try {
        return await facultyApi.getMyActiveOutpass();
      } catch {
        return null;
      }
    },
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  // Out-pass history query (polls every 5 seconds)
  const {
    data: historyList = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useQuery<FacultyOutpass[]>({
    queryKey: ['faculty-my-outpass-history'],
    queryFn: async () => {
      try {
        return await facultyApi.getMyOutpassHistory();
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  // Generate Out-Pass Mutation
  const generateMutation = useMutation({
    mutationFn: async (payload: { reason: string; explanation?: string }) => {
      return await facultyApi.generateOutpass(payload);
    },
    onSuccess: (newPass) => {
      toast.success(`Out-pass #${newPass.passNumber} generated successfully! You may now exit campus.`);
      setExplanation('');
      setSelectedReason('Lunch Break');
      setActiveTab('pass');
      queryClient.invalidateQueries({ queryKey: ['faculty-my-active-outpass'] });
      queryClient.invalidateQueries({ queryKey: ['faculty-my-outpass-history'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to generate out-pass');
    },
  });

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }
    if (selectedReason === 'Other' && !explanation.trim()) {
      toast.error('Please enter an explanation for "Other"');
      return;
    }
    generateMutation.mutate({
      reason: selectedReason,
      explanation: explanation.trim() || undefined,
    });
  };

  const handleCopyPassId = (passNum: string) => {
    navigator.clipboard.writeText(passNum);
    setCopiedId(passNum);
    toast.success('Pass ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter history
  const filteredHistory = useMemo(() => {
    return historyList.filter((p) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        p.passNumber.toLowerCase().includes(q) ||
        p.reason.toLowerCase().includes(q) ||
        (p.explanation && p.explanation.toLowerCase().includes(q)) ||
        (p.confirmedByGuardName && p.confirmedByGuardName.toLowerCase().includes(q))
      );
    });
  }, [historyList, searchFilter]);

  return (
    <div className="space-y-6">
      {/* ── Top Advisory Card (Exact match with Student module security notice) ── */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-300 font-sans m-0">
            <strong>Security Notice:</strong> Faculty out-passes are automatically synchronized with the Main Security Gate terminal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-amber-200 font-mono font-medium">Live Gate Connection Active</span>
        </div>
      </div>

      {/* ── Hero Welcome Banner (Exact match with StudentDashboardView) ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'var(--ink)',
          padding: '20px 24px',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-400/30 rounded-md text-xs font-medium text-emerald-300 flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified Faculty Portal
              </span>
              <span className="px-2.5 py-1 bg-slate-800/90 border border-slate-700/80 rounded-md text-xs font-normal text-slate-300 font-sans">
                {facultyDept} • {facultyStaffType}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold mt-2.5 tracking-tight text-white font-sans">
              Welcome, {facultyName}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-2.5 font-sans">
              <span>
                Employee ID: <span className="font-semibold text-blue-400">#{empNo}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Role: <strong className="text-slate-200">FACULTY</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Gate Out-Pass Permitted
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              onClick={() => setActiveTab('apply')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Generate Out-Pass
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowGuardModal(true)}
              leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-300" />}
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            >
              Show Digital Pass
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/teacher')}
              leftIcon={<UserCheck className="w-4 h-4 text-blue-300" />}
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            >
              Teacher Panel
            </Button>
          </div>
        </div>

        {/* Tab Buttons Bar (Exact match with StudentDashboardView) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 16,
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('pass')}
            style={{
              padding: '7px 16px',
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              transition: 'all 0.15s',
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
              padding: '7px 16px',
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              transition: 'all 0.15s',
              background: activeTab === 'apply' ? 'white' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'apply' ? 'var(--ink)' : 'rgba(255,255,255,0.5)',
              border: activeTab === 'apply' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <FileText style={{ width: 13, height: 13, color: 'var(--accent)' }} />
            Generate Out-Pass Form
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '7px 16px',
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              transition: 'all 0.15s',
              background: activeTab === 'history' ? 'white' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'history' ? 'var(--ink)' : 'rgba(255,255,255,0.5)',
              border: activeTab === 'history' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <HistoryIcon style={{ width: 13, height: 13, color: '#2dd4bf' }} />
            My Applications History ({historyList.length})
          </button>
          <button
            onClick={() => navigate('/teacher')}
            style={{
              padding: '7px 16px',
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              transition: 'all 0.15s',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <UserCheck style={{ width: 13, height: 13, color: '#60a5fa' }} />
            Teacher Panel (Visitors)
          </button>
        </div>
      </motion.div>

      {/* ── TAB CONTENT SWITCHING WITH FRAMER MOTION ── */}
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
                      You currently have no active or approved outpass on file. Total applications on record: {historyList.length}.
                    </p>
                  </div>
                  <Button variant="primary" onClick={() => setActiveTab('apply')} leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Generate Faculty Out-Pass
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
                          FACULTY CLEARED — PERMITTED FOR EXIT &amp; ENTRY
                        </span>
                        <h3 className="text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                          Pass #{activeOutpass.passNumber}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyPassId(activeOutpass.passNumber)}
                          leftIcon={copiedId === activeOutpass.passNumber ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-3 py-2 text-xs shrink-0"
                        >
                          {copiedId === activeOutpass.passNumber ? 'Copied' : 'Copy'}
                        </Button>
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
                    </div>

                    {/* Pass Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 hover:border-indigo-300 transition-colors">
                        <p className="text-slate-500 font-medium">Faculty Name &amp; ID</p>
                        <p className="text-slate-900 font-extrabold text-base mt-0.5">{activeOutpass.facultyName}</p>
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                          Emp ID: #{activeOutpass.facultyEmpNo}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 hover:border-indigo-300 transition-colors">
                        <p className="text-slate-500 font-medium">Department &amp; Designation</p>
                        <p className="text-slate-900 font-extrabold text-base mt-0.5">{activeOutpass.department}</p>
                        <p className="text-slate-700 font-mono">Staff: {facultyStaffType}</p>
                      </div>

                      <div className="bg-amber-50/80 p-4 rounded-lg border border-amber-200 sm:col-span-2">
                        <p className="text-amber-800 font-extrabold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          Stated Reason for Outpass (Presented to Guard)
                        </p>
                        <p className="text-amber-950 font-bold text-sm mt-1 bg-white border border-amber-200 p-3 rounded-xl">
                          "{activeOutpass.reason}"{activeOutpass.explanation ? ` — ${activeOutpass.explanation}` : ''}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                        <p className="text-slate-500 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Gate Location
                        </p>
                        <p className="text-slate-900 font-extrabold text-sm mt-0.5">Main Gate (Gate 1)</p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                        <p className="text-slate-500 font-medium flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Gate Officer Confirmation
                        </p>
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                          {activeOutpass.confirmedByGuardName ? `@${activeOutpass.confirmedByGuardName}` : 'Awaiting Gate Clearance'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                        <p className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" /> Permitted Departure
                        </p>
                        <p className="text-emerald-700 font-mono font-extrabold text-sm mt-0.5">
                          {activeOutpass.departureTime || (activeOutpass.generatedAt ? new Date(activeOutpass.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Immediate Exit')}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                        <p className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" /> Expected / Actual Return
                        </p>
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                          {activeOutpass.actualReturnTime ? new Date(activeOutpass.actualReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending Ingress Log'}
                        </p>
                      </div>
                    </div>

                    {/* Digital Gate Verification Badge (Exact match with Student module) */}
                    <div
                      style={{
                        background: 'var(--ink)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 4,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                      className="sm:flex-row items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-white uppercase tracking-wider">Gate Checkpoint Ready</p>
                          <p className="text-[11px] text-slate-300">
                            Guards verify faculty ID <strong className="text-emerald-400 font-mono">#{empNo}</strong> or Pass <span className="font-mono text-indigo-300 font-bold">{activeOutpass.passNumber}</span>
                          </p>
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

                {/* Right Side Workflow Stepper Card (Exact match with Student module) */}
                <div className="space-y-6">
                  <Card className="border border-[--line] bg-white p-5 rounded-[4px] space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Gate Clearance Workflow</h4>
                    <div className="space-y-3.5 text-xs relative">
                      <div className="relative pl-10">
                        <div
                          style={{
                            position: 'absolute',
                            left: 6,
                            top: 0,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#10b981',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 10,
                          }}
                        >
                          ✓
                        </div>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>1. Faculty Clearance</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Verified against authorized PICT roster</p>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">Token Authorized</span>
                      </div>

                      <div className="relative pl-10">
                        <div
                          style={{
                            position: 'absolute',
                            left: 6,
                            top: 0,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#10b981',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 10,
                          }}
                        >
                          ✓
                        </div>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>2. Gate Sync</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Pushed to Duty Officer Terminal</p>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">Synchronized</span>
                      </div>

                      <div className="relative pl-10">
                        <div
                          style={{
                            position: 'absolute',
                            left: 6,
                            top: 0,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 10,
                            boxShadow: '0 1px 3px rgba(47,93,124,0.4)',
                          }}
                          className="animate-pulse"
                        >
                          3
                        </div>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', margin: '0 0 2px' }}>3. Gate Security Active</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Present Pass #{activeOutpass.passNumber} at Gate 1 or Gate 2</p>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--accent)', fontWeight: 500 }}>Ready for Exit Log</span>
                      </div>
                    </div>
                  </Card>

                  <Card style={{ background: 'rgba(47,93,124,0.06)', border: '1px solid rgba(47,93,124,0.15)', borderRadius: 4, padding: '16px 20px' }}>
                    <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider mb-2.5">Campus Faculty Rules</h4>
                    <ul className="text-[11px] text-slate-600 space-y-2 list-disc list-inside font-medium">
                      <li>Show your pass number to the duty officer when exiting the campus.</li>
                      <li>Return through Gate 1 or Gate 2 for 1-click arrival clearance.</li>
                      <li>Main gate security contact: <strong className="text-indigo-700 font-bold">020-24371101</strong></li>
                    </ul>
                  </Card>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* TAB 2: GENERATE FACULTY OUT-PASS FORM */}
        {activeTab === 'apply' && (
          <motion.div
            key="apply-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto w-full"
          >
            <Card className="border border-[--line] bg-white p-6 sm:p-8 rounded-[4px] text-slate-900 shadow-sm">
              <div className="border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 m-0">
                      Generate Faculty Out-Pass
                    </h3>
                    <p className="text-xs text-slate-500 m-0">
                      Issued immediately without approval
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleGenerateSubmit} className="space-y-5">
                {/* Informational Policy Banner (From original Faculty implementation) */}
                <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-lg text-xs space-y-1 text-cyan-950">
                  <p className="font-bold flex items-center gap-1.5 text-cyan-900">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" /> Notice
                  </p>
                  <p className="text-cyan-800 text-[11.5px] leading-relaxed">
                    Your out-pass is generated immediately upon request. Guard departure confirmation is not required. Security guards will record your re-entry upon returning to campus.
                  </p>
                </div>

                {/* Reason Selection Grid (From original Faculty implementation) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2.5">
                    Reason for Leaving Campus <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {OUTPASS_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedReason(r)}
                        className={`p-3 rounded border text-left text-xs transition flex items-center justify-between cursor-pointer ${
                          selectedReason === r
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{r}</span>
                        {selectedReason === r && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explanation / Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Explanation / Destination Notes {selectedReason === 'Other' && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder={
                      selectedReason === 'Other'
                        ? 'Please provide explanation for leaving campus…'
                        : 'Optional destination or task details…'
                    }
                    required={selectedReason === 'Other'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActiveTab('pass')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-2"
                    isLoading={generateMutation.isPending}
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                  >
                    {generateMutation.isPending ? 'Generating…' : 'Issue Out-Pass Immediately'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* TAB 3: APPLICATION HISTORY (Exact match with Student module Tab 3) */}
        {activeTab === 'history' && (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-slate-200 bg-white p-6 rounded-xl shadow-sm text-slate-900">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-indigo-600" />
                    My Outpass Applications History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track all your past and current outpass requests and gate clearance logs
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-full sm:w-64 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search pass ID, reason..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('apply')}
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                    className="shrink-0"
                  >
                    New Request
                  </Button>
                </div>
              </div>

              {isHistoryLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-300" />
                  Loading out-pass history…
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-600 mb-1">No out-pass records found</p>
                  <p className="text-[11px] text-slate-400">
                    {searchFilter ? 'No passes matched your search query.' : 'You have not generated any out-passes yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                        <th className="py-3.5 px-4">Pass #</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Reason &amp; Stated Purpose</th>
                        <th className="py-3.5 px-4">Destination</th>
                        <th className="py-3.5 px-4">Departure / Return</th>
                        <th className="py-3.5 px-4">Gate Officer</th>
                        <th className="py-3.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map((pass) => (
                        <tr key={pass.id} className="hover:bg-slate-50 transition-colors">
                          <td
                            className="py-4 px-4"
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: 12,
                              color: 'var(--accent)',
                              fontWeight: 500,
                            }}
                          >
                            #{pass.passNumber}
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-800">
                            {pass.reason.includes('Duty') ? 'Official Duty' : 'Short Exit'}
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            <p className="font-semibold text-slate-900">{pass.reason}</p>
                            {pass.explanation && (
                              <p
                                style={{
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: 11,
                                  color: 'var(--mute)',
                                  marginTop: 2,
                                }}
                              >
                                {pass.explanation}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-700">
                            {pass.explanation?.includes('Destination: ')
                              ? pass.explanation.split('Destination: ')[1]?.replace(')', '')
                              : 'Nearby Campus Area'}
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                            <div>
                              Out:{' '}
                              {pass.generatedAt
                                ? `${new Date(pass.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date(pass.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : '—'}
                            </div>
                            <div>
                              In:{' '}
                              {pass.actualReturnTime
                                ? `${new Date(pass.actualReturnTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date(pass.actualReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : 'Pending Return'}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-700">
                            {pass.confirmedByGuardName ? `@${pass.confirmedByGuardName}` : '—'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Badge
                              variant={
                                pass.status === 'RETURNED_TO_CAMPUS'
                                  ? 'success'
                                  : pass.status === 'OUTPASS_GENERATED'
                                  ? 'warning'
                                  : 'default'
                              }
                            >
                              {pass.status === 'OUTPASS_GENERATED' ? 'OUT_OF_CAMPUS' : pass.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN DIGITAL VERIFICATION PASS MODAL (EXACT MATCH WITH STUDENT MODULE) */}
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
                      {activeOutpass.passNumber}
                    </h3>
                    <p className="text-[11px] text-slate-500">Official PICT Faculty Security Clearance</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">Faculty Name</span>
                      <span className="font-bold text-slate-900">{activeOutpass.facultyName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">Employee ID</span>
                      <span className="font-mono font-bold text-blue-600">#{activeOutpass.facultyEmpNo}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">Department</span>
                      <span className="font-semibold text-slate-800">{activeOutpass.department}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">Reason</span>
                      <span className="font-semibold text-amber-700">{activeOutpass.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className="font-bold text-emerald-600">CLEARED FOR GATE EXIT</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1 text-emerald-900 text-xs">
                    <p className="font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> PICT SECURITY VERIFIED
                    </p>
                    <p className="text-[11px] text-emerald-700">Present this digital clearance pass to the duty officer at Gate 1 or Gate 2.</p>
                  </div>

                  <Button variant="outline" className="w-full text-xs" onClick={() => setShowGuardModal(false)}>
                    Done
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-900">No Active Pass</h4>
                  <p className="text-xs text-slate-500">You currently have no active out-pass.</p>
                  <Button variant="primary" size="sm" onClick={() => { setShowGuardModal(false); setActiveTab('apply'); }}>
                    Apply for Out-Pass
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyDashboard;

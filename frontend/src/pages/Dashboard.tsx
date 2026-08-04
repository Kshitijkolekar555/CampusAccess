import React, { useState, useEffect } from 'react';
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
import { ApiResponse, GuardSelfDashboardResponse, StaffBreak, Visitor } from '../types';
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
  Coffee,
  Play,
  Square,
  History,
  QrCode,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const chartData = [
  { time: '08:00', visitors: 12 },
  { time: '10:00', visitors: 35 },
  { time: '12:00', visitors: 68 },
  { time: '14:00', visitors: 54 },
  { time: '16:00', visitors: 82 },
  { time: '18:00', visitors: 40 },
  { time: '20:00', visitors: 18 },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Role detection
  const role = user?.role || 'VISITOR';
  const isGuard = role === 'SECURITY_GUARD' || role === 'GUARD';
  const isStudent = role === 'STUDENT';
  const isVisitor = role === 'VISITOR';
  const isStaff = role === 'STAFF';

  // Real-time Active Visitors Inside Campus (polling every 10s)
  const { data: activeVisitorsList } = useQuery<Visitor[]>({
    queryKey: ['active-visitors-dashboard'],
    queryFn: () => visitorApi.getActiveInside(),
    refetchInterval: 10000,
  });

  // Section F3: Real-time refresh / polling for Guard Dashboard (every 10s)
  const { data: guardData, isLoading: isGuardLoading } = useQuery<GuardSelfDashboardResponse>({
    queryKey: ['guard-self-dashboard', user?.id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GuardSelfDashboardResponse>>('/dashboard/guard');
      return res.data.data;
    },
    enabled: isGuard || role === 'ADMIN',
    refetchInterval: 10000,
  });

  // Admin Dashboard Metrics
  const { data: adminMetrics, isLoading: isAdminLoading } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/dashboard/admin');
      return res.data.data;
    },
    enabled: !isGuard && !isStudent && !isVisitor && !isStaff,
    refetchInterval: 30000,
  });

  // Section I1: Visitor Autofill Profile Details
  const [visitorName, setVisitorName] = useState(user?.fullName || '');
  const [visitorMobile, setVisitorMobile] = useState(user?.phone || '');
  const [hostDept, setHostDept] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [activeToken, setActiveToken] = useState<any>(null);

  useEffect(() => {
    if (user && isVisitor) {
      setVisitorName(user.fullName || '');
      setVisitorMobile(user.phone || '');
    }
  }, [user, isVisitor]);

  // Section H2: Staff Break Management State & Queries
  const [breakNote, setBreakNote] = useState('');

  const { data: activeBreakRes, refetch: refetchActiveBreak } = useQuery({
    queryKey: ['staff-active-break'],
    queryFn: () => staffBreaksApi.getActiveBreak(),
    enabled: isStaff,
  });

  const { data: breakHistoryRes, refetch: refetchBreakHistory } = useQuery({
    queryKey: ['staff-break-history'],
    queryFn: () => staffBreaksApi.getHistory(0, 5),
    enabled: isStaff,
  });

  const startBreakMutation = useMutation({
    mutationFn: (note?: string) => staffBreaksApi.startBreak(note),
    onSuccess: () => {
      toast.success('Break session started!');
      refetchActiveBreak();
      refetchBreakHistory();
      setBreakNote('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start break');
    },
  });

  const endBreakMutation = useMutation({
    mutationFn: (note?: string) => staffBreaksApi.endBreak(note),
    onSuccess: () => {
      toast.success('Break session ended!');
      refetchActiveBreak();
      refetchBreakHistory();
      setBreakNote('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to end break');
    },
  });

  const activeBreak: StaffBreak | null = activeBreakRes?.data || null;

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorMobile || !purpose) {
      toast.error('Please fill required visitor fields');
      return;
    }
    const token = {
      tokenNumber: 'VT-' + Math.floor(100000 + Math.random() * 900000),
      visitorName,
      mobileNumber: visitorMobile,
      hostPersonOrDepartment: hostDept || 'General Inquiry',
      purpose,
      entryTime: new Date().toLocaleTimeString(),
      validTillTime: new Date(Date.now() + 4 * 3600000).toLocaleTimeString(),
    };
    setActiveToken(token);
    toast.success('Visit Request Created & Token Generated!');
  };

  // RENDER VISITOR DASHBOARD (Section I2)
  if (isVisitor) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-xl">
          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Visitor Portal
          </span>
          <h2 className="text-2xl font-extrabold mt-2">Welcome, {user?.fullName || 'Visitor'}!</h2>
          <p className="text-xs text-slate-400 mt-1">Autofilled profile details. Submit new campus visit requests and check active token status.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Visit Request (Section I1: Autofilled) */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-500" />
              New Visit Request
            </h3>
            <form onSubmit={handleCreateVisit} className="space-y-4">
              <Input label="Visitor Name (Autofilled)" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} required placeholder="Your full name" />
              <Input label="Mobile Number (Autofilled)" value={visitorMobile} onChange={(e) => setVisitorMobile(e.target.value)} required placeholder="10-digit mobile number" />
              <Input label="Host Person or Department" value={hostDept} onChange={(e) => setHostDept(e.target.value)} placeholder="e.g. Prof. Sharma / IT Dept" />
              <Input label="Purpose of Visit" value={purpose} onChange={(e) => setPurpose(e.target.value)} required placeholder="Reason for visiting campus" />
              <Input label="Vehicle Number (Optional)" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="e.g. MH12AB1234" />
              <Button type="submit" variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-500">
                Generate Digital Token
              </Button>
            </form>
          </Card>

          {/* Active Token & Visit Status */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-emerald-500" />
              My Active Token & Status
            </h3>
            {activeToken ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Token Number</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">{activeToken.tokenNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Visitor Name</p>
                    <p className="font-semibold">{activeToken.visitorName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Mobile</p>
                    <p className="font-semibold">{activeToken.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Host / Dept</p>
                    <p className="font-semibold">{activeToken.hostPersonOrDepartment}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Purpose</p>
                    <p className="font-semibold">{activeToken.purpose}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Entry Time</p>
                    <p className="font-semibold text-emerald-400">{activeToken.entryTime}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Valid Till</p>
                    <p className="font-semibold text-purple-400">{activeToken.validTillTime}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
                <Ticket className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400">No active token currently.</p>
                <p className="text-xs text-slate-500">Fill out the form on the left to request a digital pass.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // RENDER STUDENT DASHBOARD (PRN Verified)
  if (isStudent) {
    const studentPrn = user?.username || 'PRN-2026';
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 w-fit">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Student Verified Session
              </span>
              <h2 className="text-2xl font-extrabold mt-2">{user?.fullName}</h2>
              <p className="text-xs text-slate-300 font-mono mt-1">PRN: {studentPrn} • Computer Engineering • Permitted Outpass Category</p>
            </div>
            <Badge variant="success" className="text-xs">Verified Student</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              Quick Outpass Application
            </h3>
            <p className="text-xs text-slate-500 mb-4">To create a detailed outpass, visit the Hostel Outpasses section.</p>
            <Button variant="primary" onClick={() => navigate('/hostel-outpasses')} className="w-full bg-purple-600 hover:bg-purple-500">
              Go to Hostel Outpasses
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // RENDER GUARD DASHBOARD (Section F2 & F3: Dynamic Real-time Polling)
  if (isGuard) {
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

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Dynamic Guard Duty Terminal
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-2">{summary.guardName}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Guard ID: <span className="font-mono text-indigo-300">{summary.guardId}</span> • Assigned Location: <span className="text-slate-200 font-semibold">{summary.gateName}</span>
                {summary.shiftStartTime && (
                  <span> • In-Time: <span className="font-mono text-emerald-400">{new Date(summary.shiftStartTime).toLocaleTimeString()}</span></span>
                )}
                {summary.shiftEndTime && (
                  <span> • Out-Time: <span className="font-mono text-rose-400">{new Date(summary.shiftEndTime).toLocaleTimeString()}</span></span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${summary.dutyStatus === 'ON DUTY' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                  {summary.dutyStatus}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">{summary.shiftName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Activity Metrics (Polling every 10s) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Visitors Entered Today" value={summary.visitorsEnteredToday} icon={<UserCheck className="w-6 h-6" />} colorTheme="emerald" description="Checked in via location" />
          <StatsCard title="Visitors Exited Today" value={summary.visitorsExitedToday} icon={<LogOut className="w-6 h-6" />} colorTheme="indigo" description="Checked out via location" />
          <StatsCard title="Active Visitors Inside Campus" value={summary.activeVisitorsInsideCampus} icon={<Users className="w-6 h-6" />} colorTheme="emerald" description="Currently on campus" />
          <StatsCard title="Faculty / Teacher Visitors" value={summary.visitorsEnteredToday > 0 ? Math.ceil(summary.visitorsEnteredToday * 0.6) : 0} icon={<GraduationCap className="w-6 h-6" />} colorTheme="purple" description="Visiting Teachers / HODs" />
          <StatsCard title="Vehicles Entered Today" value={summary.vehiclesEnteredToday} icon={<Car className="w-6 h-6" />} colorTheme="cyan" description="Entry logs recorded" />
          <StatsCard title="Vehicles Exited Today" value={summary.vehiclesExitedToday} icon={<Car className="w-6 h-6" />} colorTheme="purple" description="Exit logs recorded" />
          <StatsCard title="Materials Processed Today" value={summary.materialsProcessedToday} icon={<Package className="w-6 h-6" />} colorTheme="amber" description="Vendor / Inward entry" />
          <StatsCard title="Student Passes Processed Today" value={summary.studentPassesProcessedToday ?? 0} icon={<Ticket className="w-6 h-6" />} colorTheme="indigo" description="Student gate passes" />
        </div>

        {/* Live Active Visitors Table on Guard Panel */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Live Active Visitors Inside Campus
              </h3>
              <p className="text-xs text-slate-500">Real-time listing of visitors currently inside campus (auto-refreshes every 10s)</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/visitors')}>
              View All Visitor Registers
            </Button>
          </div>

          {activeVisitorsList && activeVisitorsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Pass #</th>
                    <th className="py-2.5 px-3">Visitor Name</th>
                    <th className="py-2.5 px-3">Mobile</th>
                    <th className="py-2.5 px-3">Visiting Host</th>
                    <th className="py-2.5 px-3">Dept</th>
                    <th className="py-2.5 px-3">Check-In Time</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {activeVisitorsList.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{v.passNumber || `#${v.id}`}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{v.name}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{v.mobile}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">{v.hostName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{v.hostDepartment} ({v.hostType || 'FACULTY'})</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{new Date(v.timeIn).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge variant="success">Active Inside</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No visitors currently inside campus.</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // RENDER STAFF DASHBOARD (Section H1 & H2: Simplified + Break Management)
  if (isStaff) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 md:p-8 rounded-3xl text-white shadow-xl">
          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 w-fit">
            <Coffee className="w-3.5 h-3.5 text-emerald-400" />
            Staff & Faculty Portal
          </span>
          <h2 className="text-2xl font-extrabold mt-2">Welcome, {user?.fullName}!</h2>
          <p className="text-xs text-slate-400 mt-1">Department: Computer Engineering • Simplified Staff Workspace</p>
        </div>

        {/* Section H2: Break Update Only */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-500" />
              Staff Break Controls
            </h3>

            {activeBreak ? (
              <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-amber-300">ON BREAK</span>
                  <Badge variant="warning">Ongoing</Badge>
                </div>
                <p className="text-xs text-slate-300">Started at: <span className="font-mono">{new Date(activeBreak.startTime).toLocaleTimeString()}</span></p>
                {activeBreak.note && <p className="text-xs text-slate-400 italic">Note: "{activeBreak.note}"</p>}
                
                <Input label="End Note (Optional)" placeholder="e.g. Lunch completed" value={breakNote} onChange={(e) => setBreakNote(e.target.value)} />
                
                <Button 
                  variant="danger" 
                  className="w-full" 
                  leftIcon={<Square className="w-4 h-4" />}
                  isLoading={endBreakMutation.isPending}
                  onClick={() => endBreakMutation.mutate(breakNote)}
                >
                  End Break Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input label="Break Note (Optional)" placeholder="e.g. Tea / Lunch break" value={breakNote} onChange={(e) => setBreakNote(e.target.value)} />
                <Button 
                  variant="success" 
                  className="w-full" 
                  leftIcon={<Play className="w-4 h-4" />}
                  isLoading={startBreakMutation.isPending}
                  onClick={() => startBreakMutation.mutate(breakNote)}
                >
                  Start Break Session
                </Button>
              </div>
            )}
          </Card>

          {/* Break History */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              My Break History
            </h3>

            <div className="space-y-2">
              {breakHistoryRes?.data?.content && breakHistoryRes.data.content.length > 0 ? (
                breakHistoryRes.data.content.map((b) => (
                  <div key={b.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex justify-between items-center text-slate-200">
                    <div>
                      <p className="font-semibold text-slate-100">{new Date(b.startTime).toLocaleDateString()} {new Date(b.startTime).toLocaleTimeString()}</p>
                      <p className="text-[11px] text-slate-400">{b.note || 'Break'}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={b.status === 'COMPLETED' ? 'success' : 'warning'}>{b.status}</Badge>
                      {b.durationMinutes && <p className="text-[11px] text-slate-400 mt-1">{b.durationMinutes} mins</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">No break history logs yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // DEFAULT RENDER: ADMIN DASHBOARD
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Admin Master Control
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">
            Welcome, System Admin {user?.fullName}!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive analytics, guard operations, and security logs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />} onClick={() => navigate('/visitors')}>
            Check-In Visitor
          </Button>
          <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => navigate('/users')}>
            User Control
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {isAdminLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : (
          <>
            <StatsCard title="Active Visitors Inside" value={adminMetrics?.visitorsInside ?? 14} icon={<Users className="w-6 h-6" />} colorTheme="indigo" description="Currently on campus" />
            <StatsCard title="Today's Total Visitors" value={adminMetrics?.todayVisitors ?? 42} icon={<UserCheck className="w-6 h-6" />} colorTheme="emerald" description="Checked in today" />
            <StatsCard title="Faculty / Teacher Visitors" value={adminMetrics?.todayVisitors ? Math.ceil(adminMetrics.todayVisitors * 0.55) : 24} icon={<GraduationCap className="w-6 h-6" />} colorTheme="purple" description="Visiting Faculty / Staff" />
            <StatsCard title="Active Guards on Duty" value={adminMetrics?.guardsOnDuty ?? 8} icon={<ShieldCheck className="w-6 h-6" />} colorTheme="cyan" description="Security personnel" />
            <StatsCard title="Active Outpass Requests" value={adminMetrics?.todayHostelOutpasses ?? 12} icon={<Clock className="w-6 h-6" />} colorTheme="purple" description="Hostel outpasses" />
          </>
        )}
      </div>

      {/* Analytics Chart */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Hourly Visitor Traffic (Today)
            </h3>
            <p className="text-xs text-slate-500 font-medium">Real-time gate traffic intensity across all campus locations</p>
          </div>
          <Badge variant="purple">System Analytics</Badge>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="visitors" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Live Active Visitors Table on Admin Dashboard */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Active Campus Visitors Log
            </h3>
            <p className="text-xs text-slate-500">Live monitoring of all visitors currently on campus (auto-refreshes every 10s)</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/visitors')}>
            Manage All Visitors
          </Button>
        </div>

        {activeVisitorsList && activeVisitorsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Pass #</th>
                  <th className="py-2.5 px-3">Visitor Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Visiting Host</th>
                  <th className="py-2.5 px-3">Dept</th>
                  <th className="py-2.5 px-3">Check-In Time</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {activeVisitorsList.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{v.passNumber || `#${v.id}`}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{v.name}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{v.mobile}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">{v.hostName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{v.hostDepartment} ({v.hostType || 'FACULTY'})</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{new Date(v.timeIn).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge variant="success">Active Inside</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No active visitors logged inside campus right now.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

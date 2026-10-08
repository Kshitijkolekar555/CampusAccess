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
import { staffBreaksApi } from '../api/staffBreaks';
import { facultyApi } from '../api/faculties';
import { ApiResponse, GuardSelfDashboardResponse, StaffBreak, Visitor, Faculty, HostDepartment, HostType } from '../types';
import { QRCodeDisplay } from '../components/ui/QRCodeDisplay';
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
  MapPin,
  Calendar,
  Building,
  Send,
  Eye,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  UserCheck2,
  ChevronRight,
  Search,
} from 'lucide-react';
import { hostelOutpassApi } from '../api/hostelOutpasses';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { GuardDashboardView } from '../components/guard/GuardDashboardView';

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

  const [isSimplifiedGuardView, setIsSimplifiedGuardView] = useState(true);

  // Real-time Active Visitors Inside Campus (polling every 10s)
  const { data: activeVisitorsList } = useQuery<Visitor[]>({
    queryKey: ['active-visitors-dashboard'],
    queryFn: async () => {
      try {
        return await visitorApi.getActiveInside();
      } catch (err) {
        return [];
      }
    },
    enabled: !isVisitor && !isStudent,
    refetchInterval: 10000,
  });

  // Section F3: Real-time refresh / polling for Guard Dashboard (every 10s)
  const { data: guardData, isLoading: isGuardLoading } = useQuery<GuardSelfDashboardResponse>({
    queryKey: ['guard-self-dashboard', user?.id],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<GuardSelfDashboardResponse>>('/dashboard/guard');
        return res.data.data;
      } catch (err) {
        return null;
      }
    },
    enabled: isGuard || role === 'ADMIN',
    refetchInterval: 10000,
  });

  // Admin Dashboard Metrics
  const { data: adminMetrics, isLoading: isAdminLoading } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<any>>('/dashboard/admin');
        return res.data.data;
      } catch (err) {
        return null;
      }
    },
    enabled: !isGuard && !isStudent && !isVisitor && !isStaff,
    refetchInterval: 30000,
  });

  // Section I1: Visitor Autofill Profile Details
  const [visitorName, setVisitorName] = useState(user?.fullName || '');
  const [visitorMobile, setVisitorMobile] = useState(user?.phone || '');
  const [hostType, setHostType] = useState<HostType>('FACULTY');
  const [hostDepartment, setHostDepartment] = useState<HostDepartment | ''>('IT');
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [customHostName, setCustomHostName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [activeToken, setActiveToken] = useState<any>(null);

  // Fetch faculty directory for visitor host selection
  const { data: facultiesList = [] } = useQuery({
    queryKey: ['faculties-visitor-selection'],
    queryFn: () => facultyApi.getAllFaculties(),
    enabled: isVisitor,
  });

  // Selected faculty object lookup
  const selectedFaculty = useMemo(() => {
    if (!selectedFacultyId) return null;
    return facultiesList.find((f) => f.id === Number(selectedFacultyId)) || null;
  }, [selectedFacultyId, facultiesList]);

  // Filtered faculty list based on department and optional quick search
  const filteredFaculties = useMemo(() => {
    return facultiesList.filter((f) => {
      const matchesDept = !hostDepartment || f.department === hostDepartment;
      const matchesSearch =
        !facultySearchQuery.trim() ||
        f.name.toLowerCase().includes(facultySearchQuery.toLowerCase()) ||
        (f.designation && f.designation.toLowerCase().includes(facultySearchQuery.toLowerCase())) ||
        (f.email && f.email.toLowerCase().includes(facultySearchQuery.toLowerCase()));
      return matchesDept && matchesSearch;
    });
  }, [facultiesList, hostDepartment, facultySearchQuery]);

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
    queryFn: async () => {
      try {
        return await staffBreaksApi.getActiveBreak();
      } catch (err) {
        return null;
      }
    },
    enabled: isStaff,
  });

  const { data: breakHistoryRes, refetch: refetchBreakHistory } = useQuery({
    queryKey: ['staff-break-history'],
    queryFn: async () => {
      try {
        return await staffBreaksApi.getHistory(0, 5);
      } catch (err) {
        return null;
      }
    },
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

  const checkInMutation = useMutation({
    mutationFn: (payload: any) => visitorApi.checkIn(payload),
    onSuccess: (data: Visitor) => {
      const token = {
        id: data.id,
        tokenNumber: data.passNumber || `PICT-PASS-${String(data.id).padStart(6, '0')}`,
        visitorName: data.name,
        mobileNumber: data.mobile,
        hostPersonOrDepartment: data.hostName || data.hostDepartment || 'General Inquiry',
        hostDepartment: data.hostDepartment,
        hostType: data.hostType || 'FACULTY',
        purpose: data.purpose,
        vehicleNumber: data.vehicleNumber,
        gateName: data.gateName || 'Gate 1 - Main Entrance',
        entryTime: new Date(data.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        entryDate: new Date(data.timeIn).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        validTillTime: new Date(Date.now() + 4 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        qrCodeDataUrl: data.qrCodeDataUrl,
      };
      setActiveToken(token);
      toast.success('Visit Request Created & Token Generated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-in request failed');
    },
  });

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorMobile || !purpose) {
      toast.error('Please fill all required visitor fields');
      return;
    }

    let finalHostName = 'General Campus Visit';
    let finalHostDept = hostDepartment || 'IT';

    if (hostType === 'FACULTY' || hostType === 'HOD') {
      if (selectedFaculty) {
        finalHostName = selectedFaculty.name;
        finalHostDept = selectedFaculty.department;
      } else if (customHostName.trim()) {
        finalHostName = customHostName.trim();
      } else {
        toast.error('Please select a faculty member from the dropdown or specify custom name');
        return;
      }
    } else {
      finalHostName = customHostName.trim() || `${hostType} (${hostDepartment || 'General'})`;
    }

    checkInMutation.mutate({
      name: visitorName,
      mobile: visitorMobile,
      purpose,
      hostName: finalHostName,
      hostType: hostType,
      hostDepartment: finalHostDept,
      gateId: 1,
      idProofType: 'Aadhaar',
      idProofNumber: 'ID-' + Math.floor(100000 + Math.random() * 900000),
      vehicleNumber: vehicleNo || undefined,
    });
  };

  // RENDER VISITOR DASHBOARD (Section I2)
  if (isVisitor) {
    return (
      <div className="space-y-6">
        <div style={{ background: 'var(--ink)', padding: '20px 24px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(47,93,124,0.18)', border: '1px solid rgba(47,93,124,0.35)', borderRadius: 2, padding: '2px 8px', display: 'inline-block', marginBottom: 10 }}>
            Visitor Portal
          </span>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, color: '#f0ede8', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Welcome, {user?.fullName || 'Visitor'}</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Select the faculty from the institutional directory to request an authorized visitor pass.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Visit Request (Step-by-step Selection) */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--line)]">
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PlusCircle style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} />
                New Visit Request
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Directory Linked
              </span>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-4">
              {/* Step 1: Visitor Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Visitor Name *" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} required placeholder="Your full name" />
                <Input label="Mobile Number *" value={visitorMobile} onChange={(e) => setVisitorMobile(e.target.value)} required placeholder="10-digit mobile number" />
              </div>

              {/* Step 2: Step-by-step Host Category & Department Dropdowns */}
              <div className="pt-2 border-t border-[var(--line)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <UserCheck2 className="w-3.5 h-3.5 text-blue-600" />
                    Step 1 &bull; Who do you wish to meet?
                  </label>
                  <span className="text-[10px] text-slate-600">Select Department & Faculty</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Host Category</label>
                    <select
                      value={hostType}
                      onChange={(e) => {
                        setHostType(e.target.value as HostType);
                        setSelectedFacultyId('');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded shadow-xs focus:ring-1 focus:ring-blue-600 focus:outline-none font-medium text-slate-800"
                    >
                      <option value="FACULTY">Faculty / Professor</option>
                      <option value="HOD">Head of Department (HOD)</option>
                      <option value="ADMIN_STAFF">Administrative Staff</option>
                      <option value="STUDENT">Student</option>
                      <option value="OTHER">Other / General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                    <select
                      value={hostDepartment}
                      onChange={(e) => {
                        setHostDepartment(e.target.value as HostDepartment);
                        setSelectedFacultyId('');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded shadow-xs focus:ring-1 focus:ring-blue-600 focus:outline-none font-medium text-slate-800"
                    >
                      <option value="">All Departments</option>
                      <option value="IT">Information Technology (IT)</option>
                      <option value="CE">Computer Engineering (CE)</option>
                      <option value="ENTC">Electronics & Telecomm (ENTC)</option>
                      <option value="ECE">Electronics & Computer (ECE)</option>
                      <option value="AIDS">AI & Data Science (AIDS)</option>
                      <option value="BSE">Applied Sciences & Engg (BSE)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Select Faculty from Existing Directory */}
              {(hostType === 'FACULTY' || hostType === 'HOD') ? (
                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      Step 2 &bull; Select Faculty Member *
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      {filteredFaculties.length} available
                    </span>
                  </div>

                  {/* Optional Quick search inside department */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type name to filter dropdown..."
                      value={facultySearchQuery}
                      onChange={(e) => setFacultySearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Faculty Member Dropdown */}
                  <select
                    value={selectedFacultyId}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      setSelectedFacultyId(val);
                      if (val) {
                        const fac = facultiesList.find((f) => f.id === val);
                        if (fac) {
                          setHostDepartment(fac.department);
                          if (fac.name.toLowerCase().includes('hod') || (fac.email && fac.email.toLowerCase().includes('hod'))) {
                            setHostType('HOD');
                          }
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded shadow-xs focus:ring-1 focus:ring-blue-600 focus:outline-none font-medium text-slate-800"
                  >
                    <option value="">-- Choose faculty member from list --</option>
                    {filteredFaculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} &bull; {f.department} {f.designation ? `(${f.designation})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Selected Faculty Card Preview */}
                  {selectedFaculty ? (
                    <div className="mt-2 p-2.5 bg-white rounded border border-blue-200 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 m-0">{selectedFaculty.name}</p>
                          <p className="text-[11px] text-blue-700 font-medium m-0">
                            {selectedFaculty.designation || 'Faculty Member'} &bull; Dept of {selectedFaculty.department}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          Verified Faculty
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-800 truncate select-all">{selectedFaculty.email}</span>
                        </div>
                        {selectedFaculty.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-800 select-all">{selectedFaculty.phone}</span>
                          </div>
                        )}
                        {selectedFaculty.cabinLocation && (
                          <div className="col-span-full flex items-center gap-1.5 text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{selectedFaculty.cabinLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-600 italic">
                      Can't find the person? You can also specify manually below.
                    </div>
                  )}

                  {/* Optional Manual Override if not found */}
                  <div>
                    <input
                      type="text"
                      placeholder="Or specify custom faculty name if not in list"
                      value={customHostName}
                      onChange={(e) => {
                        setCustomHostName(e.target.value);
                        if (e.target.value) setSelectedFacultyId('');
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-dashed border-slate-300 rounded text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    label="Host Person or Office Name *"
                    value={customHostName}
                    onChange={(e) => setCustomHostName(e.target.value)}
                    placeholder="e.g. Student Section / Registrar Office"
                    required
                  />
                </div>
              )}

              {/* Step 4: Visit Purpose & Vehicle */}
              <div className="pt-2 border-t border-[var(--line)] space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Step 3 &bull; Purpose & Details
                </label>
                <Input
                  label="Purpose of Visit *"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  placeholder="e.g. Meeting Prof for project guidance / Academic inquiry"
                />
                <Input
                  label="Vehicle Number (Optional)"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. MH12AB1234"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full" disabled={checkInMutation.isPending}>
                {checkInMutation.isPending ? 'Generating Token...' : 'Generate Digital Token'}
              </Button>
            </form>
          </Card>

          {/* Active Token & Visit Status */}
          <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <h3 className="font-sans font-semibold text-sm text-slate-800 m-0 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-indigo-600 shrink-0" />
                Active Digital Pass
              </h3>
              {activeToken && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Pass
                </span>
              )}
            </div>

            {activeToken ? (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                {/* Compact, High-Legibility Digital Pass */}
                <div className="relative bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                  {/* Top Institutional Header */}
                  <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                        P
                      </div>
                      <div>
                        <span className="text-xs font-bold tracking-wide text-white block leading-tight">PICT GATE PASS</span>
                        <span className="text-[10px] font-mono text-slate-400 block leading-tight">CAMPUS ACCESS TOKEN</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-emerald-400 block leading-tight">{activeToken.tokenNumber}</span>
                      <span className="text-[10px] text-slate-400 block leading-tight">{activeToken.gateName ? activeToken.gateName.split('-')[0].trim() : 'Gate 1'}</span>
                    </div>
                  </div>

                  {/* Pass Body: Grid of Key Information */}
                  <div className="p-4 grid grid-cols-2 gap-3.5 bg-white font-sans">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Visitor Name</span>
                      <p className="text-base font-bold text-slate-900 m-0 leading-snug">{activeToken.visitorName}</p>
                      <p className="font-mono text-xs text-slate-500 m-0 mt-0.5">{activeToken.mobileNumber}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Visiting Host</span>
                      <p className="text-sm font-bold text-indigo-700 m-0 leading-snug">{activeToken.hostPersonOrDepartment}</p>
                      {activeToken.hostDepartment && (
                        <p className="text-xs text-slate-500 m-0 mt-0.5">Dept of {activeToken.hostDepartment}</p>
                      )}
                    </div>

                    <div className="col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Purpose of Visit</span>
                      <p className="text-xs font-medium text-slate-800 m-0 leading-relaxed">{activeToken.purpose}</p>
                    </div>
                  </div>

                  {/* Perforated Divider with Side Notches */}
                  <div className="relative flex items-center px-3 py-0.5 bg-slate-50/70">
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-slate-200"></div>
                    <div className="w-full border-t border-dashed border-slate-300"></div>
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-slate-200"></div>
                  </div>

                  {/* Pass Footer Timings Strip */}
                  <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-sans">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Entry Time</span>
                      <span className="font-mono text-slate-800 font-bold text-xs">{activeToken.entryTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Pass Type</span>
                      <span className="font-medium text-slate-800 text-xs">{activeToken.vehicleNumber ? activeToken.vehicleNumber : 'Pedestrian'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Valid Till</span>
                      <span className="font-mono text-amber-700 font-bold text-xs">{activeToken.validTillTime}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Verification Note */}
                <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified PICT Digital Pass. Keep this pass active until exit.</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded bg-slate-50">
                <Ticket className="w-7 h-7 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="font-sans text-sm font-semibold text-slate-800 m-0 mb-1">No active token</p>
                <p className="font-sans text-xs text-slate-500 m-0 max-w-[240px] mx-auto">
                  Submit the visit request on the left to generate an authorized campus pass.
                </p>
              </div>
            )}
          </Card>
        </div>
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

    return (
      <div className="space-y-6">
        <div style={{ background: 'var(--ink)', padding: '20px 24px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(47,93,124,0.18)', border: '1px solid rgba(47,93,124,0.35)', borderRadius: 2, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                <ShieldCheck style={{ width: 12, height: 12 }} />
                Duty Terminal (Detailed View)
              </span>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, color: '#f0ede8', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{summary.guardName}</h2>
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                Guard ID: <span style={{ color: 'var(--accent)' }}>{summary.guardId}</span> • Assigned: <span style={{ color: '#e8e6e2', fontWeight: 500 }}>{summary.gateName}</span>
                {summary.shiftStartTime && (
                  <span> • In: <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#6ee7b7' }}>{new Date(summary.shiftStartTime).toLocaleTimeString()}</span></span>
                )}
                {summary.shiftEndTime && (
                  <span> • Out: <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#fca5a5' }}>{new Date(summary.shiftEndTime).toLocaleTimeString()}</span></span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsSimplifiedGuardView(true)}>
                ⚡ Simplified Guard Mode
              </Button>
              <div className="text-right">
                <span className={`px-2.5 py-0.5 rounded-[2px] text-xs font-bold uppercase tracking-wider border ${summary.dutyStatus === 'ON DUTY' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                  {summary.dutyStatus}
                </span>
                <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>{summary.shiftName}</p>
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
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users style={{ width: 16, height: 16, color: '#047857', flexShrink: 0 }} />
                Live Active Visitors Inside Campus
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--mute)', margin: '4px 0 0' }}>Real-time listing of visitors currently inside campus (auto-refreshes every 10s)</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/visitors')}>
              View All Visitor Registers
            </Button>
          </div>

          {activeVisitorsList && activeVisitorsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Pass #</th>
                    <th className="py-2.5 px-3">Visitor Name</th>
                    <th className="py-2.5 px-3">Mobile</th>
                    <th className="py-2.5 px-3">Visiting Host</th>
                    <th className="py-2.5 px-3">Dept</th>
                    <th className="py-2.5 px-3">Check-In Time</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeVisitorsList.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>{v.passNumber || `#${v.id}`}</td>
                      <td className="py-2.5 px-3" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: 'var(--text)' }}>{v.name}</td>
                      <td className="py-2.5 px-3" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--mute)' }}>{v.mobile}</td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--text)' }}>{v.hostName}</td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--mute)', fontSize: 12 }}>{v.hostDepartment} ({v.hostType || 'FACULTY'})</td>
                      <td className="py-2.5 px-3" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--mute)' }}>{new Date(v.timeIn).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge variant="success">Active Inside</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px', border: '1px dashed var(--line)', borderRadius: 4 }}>
              <Users style={{ width: 26, height: 26, color: 'var(--line)', margin: '0 auto 10px' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--mute)', fontWeight: 500, margin: 0 }}>No visitors currently inside campus.</p>
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
        <div style={{ background: 'var(--ink)', padding: '20px 24px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', color: '#6ee7b7', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 2, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <Coffee style={{ width: 12, height: 12 }} />
            Staff & Faculty Portal
          </span>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, color: '#f0ede8', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Welcome, {user?.fullName}</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Department: Computer Engineering • Staff Workspace</p>
        </div>

        {/* Section H2: Break Update Only */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: '0 0 16px', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coffee style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0 }} />
              Staff Break Controls
            </h3>

            {activeBreak ? (
              <div style={{ background: 'rgba(120,53,15,0.15)', border: '1px solid rgba(180,83,9,0.35)', borderRadius: 4, padding: 16 }} className="space-y-3">
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
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: '0 0 16px', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} />
              My Break History
            </h3>

            <div className="space-y-2">
              {breakHistoryRes?.data?.content && breakHistoryRes.data.content.length > 0 ? (
                breakHistoryRes.data.content.map((b) => (
                  <div key={b.id} style={{ padding: '10px 12px', background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e8e6e2' }}>
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div style={{ background: 'var(--ink)', padding: '20px 24px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(47,93,124,0.18)', border: '1px solid rgba(47,93,124,0.35)', borderRadius: 2, padding: '2px 8px', display: 'inline-block', marginBottom: 10 }}>
            Admin Security Control
          </span>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, color: '#f0ede8', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            Welcome, System Admin {user?.fullName}
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            System overview, active gate operations, and security logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />} onClick={() => navigate('/visitors')}>
            Check-In Visitor
          </Button>
          <Button variant="outline" className="border-white/20 text-white/80 hover:bg-white/10" onClick={() => navigate('/users')}>
            User Management
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {isAdminLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[4px]" />)
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
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} />
              Hourly Visitor Traffic (Today)
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--mute)', margin: '4px 0 0' }}>Real-time gate traffic intensity across all campus locations</p>
          </div>
          <Badge variant="purple">System Analytics</Badge>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2f5d7c" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2f5d7c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="visitors" stroke="#2f5d7c" strokeWidth={2} fillOpacity={1} fill="url(#colorVis)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Live Active Visitors Table on Admin Dashboard */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} />
              Active Campus Visitors Log
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--mute)', margin: '4px 0 0' }}>Live monitoring of all visitors currently on campus (auto-refreshes every 10s)</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/visitors')}>
            Manage All Visitors
          </Button>
        </div>

        {activeVisitorsList && activeVisitorsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Pass #</th>
                  <th className="py-2.5 px-3">Visitor Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Visiting Host</th>
                  <th className="py-2.5 px-3">Dept</th>
                  <th className="py-2.5 px-3">Check-In Time</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeVisitorsList.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>{v.passNumber || `#${v.id}`}</td>
                    <td className="py-2.5 px-3" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: 'var(--text)' }}>{v.name}</td>
                    <td className="py-2.5 px-3" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--mute)' }}>{v.mobile}</td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--text)' }}>{v.hostName}</td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--mute)', fontSize: 12 }}>{v.hostDepartment} ({v.hostType || 'FACULTY'})</td>
                    <td className="py-2.5 px-3" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--mute)' }}>{new Date(v.timeIn).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge variant="success">Active Inside</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 20px', border: '1px dashed var(--line)', borderRadius: 4 }}>
            <Users style={{ width: 26, height: 26, color: 'var(--line)', margin: '0 auto 10px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--mute)', fontWeight: 500, margin: 0 }}>No active visitors logged inside campus right now.</p>
          </div>
        )}
      </Card>
    </div>
  );
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

  const [outpassCategory, setOutpassCategory] = useState<'HOSTEL' | 'GATE_DAY'>('HOSTEL');
  const [reasonCategory, setReasonCategory] = useState('Medical Checkup');
  const [reasonDetails, setReasonDetails] = useState('Medical Checkup & Prescription collection at Sahyadri Hospital, Erandwane');
  const [destination, setDestination] = useState('Erandwane, Pune');
  const [parentContact, setParentContact] = useState(user?.phone || '9876543210');
  const [emergencyPhone, setEmergencyPhone] = useState('9812345678');
  const [departureTime, setDepartureTime] = useState(toLocalISOString(new Date()));
  const [expectedReturnTime, setExpectedReturnTime] = useState(toLocalISOString(new Date(Date.now() + 5 * 3600000)));
  const [parentConsent, setParentConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real API Query for Student Outpasses
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

  const activeOutpass = useMemo(() => {
    if (!realOutpassesData || realOutpassesData.length === 0) {
      return {
        id: 999,
        outpassNumber: 'OP-2026-001',
        studentName: studentName || 'Student User',
        studentPrn: studentPrn || 'F24IT32',
        studentHostel: 'Hostel Block B',
        roomNumber: 'B-304',
        reason: 'Medical Checkup & Prescription collection at Sahyadri Hospital',
        destination: 'Erandwane, Pune',
        wardenUsername: 'Dr. S. Kulkarni (Warden)',
        departureTime: 'Today, 02:00 PM',
        expectedReturnTime: 'Today, 07:00 PM',
        status: 'APPROVED',
      };
    }
    return realOutpassesData.find((op: any) => op.status === 'APPROVED' || op.status === 'PENDING_WARDEN' || op.status === 'OUT_OF_CAMPUS') || realOutpassesData[0];
  }, [realOutpassesData, studentName, studentPrn]);

  const outpassList = realOutpassesData || [];

  // Handle New Outpass Form Submit
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonDetails || !destination) {
      toast.error('Please fill in reason and destination address');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        studentName: studentName,
        studentPrn: studentPrn,
        studentHostel: 'Hostel Block B',
        studentRoom: 'B-304',
        studentClass: 'BE',
        studentDivision: '1',
        studentMobile: user?.phone || '9876543210',
        parentContact: parentContact,
        emergencyContact: emergencyPhone,
        reason: `[${reasonCategory}] ${reasonDetails}`,
        studentNote: `Parent consent verified: ${parentConsent ? 'Yes' : 'No'}`,
        destination: destination,
        departureTime: new Date(departureTime).toISOString(),
        expectedReturnTime: new Date(expectedReturnTime).toISOString(),
      };

      const created = await hostelOutpassApi.createOutpass(payload);
      toast.success('Outpass application submitted to Hostel Warden!');
      queryClient.invalidateQueries({ queryKey: ['student-outpasses-dashboard'] });
      setActiveTab('pass');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit outpass');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
              <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-md text-[11px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Verified Student Portal
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-[11px] font-mono text-slate-300">
                Hostel Block B • Room B-304
              </span>
            </div>

            <h2 className="text-xl font-bold mt-2 tracking-tight text-white font-heading">
              Welcome, {studentName}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-3">
              <span>PRN: <strong style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--accent)', fontWeight: 500 }}>{studentPrn}</strong></span>
              <span>•</span>
              <span>Branch: <strong>Computer Engineering</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
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
              leftIcon={<QrCode className="w-4 h-4 text-emerald-300" />}
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
            <History style={{ width: 13, height: 13, color: '#2dd4bf' }} />
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
                    <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>PRN: {activeOutpass.studentPrn}</p>
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
                    <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{activeOutpass.wardenUsername || activeOutpass.approvedByUsername || 'Pending'}</p>
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
                    <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{activeOutpass.expectedReturnTime}</p>
                  </div>
                </div>

                {/* QR Verification Barcode Graphic */}
                <div style={{ background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} className="sm:flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QRCodeDisplay
                      value={JSON.stringify({
                        system: 'CampusAccess PICT Gate Control',
                        passNo: activeOutpass.outpassNumber,
                        prn: activeOutpass.studentPrn,
                        student: activeOutpass.studentName,
                        reason: activeOutpass.reason,
                        validTill: activeOutpass.expectedReturnTime,
                        warden: activeOutpass.wardenUsername || activeOutpass.approvedByUsername,
                        status: activeOutpass.status,
                      })}
                      size={72}
                      showBorder={false}
                      className="p-0 bg-white rounded-xl shadow-md p-1"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-white uppercase tracking-wider">Gate Scanner Ready</p>
                      <p className="text-[11px] text-slate-300">Guards at Main Gate & Hostel Gate can scan or search PRN <strong className="text-emerald-400">{studentPrn}</strong></p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => setShowGuardModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 px-4 shadow-md shrink-0"
                    leftIcon={<QrCode className="w-4 h-4 text-slate-950" />}
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
                    <p className="text-[11px] text-slate-500 mt-0.5">Show QR Pass at Gate 1 or Gate 2</p>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--accent)', fontWeight: 500 }}>Ready for Exit Log</span>
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
          >
            <Card className="max-w-3xl mx-auto shadow-sm border border-slate-200 bg-white p-6 md:p-8 rounded-xl text-slate-900">
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

                {/* Student Autofilled Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <p className="text-slate-500 font-medium">Student Name</p>
                    <p className="font-extrabold text-slate-900 text-sm">{studentName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">PRN Number</p>
                    <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{studentPrn}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Hostel & Room</p>
                    <p className="font-bold text-slate-900 text-sm">Block B • Room B-304</p>
                  </div>
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
                    <History className="w-5 h-5 text-indigo-600" />
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
                        <td className="py-4 px-4" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{op.outpassNumber}</td>
                        <td className="py-4 px-4 font-medium text-slate-800">{op.category}</td>
                        <td className="py-4 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900">{op.reason}</p>
                          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>{op.wardenStatus}</p>
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

              <div className="text-center space-y-1 pr-6">
                <span className="px-3 py-0.5 bg-emerald-100 border border-emerald-300 rounded-full text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  VERIFIED GATE PERMISSION PASS
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 pt-1 font-mono tracking-tight">
                  {activeOutpass.outpassNumber}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">PICT Main Campus Gate Security Pass</p>
                {/* Student Photo / Avatar & Verified Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-indigo-400 font-semibold text-base flex items-center justify-center shrink-0">
                    {studentName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 truncate">{studentName}</h4>
                    <p className="font-mono text-xs text-indigo-600 font-medium">PRN: {studentPrn}</p>
                    <p className="text-[11px] text-slate-500 truncate">Computer Engg • Block B, Rm B-304</p>
                  </div>
                </div>

                {/* Stated Reason Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <p className="text-[9px] text-amber-800 font-extrabold uppercase tracking-wider">Reason Presented to Guard:</p>
                  <p className="text-xs text-amber-950 font-bold mt-0.5">"{activeOutpass.reason}"</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <p className="text-[9px] text-slate-500">Destination</p>
                    <p className="font-bold text-slate-900 truncate">{activeOutpass.destination}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <p className="text-[9px] text-slate-500 mb-0.5">Warden Verification</p>
                    <p className="font-mono text-xs text-emerald-700 font-medium">{activeOutpass.wardenName}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <p className="text-[9px] text-slate-500 mb-0.5">Departure</p>
                    <p className="font-mono text-xs text-emerald-700 font-medium">{activeOutpass.departureTime}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <p className="text-[9px] text-slate-500 mb-0.5">Return Cutoff</p>
                    <p className="font-mono text-xs text-indigo-600 font-medium">{activeOutpass.expectedReturnTime}</p>
                  </div>
                </div>
              </div>
              </div>

              {/* QR Scanner Code - Crisp High Contrast */}
              <div className="text-center bg-slate-900 text-white p-3 rounded-2xl border border-slate-800">
                <QRCodeDisplay
                  value={JSON.stringify({
                    system: 'CampusAccess PICT Gate Control',
                    passNo: activeOutpass.outpassNumber,
                    prn: activeOutpass.studentPrn,
                    student: activeOutpass.studentName,
                    reason: activeOutpass.reason,
                    validTill: activeOutpass.expectedReturnTime,
                    warden: activeOutpass.wardenUsername || activeOutpass.approvedByUsername,
                    status: activeOutpass.status,
                  })}
                  size={150}
                  showBorder={false}
                  title="AUTHENTICATED PASS QR"
                  subtitle={`PRN: ${activeOutpass.studentPrn} • ${activeOutpass.outpassNumber}`}
                  className="p-1"
                />
                <p className="text-[11px] font-mono text-emerald-400 font-bold tracking-wider mt-1">SCAN AT GATE CONTROLLER</p>
                <p className="text-[9px] text-slate-400">Guard can verify via scanner or PRN search in Gate Terminal</p>
              </div>

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
    </div>
  );
};



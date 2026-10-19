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
  BookOpen,
  IdCard,
  HelpCircle,
  UserX,
  Printer,
  Car,
  Users,
  LogOut,
  Upload,
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompression';

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
    return clean;
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

  // Gate Operations Primary Option:
  // 1: FIND_STUDENT_PRN | 2: IDENTIFY_VISITOR_PHOTO | 3: FIND_VISITOR_MOBILE | 4: REGISTER_NEW_VISITOR
  type GateOperationMode = 'FIND_STUDENT_PRN' | 'IDENTIFY_VISITOR_PHOTO' | 'FIND_VISITOR_MOBILE' | 'REGISTER_NEW_VISITOR';
  const [primaryMode, setPrimaryMode] = useState<GateOperationMode>('FIND_STUDENT_PRN');

  // Student Subcategory: 'OUTPASS' (PRN Lookup) vs 'REGULAR' (Gate Pass)
  const [studentMode, setStudentMode] = useState<'REGULAR' | 'OUTPASS'>('OUTPASS');

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
  const [webcamInitialMobileLookup, setWebcamInitialMobileLookup] = useState(false);
  const [visitorCapturedBlob, setVisitorCapturedBlob] = useState<Blob | null>(null);
  const [visitorPhotoPreview, setVisitorPhotoPreview] = useState<string | null>(null);
  const [isNewVisitorModalOpen, setIsNewVisitorModalOpen] = useState(false);
  const [isVisitorExitOpen, setIsVisitorExitOpen] = useState(false);
  const [visitorExitQuery, setVisitorExitQuery] = useState('');
  const [selectedVisitorForExit, setSelectedVisitorForExit] = useState<Visitor | null>(null);
  const [visitorSearchFilter, setVisitorSearchFilter] = useState('');

  // Dedicated Phone Search State (no camera)
  const [isPhoneSearchModalOpen, setIsPhoneSearchModalOpen] = useState(false);
  const [phoneSearchInput, setPhoneSearchInput] = useState('');
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [phoneSearchResult, setPhoneSearchResult] = useState<Visitor | null>(null);

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

  // Photo upload input reference for manual visitor registration
  const visitorPhotoUploadRef = React.useRef<HTMLInputElement>(null);

  const handleVisitorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info('Compressing visitor photo...');
      const compressed = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        format: 'image/jpeg',
      });
      setVisitorCapturedBlob(compressed.blob);
      setVisitorPhotoPreview(compressed.dataUrl);
      toast.success('Visitor photo attached successfully!');
    } catch (err: any) {
      toast.error('Failed to attach photo: ' + (err.message || 'Unknown error'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

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

  // Real-time query for pending student gate outpass requests awaiting guard approval
  const { data: pendingStudentPasses = [] } = useQuery<StudentGatePass[]>({
    queryKey: ['guard-pending-student-passes'],
    queryFn: async () => {
      try {
        const res = await studentPassApi.getPasses({ status: 'PENDING', size: 20 });
        return res?.content || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 3000,
  });

  // Real-time query for pending hostel outpasses awaiting review
  const { data: pendingHostelOutpasses = [] } = useQuery<HostelOutpass[]>({
    queryKey: ['guard-pending-hostel-outpasses'],
    queryFn: async () => {
      try {
        const res = await hostelOutpassApi.getOutpasses({ status: 'PENDING', size: 20 });
        return res?.content || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 3000,
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
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
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
      const cleanPath = match.photoPath.startsWith('/') ? match.photoPath : `/${match.photoPath}`;
      setVisitorPhotoPreview(cleanPath);
      setVisitorCapturedBlob(null);
    }
    // Pre-fill form values
    if (match.visitorName) setVFormName(match.visitorName);
    if (match.mobileNumber) setVFormMobile(match.mobileNumber);
    if (match.hostName) setVFormHost(match.hostName);
    if (match.hostDepartment) setVFormDept(match.hostDepartment);
    if (match.purpose) setVFormPurpose(match.purpose);
    if (match.vehicleNumber) setVFormVehicle(match.vehicleNumber);
    if (match.idProofNumber) setVFormIdNumber(match.idProofNumber);
    if (match.idProofType) setVFormIdType(match.idProofType);
    setIsWebcamOpen(false);
    setIsPhoneSearchModalOpen(false);
    setIsNewVisitorModalOpen(true);
  };

  const populateVisitorForCheckIn = (visitor: any) => {
    const rawPhoto = visitor.photoUrl || visitor.photoPath;
    const cleanPath = rawPhoto ? (rawPhoto.startsWith('/') ? rawPhoto : `/${rawPhoto}`) : null;

    const match: VisitorRecognitionResponse = {
      matched: true,
      visitorId: visitor.id,
      visitorName: visitor.name,
      mobileNumber: visitor.mobile,
      hostPersonOrDepartment: `${visitor.hostName || ''} (${visitor.hostDepartment || ''})`.trim(),
      purpose: visitor.purpose,
      photoPath: cleanPath || undefined,
      hostName: visitor.hostName,
      hostType: visitor.hostType,
      hostDepartment: visitor.hostDepartment,
      studentPrn: visitor.studentPrn,
      idProofType: visitor.idProofType,
      idProofNumber: visitor.idProofNumber,
      vehicleNumber: visitor.vehicleNumber,
      similarity: 1.0,
      confidenceDistance: 0.0,
      matchType: 'exact',
      message: 'Visitor profile loaded via mobile number'
    };

    handleVisitorRecognized(match, null);
  };

  const handlePhoneSearch = async (targetPhone?: string) => {
    const q = (typeof targetPhone === 'string' ? targetPhone : phoneSearchInput).trim();
    const cleanDigits = q.replace(/\D/g, '');
    if (!cleanDigits) {
      toast.error('Please enter a mobile number');
      return;
    }
    if (cleanDigits.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSearchingPhone(true);
    try {
      // 1. Try active inside visitors list first
      const activeMatch = activeVisitors.find(
        (v) => (v.mobile?.replace(/\D/g, '') === cleanDigits) || v.mobile === q
      );

      // 2. Query backend lookup by mobile
      const lookup = await visitorApi.lookupByMobile(cleanDigits);
      const visitor = activeMatch || lookup;

      if (visitor && visitor.name) {
        setPhoneSearchResult(visitor);

        // If visitor is currently inside campus, show options in modal (Exit vs Re-authorize)
        if (activeMatch) {
          toast.info(`Visitor ${visitor.name} is currently inside campus`);
        } else {
          // Returning visitor: directly populate and open pass authorization modal (like Option 2!)
          populateVisitorForCheckIn(visitor);
          toast.success(`Visitor profile fetched for ${visitor.name}`);
        }
      } else {
        toast.info('No registered visitor found with this mobile number');
        setPhoneSearchResult(null);
      }
    } catch {
      toast.info('No visitor found matching this mobile number');
      setPhoneSearchResult(null);
    } finally {
      setIsSearchingPhone(false);
    }
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
    const existingPhoto = recognizedVisitorData?.photoPath ||
      (typeof visitorPhotoPreview === 'string' && !visitorPhotoPreview.startsWith('blob:') ? visitorPhotoPreview : undefined);

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
        photoUrl: existingPhoto,
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

  // Guard Approve / Reject Student Outpass or Hostel Outpass Mutation
  const [reviewModalPass, setReviewModalPass] = useState<(StudentGatePass | HostelOutpass) & { passType?: 'STUDENT_PASS' | 'HOSTEL_OUTPASS' } | null>(null);
  const [guardApprovalNotes, setGuardApprovalNotes] = useState('');
  const [guardRejectionReason, setGuardRejectionReason] = useState('');

  const guardApproveMutation = useMutation({
    mutationFn: async (data: { passId: number; approved: boolean; notes?: string; rejectionReason?: string; isHostel?: boolean }) => {
      if (data.isHostel) {
        return hostelOutpassApi.approveOutpass(data.passId, {
          approved: data.approved,
          wardenRemarks: data.notes,
          rejectionReason: data.rejectionReason,
        });
      }
      return studentPassApi.approvePass(data.passId, {
        approved: data.approved,
        notes: data.notes,
        rejectionReason: data.rejectionReason,
      });
    },
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? 'Student Pass / Outpass APPROVED by Guard!' : 'Student Pass / Outpass REJECTED by Guard');
      queryClient.invalidateQueries({ queryKey: ['student-passes'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-outpasses'] });
      queryClient.invalidateQueries({ queryKey: ['guard-pending-student-passes'] });
      queryClient.invalidateQueries({ queryKey: ['guard-pending-hostel-outpasses'] });
      queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
      setReviewModalPass(null);
      handleRegularStudentSearch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. STUDENT ID FORGOTTEN CHECKUP & ENTRY SLIP WORKFLOW
  // ─────────────────────────────────────────────────────────────────────────────
  const [forgotIdQuery, setForgotIdQuery] = useState('');
  const [isSearchingForgotId, setIsSearchingForgotId] = useState(false);
  const [forgotIdResult, setForgotIdResult] = useState<User | null>(null);
  const [forgotIdError, setForgotIdError] = useState<string | null>(null);
  const [issuedSlip, setIssuedSlip] = useState<{
    studentName: string;
    studentPrn: string;
    passNumber: string;
    gateName: string;
    timeIssued: string;
    notes: string;
  } | null>(null);
  const [entrySlipNotes, setEntrySlipNotes] = useState('Forgot physical ID card - identity verified via directory check');

  const handleForgotIdSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = forgotIdQuery.trim();
    if (!query) {
      toast.error('Please enter student PRN, Roll No, or Name');
      return;
    }

    setIsSearchingForgotId(true);
    setForgotIdError(null);
    setForgotIdResult(null);
    setIssuedSlip(null);

    try {
      const res = await userApi.getUsers({ query, size: 5 });
      const found = res?.content?.find(
        (u) =>
          u.username.toUpperCase() === query.toUpperCase() ||
          u.fullName.toLowerCase().includes(query.toLowerCase())
      ) || (res?.content && res.content.length > 0 ? res.content[0] : null);

      if (found) {
        setForgotIdResult(found);
      } else {
        setForgotIdError(`No student profile located for "${query}". Please check the PRN.`);
      }
    } catch (err: any) {
      setForgotIdError(err.response?.data?.message || 'Student directory lookup failed');
    } finally {
      setIsSearchingForgotId(false);
    }
  };

  const handleIssueForgotIdSlip = () => {
    if (!forgotIdResult) return;
    const slipNumber = `FORGOT-ID-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    setIssuedSlip({
      studentName: forgotIdResult.fullName,
      studentPrn: forgotIdResult.username,
      passNumber: slipNumber,
      gateName: summaryData.gateName || 'Main Entrance Gate',
      timeIssued: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      notes: entrySlipNotes,
    });
    toast.success(`Temporary Entry Slip issued for ${forgotIdResult.fullName} (PRN: ${forgotIdResult.username})`);
    queryClient.invalidateQueries({ queryKey: ['guard-self-dashboard'] });
  };

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
    todayTotalVisitors: activeVisitors.length,
    todayApprovedVisitors: activeVisitors.length,
    todayRejectedVisitors: 0,
    todayCurrentlyInside: activeVisitors.length,
    todayCheckedOutVisitors: 0,
    studentPassesProcessedToday: 0,
    hostelVerifications: 0,
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
      <div className="bg-[#0f172a] text-white rounded-lg p-4 border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
            {summaryData.guardName ? summaryData.guardName[0].toUpperCase() : 'G'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                {summaryData.guardName}
              </h1>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                ON DUTY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {summaryData.gateName} · Terminal {summaryData.guardId}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto self-stretch sm:self-auto pt-2 sm:pt-0 border-t border-slate-800 sm:border-t-0">
          <span className="text-xs text-slate-400 font-sans flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {liveTime}
          </span>
          {onToggleDetailedView && (
            <button
              onClick={onToggleDetailedView}
              className="text-xs sm:text-sm text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-600/80 hover:border-slate-500 px-3.5 py-1.5 rounded-md transition font-medium shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[36px]"
            >
              <span>Details</span>
            </button>
          )}
        </div>
      </div>

      {/* 1.1 DAILY STATISTICS BELOW GUARD'S NAME */}
      <div className="bg-[#0f172a] text-white rounded-lg p-3 sm:p-3.5 border border-slate-800 shadow-xs -mt-3">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 mb-2.5 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Today's Visitor Statistics
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {/* Total Visitors */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-md p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block truncate">
                Total Visitors
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-white font-mono">
                  {summaryData.todayTotalVisitors ?? summaryData.visitorsEnteredToday ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">today</span>
              </div>
            </div>
          </div>

          {/* Approved Visitors */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-md p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-emerald-400/90 tracking-wider block truncate">
                Approved
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-emerald-300 font-mono">
                  {summaryData.todayApprovedVisitors ?? summaryData.visitorsEnteredToday ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">today</span>
              </div>
            </div>
          </div>

          {/* Rejected Visitors */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-md p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-rose-400/90 tracking-wider block truncate">
                Rejected
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-rose-300 font-mono">
                  {summaryData.todayRejectedVisitors ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">today</span>
              </div>
            </div>
          </div>

          {/* Currently Inside */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-md p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <LogIn className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-sky-400/90 tracking-wider block truncate">
                Currently Inside
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-sky-300 font-mono">
                  {summaryData.todayCurrentlyInside ?? summaryData.activeVisitorsInsideCampus ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] text-sky-400 bg-sky-950/60 px-1 py-0.5 rounded border border-sky-800/50">
                  <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Checked Out */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-md p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-purple-400/90 tracking-wider block truncate">
                Checked Out
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-purple-300 font-mono">
                  {summaryData.todayCheckedOutVisitors ?? summaryData.visitorsExitedToday ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">today</span>
              </div>
            </div>
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

      {/* 2B. PENDING STUDENT OUTPASS CLEARANCE BANNER (Direct Guard Approval Flow) */}
      {((pendingStudentPasses && pendingStudentPasses.length > 0) || (pendingHostelOutpasses && pendingHostelOutpasses.length > 0)) && (
        <div className="bg-indigo-50/80 border border-indigo-300 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Pending Student Outpasses ({pendingStudentPasses.length + pendingHostelOutpasses.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-indigo-900 bg-indigo-100/80 border border-indigo-200 px-2 py-0.5 rounded font-semibold">
              Awaiting Guard Decision
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Student Gate Passes */}
            {pendingStudentPasses.map((pass) => (
              <div
                key={`gate-pass-${pass.id}`}
                className="bg-white border border-indigo-200 rounded p-3.5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-slate-900">{pass.studentName}</h3>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">Gate Pass</span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-indigo-600 block mt-0.5">
                        PRN: {pass.studentPrn}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      #{pass.passNumber || pass.id}
                    </span>
                  </div>

                  <div className="mt-2 text-xs space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <p className="text-slate-700 font-medium truncate">
                      <span className="text-slate-500 font-normal">Reason:</span> {pass.purpose || 'Campus Leave'}
                    </p>
                    <p className="text-slate-700 font-medium truncate">
                      <span className="text-slate-500 font-normal">Dest:</span> {pass.destination || 'Pune'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Dep: {pass.departureTime ? new Date(pass.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setReviewModalPass({ ...pass, passType: 'STUDENT_PASS' });
                      setGuardApprovalNotes('Verified by gate security');
                      setGuardRejectionReason('');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-1.5 rounded transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Review & Decide
                  </button>
                </div>
              </div>
            ))}

            {/* Hostel Outpasses */}
            {pendingHostelOutpasses.map((outpass) => (
              <div
                key={`hostel-outpass-${outpass.id}`}
                className="bg-white border border-amber-200 rounded p-3.5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-slate-900">{outpass.studentName}</h3>
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Hostel Leave</span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-amber-800 block mt-0.5">
                        PRN: {outpass.studentPrn}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      #{outpass.outpassNumber || outpass.id}
                    </span>
                  </div>

                  <div className="mt-2 text-xs space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <p className="text-slate-700 font-medium truncate">
                      <span className="text-slate-500 font-normal">Reason:</span> {outpass.reason || 'Campus Leave'}
                    </p>
                    <p className="text-slate-700 font-medium truncate">
                      <span className="text-slate-500 font-normal">Dest:</span> {outpass.destination || outpass.destinationAddress || 'Home'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Hostel: {outpass.studentHostel || outpass.hostelBlock || 'Hostel'} ({outpass.studentRoom || outpass.roomNumber || 'Room'})
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setReviewModalPass({ ...outpass, passType: 'HOSTEL_OUTPASS' });
                      setGuardApprovalNotes('Verified by gate security');
                      setGuardRejectionReason('');
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs py-1.5 rounded transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Review & Decide
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 4. GATE OPERATIONS: FOUR PRIMARY OPTIONS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
              Gate Operations
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Primary Terminal Hub
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* OPTION 1: Find Student by PRN */}
          <button
            onClick={() => {
              setPrimaryMode('FIND_STUDENT_PRN');
              setStudentMode('OUTPASS');
            }}
            className={`p-3 rounded-md border text-left transition flex items-center gap-3 min-h-[56px] ${
              primaryMode === 'FIND_STUDENT_PRN'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs ring-1 ring-indigo-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
              primaryMode === 'FIND_STUDENT_PRN' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'
            }`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold truncate">1. Find Student by PRN</span>
              <span className="block text-[11px] text-slate-500 truncate">PRN lookup & gate status</span>
            </div>
          </button>

          {/* OPTION 2: Identify Visitor by Photo */}
          <button
            onClick={() => {
              setPrimaryMode('IDENTIFY_VISITOR_PHOTO');
              setWebcamInitialMobileLookup(false);
              setIsWebcamOpen(true);
            }}
            className={`p-3 rounded-md border text-left transition flex items-center gap-3 min-h-[56px] ${
              primaryMode === 'IDENTIFY_VISITOR_PHOTO'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs ring-1 ring-indigo-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
              primaryMode === 'IDENTIFY_VISITOR_PHOTO' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'
            }`}>
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold truncate">2. Identify Visitor by Photo</span>
              <span className="block text-[11px] text-slate-500 truncate">Camera & face match</span>
            </div>
          </button>

          {/* OPTION 3: Find Visitor by Mobile Number (NO CAMERA) */}
          <button
            onClick={() => {
              setPrimaryMode('FIND_VISITOR_MOBILE');
              setPhoneSearchInput('');
              setPhoneSearchResult(null);
              setIsPhoneSearchModalOpen(true);
            }}
            className={`p-3 rounded-md border text-left transition flex items-center gap-3 min-h-[56px] ${
              primaryMode === 'FIND_VISITOR_MOBILE'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs ring-1 ring-indigo-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
              primaryMode === 'FIND_VISITOR_MOBILE' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'
            }`}>
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold truncate">3. Find Visitor by Mobile</span>
              <span className="block text-[11px] text-slate-500 truncate">Phone lookup & check-out</span>
            </div>
          </button>

          {/* OPTION 4: Register New Visitor */}
          <button
            onClick={() => {
              setPrimaryMode('REGISTER_NEW_VISITOR');
              setRecognizedVisitorData(null);
              setVisitorCapturedBlob(null);
              if (visitorPhotoPreview) URL.revokeObjectURL(visitorPhotoPreview);
              setVisitorPhotoPreview(null);
              resetVisitorForm();
              setIsNewVisitorModalOpen(true);
            }}
            className={`p-3 rounded-md border text-left transition flex items-center gap-3 min-h-[56px] ${
              primaryMode === 'REGISTER_NEW_VISITOR'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
              primaryMode === 'REGISTER_NEW_VISITOR' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-emerald-600'
            }`}>
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold truncate">4. Register New Visitor</span>
              <span className="block text-[11px] text-slate-500 truncate">New gate pass entry</span>
            </div>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 4. VISITOR (CAMERA & ACTIVE GUEST DIRECTORY) WORKFLOW INTERFACE */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {primaryMode !== 'FIND_STUDENT_PRN' && (
        <div className="space-y-5">


          {/* ACTIVE VISITORS CURRENTLY INSIDE */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Active Visitors ({activeVisitors.length})
                </h2>
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
      {primaryMode === 'FIND_STUDENT_PRN' && (
        <div className="space-y-6">
          {/* STUDENT SUBCATEGORY TOGGLE */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-md px-3 sm:px-4 pt-3 gap-3 sm:gap-6 overflow-x-auto">
            <button
              onClick={() => setStudentMode('OUTPASS')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition min-h-[44px] shrink-0 ${
                studentMode === 'OUTPASS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <IdCard className="w-4 h-4" />
              <span>Student PRN Lookup & Verification</span>
            </button>

            <button
              onClick={() => setStudentMode('REGULAR')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition min-h-[44px] shrink-0 ${
                studentMode === 'REGULAR'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Student Gate Pass Status</span>
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
                              {pass.status === 'PENDING' && (
                                <button
                                  onClick={() => {
                                    setReviewModalPass(pass);
                                    setGuardApprovalNotes('');
                                    setGuardRejectionReason('');
                                  }}
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3 py-1.5 rounded transition flex items-center gap-1 shadow-xs"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Review & Decide
                                </button>
                              )}

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
          {/* OPTION B: STUDENT ID FORGOTTEN / DIRECTORY CHECKUP & PASS ISSUANCE */}
          {/* ───────────────────────────────────────────────────────────────────── */}
          {studentMode === 'OUTPASS' && (
            <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-indigo-600" />
                  Student PRN Lookup & Directory Verification
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter student PRN number (e.g. 310122446894, F24ET046) or Roll No to instantly verify college identity and check enrollment status.
                </p>
              </div>

              {/* SEARCH FORM */}
              <form onSubmit={handleForgotIdSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Student PRN No. (e.g. 310122446894 or F24ET046)"
                    value={forgotIdQuery}
                    onChange={(e) => setForgotIdQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-9 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingForgotId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded transition flex items-center justify-center gap-1.5 min-h-[44px] w-full sm:w-auto"
                >
                  {isSearchingForgotId ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Search Directory</span>
                </button>
              </form>

              {/* ERROR STATE */}
              {forgotIdError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded p-4 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{forgotIdError}</span>
                </div>
              )}

              {/* VERIFIED STUDENT PROFILE CARD */}
              {forgotIdResult && (
                <div className="bg-slate-50 border border-indigo-200 rounded-lg p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-base shrink-0">
                        {forgotIdResult.fullName ? forgotIdResult.fullName[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{forgotIdResult.fullName}</h3>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-700">
                            PRN: {forgotIdResult.username}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Role: <span className="font-semibold text-slate-700">Enrolled Student</span> • Registered: {new Date(forgotIdResult.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded font-bold border ${
                        forgotIdResult.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {forgotIdResult.active ? '✓ ACTIVE ENROLLMENT' : '⚠ SUSPENDED'}
                      </span>
                    </div>
                  </div>

                  {/* STUDENT VERIFICATION DETAILS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white border border-slate-200 rounded-md p-3.5">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Primary Contact</span>
                      <span className="font-mono font-medium text-slate-800">{forgotIdResult.phone || 'Contact not on file'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Student Email</span>
                      <span className="font-mono font-medium text-slate-800 truncate block">{forgotIdResult.email || 'Email not on file'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Campus Entry Status</span>
                      <span className="font-semibold text-emerald-700">Identity Confirmed</span>
                    </div>
                  </div>

                  {/* ISSUE EMERGENCY PASS FORM */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-md p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-indigo-600" />
                      Issue Temporary "Forgot ID" Gate Entry Slip
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-slate-700">Guard Verification Remarks / Note:</label>
                      <input
                        type="text"
                        value={entrySlipNotes}
                        onChange={(e) => setEntrySlipNotes(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. Identity verified via mobile number and directory match"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleIssueForgotIdSlip}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded transition shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Issue Temporary Entry Slip</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ISSUED TEMPORARY SLIP PREVIEW */}
              {issuedSlip && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-emerald-900">
                        Official Emergency Entry Slip Issued
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                      {issuedSlip.passNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white border border-emerald-200 rounded p-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Student Name</span>
                      <strong className="text-slate-900">{issuedSlip.studentName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">PRN</span>
                      <strong className="text-slate-900 font-mono">{issuedSlip.studentPrn}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Issued Gate</span>
                      <strong className="text-slate-900">{issuedSlip.gateName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Issue Time</span>
                      <strong className="text-slate-900 font-mono">{issuedSlip.timeIssued}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-800 m-0">
                    <strong>Guard Audit Note:</strong> {issuedSlip.notes}
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-medium text-xs px-3 py-1.5 rounded transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIssuedSlip(null);
                        setForgotIdResult(null);
                        setForgotIdQuery('');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-1.5 rounded transition"
                    >
                      Done & Ready Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 6. MODALS & SUB-FLOWS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}

      {/* DEDICATED VISITOR PHONE SEARCH MODAL (NO CAMERA) */}
      <AnimatePresence>
        {isPhoneSearchModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => {
              setIsPhoneSearchModalOpen(false);
              setPhoneSearchResult(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xl relative space-y-4 text-slate-800 font-sans"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      Find Visitor by Mobile Number
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">
                      Direct phone database search — fast check-in / check-out without camera.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPhoneSearchModalOpen(false);
                    setPhoneSearchResult(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePhoneSearch();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    autoFocus
                    placeholder="Enter 10-digit mobile number (e.g. 9822012345)..."
                    value={phoneSearchInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhoneSearchInput(val);
                      const clean = val.replace(/\D/g, '');
                      if (clean.length === 10) {
                        handlePhoneSearch(clean);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 outline-none transition font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingPhone}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 shrink-0"
                >
                  {isSearchingPhone ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>{isSearchingPhone ? 'Searching...' : 'Find Visitor'}</span>
                </button>
              </form>

              {/* Search Results Display */}
              {phoneSearchResult ? (
                <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {phoneSearchResult.photoUrl || (phoneSearchResult as any).photoPath ? (
                        <img
                          src={
                            (phoneSearchResult.photoUrl || (phoneSearchResult as any).photoPath).startsWith('/')
                              ? (phoneSearchResult.photoUrl || (phoneSearchResult as any).photoPath)
                              : `/${phoneSearchResult.photoUrl || (phoneSearchResult as any).photoPath}`
                          }
                          alt={phoneSearchResult.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-xs shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-semibold text-base shadow-xs shrink-0">
                          {phoneSearchResult.name?.charAt(0)?.toUpperCase() || 'V'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{phoneSearchResult.name}</h4>
                        <p className="text-xs font-mono text-slate-600">{phoneSearchResult.mobile}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Host: <span className="font-medium text-slate-700">{phoneSearchResult.hostName || 'General Inquiry'}</span> ({phoneSearchResult.hostDepartment || 'General'})
                        </p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                      activeVisitors.some((v) => v.id === phoneSearchResult.id)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {activeVisitors.some((v) => v.id === phoneSearchResult.id) ? 'CURRENTLY INSIDE' : 'REGISTERED PROFILE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white border border-slate-200 rounded-lg p-3">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Purpose</span>
                      <span className="font-medium text-slate-800">{phoneSearchResult.purpose || 'Campus Visit'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Pass #</span>
                      <span className="font-mono font-medium text-slate-800">{phoneSearchResult.passNumber || `VP-${phoneSearchResult.id}`}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80">
                    {/* If inside, provide 1-click Exit AND option to view/re-authorize */}
                    {activeVisitors.some((v) => v.id === phoneSearchResult.id) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => populateVisitorForCheckIn(phoneSearchResult)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>View Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            visitorCheckOutMutation.mutate({ visitorId: phoneSearchResult.id });
                            setIsPhoneSearchModalOpen(false);
                            setPhoneSearchResult(null);
                          }}
                          disabled={visitorCheckOutMutation.isPending}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Confirm Exit</span>
                        </button>
                      </>
                    ) : (
                      /* If not currently inside, allow 1-click Check-In */
                      <button
                        type="button"
                        onClick={() => populateVisitorForCheckIn(phoneSearchResult)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Auto-Fill & Authorize Entry Pass</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Phone className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-600 font-medium">No camera needed.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Search using visitor's 10-digit mobile number for immediate profile lookup.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* A. VISITOR WEBCAM MODAL (FOR OPTION 2: IDENTIFY BY PHOTO ONLY) */}
      <VisitorWebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onRecognized={handleVisitorRecognized}
        onRegisterNew={handleVisitorRegisterNew}
        initialShowMobileLookup={webcamInitialMobileLookup}
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
                {/* Hidden File Input for Direct Photo Upload / Mobile Camera */}
                <input
                  ref={visitorPhotoUploadRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleVisitorPhotoUpload}
                  className="hidden"
                />

                {/* Photo Preview / Capture Card */}
                {visitorPhotoPreview ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={visitorPhotoPreview}
                        alt="Visitor"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-300 bg-white shadow-xs shrink-0"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900">
                          {recognizedVisitorData?.matched ? 'Visitor Photo on File' : 'Visitor Photo Attached'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {visitorCapturedBlob ? 'Enrolled for automatic face ID on next visit' : 'Previous face template on record'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewVisitorModalOpen(false);
                          setIsWebcamOpen(true);
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-md border border-indigo-200 bg-white hover:bg-indigo-50 transition flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => visitorPhotoUploadRef.current?.click()}
                        className="text-xs font-medium text-slate-600 hover:text-slate-800 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 transition flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVisitorCapturedBlob(null);
                          if (visitorPhotoPreview?.startsWith('blob:')) {
                            URL.revokeObjectURL(visitorPhotoPreview);
                          }
                          setVisitorPhotoPreview(null);
                        }}
                        className="text-xs text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 transition"
                        title="Remove Photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-indigo-50/70 border border-dashed border-indigo-300 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Take Visitor Photo (Biometric Enrollment)</h4>
                        <p className="text-[11px] text-slate-500">
                          Capture live face photo or upload an image to enroll for fast future visits.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewVisitorModalOpen(false);
                          setIsWebcamOpen(true);
                        }}
                        className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Open Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => visitorPhotoUploadRef.current?.click()}
                        className="flex-1 sm:flex-initial bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
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
                      onChange={async (e) => {
                        const val = e.target.value;
                        setVFormMobile(val);
                        const cleanDigits = val.replace(/\D/g, '');
                        if (cleanDigits.length === 10 && !recognizedVisitorData) {
                          try {
                            const lookup = await visitorApi.lookupByMobile(cleanDigits);
                            if (lookup && lookup.name) {
                              toast.success(`Found previous record for ${lookup.name}! Details auto-filled.`);
                              populateVisitorForCheckIn(lookup);
                            }
                          } catch {
                            // continue manual registration
                          }
                        }
                      }}
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

      {/* GUARD REVIEW & APPROVE / REJECT STUDENT PASS MODAL */}
      <AnimatePresence>
        {reviewModalPass && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setReviewModalPass(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full max-h-[92vh] overflow-y-auto bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xl relative space-y-4 text-slate-800 font-sans leading-relaxed box-border"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      Review Student Pass Request
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">
                      Verify details and make a security clearance decision.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalPass(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student Summary Banner Card */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-semibold text-base shadow-xs shrink-0">
                    {reviewModalPass.studentName?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {reviewModalPass.studentName}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                        PRN: {reviewModalPass.studentPrn}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {('studentHostel' in reviewModalPass && reviewModalPass.studentHostel)
                        ? `Hostel ${reviewModalPass.studentHostel} (${reviewModalPass.studentRoom || reviewModalPass.roomNumber || ''})`
                        : ('studentDepartment' in reviewModalPass && reviewModalPass.studentDepartment)
                        ? reviewModalPass.studentDepartment
                        : 'Student'}
                      {reviewModalPass.studentClass ? ` • Class ${reviewModalPass.studentClass}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 border border-amber-200 text-amber-800 shrink-0">
                  Pending Clearance
                </span>
              </div>

              {/* Travel & Purpose Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="border border-slate-200/90 rounded-xl p-3.5 bg-white space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium block">
                    Purpose of Leave
                  </span>
                  <p className="text-sm font-medium text-slate-800 break-words">
                    {('purpose' in reviewModalPass ? reviewModalPass.purpose : reviewModalPass.reason) || 'Campus Leave'}
                  </p>
                </div>

                <div className="border border-slate-200/90 rounded-xl p-3.5 bg-white space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium block">
                    Destination
                  </span>
                  <p className="text-sm font-medium text-slate-800 break-words">
                    {reviewModalPass.destination || ('destinationAddress' in reviewModalPass ? reviewModalPass.destinationAddress : 'Pune')}
                  </p>
                </div>
              </div>

              {/* Schedule Timing Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl p-3.5 border border-amber-200 bg-amber-50/50 space-y-1">
                  <span className="text-xs font-medium text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Scheduled Departure
                  </span>
                  <p className="text-sm font-semibold text-slate-900">
                    {reviewModalPass.departureTime
                      ? new Date(reviewModalPass.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Scheduled'}
                  </p>
                </div>

                <div className="rounded-xl p-3.5 border border-emerald-200 bg-emerald-50/50 space-y-1">
                  <span className="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    Expected Return
                  </span>
                  <p className="text-sm font-semibold text-slate-900">
                    {reviewModalPass.expectedReturnTime
                      ? new Date(reviewModalPass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Scheduled'}
                  </p>
                </div>
              </div>

              {/* Guard Decision Inputs */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Approval Notes (Optional):
                  </label>
                  <input
                    type="text"
                    value={guardApprovalNotes}
                    onChange={(e) => setGuardApprovalNotes(e.target.value)}
                    placeholder="e.g. Identity and reason verified at gate"
                    className="w-full bg-slate-50/60 border border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Rejection Reason (Required if Rejecting):
                  </label>
                  <input
                    type="text"
                    value={guardRejectionReason}
                    onChange={(e) => setGuardRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete details / unauthorized departure"
                    className="w-full bg-slate-50/60 border border-slate-300 hover:border-slate-400 focus:border-rose-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={guardApproveMutation.isPending}
                  onClick={() => {
                    if (!guardRejectionReason.trim()) {
                      toast.error('Please enter a rejection reason before rejecting');
                      return;
                    }
                    guardApproveMutation.mutate({
                      passId: reviewModalPass.id,
                      approved: false,
                      rejectionReason: guardRejectionReason.trim(),
                      isHostel: reviewModalPass.passType === 'HOSTEL_OUTPASS',
                    });
                  }}
                  className="w-full sm:w-auto text-center shrink-0 whitespace-nowrap bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-medium text-xs px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  disabled={guardApproveMutation.isPending}
                  onClick={() => {
                    guardApproveMutation.mutate({
                      passId: reviewModalPass.id,
                      approved: true,
                      notes: guardApprovalNotes.trim() || undefined,
                      isHostel: reviewModalPass.passType === 'HOSTEL_OUTPASS',
                    });
                  }}
                  className="w-full sm:w-auto text-center shrink-0 whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Approve Pass</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

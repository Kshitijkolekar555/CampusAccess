import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorApi } from '../api/visitors';
import { gateApi } from '../api/gates';
import { facultyApi } from '../api/faculties';
import { useAuthStore } from '../store/authStore';
import { Visitor, HostType, HostDepartment, VisitorRecognitionResponse } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { QRCodeDisplay } from '../components/ui/QRCodeDisplay';
import { VisitorWebcamModal } from '../components/visitor/VisitorWebcamModal';
import { UserPlus, LogOut, Search, QrCode, CheckCircle, Shield, ScanFace, Camera, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  validatePhone,
  validateName,
  validatePurpose,
  validateVehicleNumber,
  validatePrn,
  normalizePhone,
  normalizeVehicleNumber,
  normalizeName
} from '../utils/validation';

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
        alt=""
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500/30 flex-shrink-0 shadow-sm bg-slate-100 dark:bg-slate-800"
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
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs flex-shrink-0 uppercase shadow-sm">
      {initials}
    </div>
  );
};

export const Visitors: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [hostTypeFilter, setHostTypeFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
  const [checkoutVisitor, setCheckoutVisitor] = useState<Visitor | null>(null);
  const [qrVisitor, setQrVisitor] = useState<Visitor | null>(null);

  // Form State Default
  const initialFormState = {
    name: '',
    mobile: '',
    purpose: '',
    hostName: '',
    hostType: 'FACULTY' as HostType,
    hostDepartment: 'CE' as HostDepartment,
    studentPrn: '',
    gateId: 1,
    vehicleNumber: '',
    idProofType: 'Aadhaar Card',
    idProofNumber: '',
    notes: '',
  };

  const [form, setForm] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setForm(initialFormState);
    setFormErrors({});
    setCapturedPhotoBlob(null);
  };

  const validateVisitorForm = () => {
    const errs: Record<string, string> = {};
    const nameErr = validateName(form.name, 'Visitor Name');
    if (nameErr) errs.name = nameErr;

    const phoneErr = validatePhone(form.mobile);
    if (phoneErr) errs.mobile = phoneErr;

    const purposeErr = validatePurpose(form.purpose);
    if (purposeErr) errs.purpose = purposeErr;

    const hostErr = validateName(form.hostName, 'Host Name');
    if (hostErr) errs.hostName = hostErr;

    if (form.vehicleNumber) {
      const vehicleErr = validateVehicleNumber(form.vehicleNumber);
      if (vehicleErr) errs.vehicleNumber = vehicleErr;
    }

    if (form.hostType === 'STUDENT' && form.studentPrn) {
      const prnErr = validatePrn(form.studentPrn);
      if (prnErr) errs.studentPrn = prnErr;
    }

    if (!form.idProofType.trim()) errs.idProofType = 'ID Proof Type is required';
    if (!form.idProofNumber.trim()) errs.idProofNumber = 'ID Proof Number is required';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Query Visitors with hostType filter support
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['visitors', page, search, hostTypeFilter],
    queryFn: () => visitorApi.getVisitors({
      page,
      size: 10,
      query: search || undefined,
      hostType: hostTypeFilter ? (hostTypeFilter as HostType) : undefined,
    }),
  });

  // Query Active Visitors Inside
  const { data: activeVisitors } = useQuery({
    queryKey: ['visitors-active'],
    queryFn: visitorApi.getActiveInside,
  });

  // Query Gates for selection
  const { data: gates } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gateApi.getAllGates(true),
  });

  // Query Faculties for easy host selection
  const { data: facultiesList } = useQuery({
    queryKey: ['faculties-all'],
    queryFn: () => facultyApi.getAllFaculties(),
  });

  // CheckIn Mutation with Photo Support
  const checkInMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (capturedPhotoBlob) {
        return visitorApi.registerWithPhoto(capturedPhotoBlob, data);
      }
      return visitorApi.checkIn(data);
    },
    onSuccess: (data) => {
      toast.success('Visitor checked in successfully!');
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitors-active'] });
      setIsCheckInOpen(false);
      resetForm();
      setQrVisitor(data);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-in failed');
    },
  });

  // CheckOut Mutation
  const checkOutMutation = useMutation({
    mutationFn: visitorApi.checkOut,
    onSuccess: () => {
      toast.success('Visitor checked out successfully!');
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitors-active'] });
      setCheckoutVisitor(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Check-out failed');
    },
  });

  const { user } = useAuthStore();

  const handleRecognized = (match: VisitorRecognitionResponse, blob: Blob | null) => {
    if (blob) {
      setCapturedPhotoBlob(blob);
    }
    if (match.matched && match.visitorName) {
      setForm({
        name: match.visitorName || '',
        mobile: match.mobileNumber || '',
        hostName: match.hostName || '',
        purpose: match.purpose || '',
        hostType: match.hostType || 'FACULTY',
        hostDepartment: match.hostDepartment || 'CE',
        studentPrn: match.studentPrn || '',
        gateId: 1,
        idProofType: match.idProofType || 'Aadhaar Card',
        idProofNumber: match.idProofNumber || '',
        vehicleNumber: match.vehicleNumber || '',
        notes: '',
      });
      toast.success(`Auto-filled details for ${match.visitorName}`);
    } else {
      resetForm();
      toast.info('Visitor not recognized – please fill details for new visitor');
    }
    setIsWebcamOpen(false);
    setIsCheckInOpen(true);
  };

  const handleRegisterNewFromWebcam = (blob: Blob | null) => {
    resetForm();
    if (blob) {
      setCapturedPhotoBlob(blob);
    }
    setIsWebcamOpen(false);
    setIsCheckInOpen(true);
  };

  const columns: Column<Visitor>[] = [
    {
      header: 'Visitor',
      render: (v) => (
        <div className="flex items-center gap-3">
          <VisitorAvatar photoUrl={v.photoUrl} name={v.name} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-slate-900">{v.name}</p>
              {v.faceId && (
                <Badge variant="purple" className="text-[9px] py-0 px-1">
                  Face Enrolled
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">{v.mobile}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Pass #',
      accessor: 'passNumber',
      render: (v) => <span className="font-mono text-xs font-semibold text-indigo-600 tracking-tight">{v.passNumber || `#${v.id}`}</span>,
    },
    {
      header: 'Host & Dept',
      render: (v) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{v.hostName}</p>
          <p className="text-[11px] text-slate-400">{v.hostDepartment} ({v.hostType})</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (v) => (
        <Badge variant={v.timeOut ? 'default' : 'success'}>
          {v.timeOut ? 'Checked Out' : 'Active Inside'}
        </Badge>
      ),
    },
    {
      header: 'Check In Time',
      render: (v) => <span className="text-xs text-slate-500">{new Date(v.timeIn).toLocaleTimeString()}</span>,
    },
    {
      header: 'Actions',
      render: (v) => {
        const canCheckOut = user?.role === 'SECURITY_GUARD' || user?.role === 'GUARD' || user?.role === 'ADMIN' || user?.role === 'SECURITY_OFFICER';

        return (
          <div className="flex items-center gap-2">
            {v.qrCodeDataUrl && (
              <Button variant="ghost" size="sm" onClick={() => setQrVisitor(v)}>
                <QrCode className="w-4 h-4 text-indigo-600" />
              </Button>
            )}
            {!v.timeOut && canCheckOut && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckoutVisitor(v)}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Exit
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-heading flex items-center gap-2">
            Visitor Management
          </h2>
          <p className="text-xs text-slate-500">
            Real-time visitor registration, AI facial recognition, QR digital pass generation, and checkout tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<ScanFace className="w-4 h-4 text-indigo-600" />}
            onClick={() => setIsWebcamOpen(true)}
          >
            Scan Face / Webcam
          </Button>

          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsCheckInOpen(true);
            }}
          >
            Check-In New Visitor
          </Button>
        </div>
      </div>

      {/* Active Visitors Stat Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-slate-200 rounded-md shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Visitors Inside</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 font-heading">{activeVisitors?.length ?? 0}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Face Verification & Watchlist Enabled</h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Captures 128-D facial vector embeddings at campus gates to verify visitor identity automatically.</p>
          </div>
          <Badge variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}>Active</Badge>
        </Card>
      </div>

      {/* Search & Host Type Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search visitor by name, mobile, or pass #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 shadow-xs"
          />
        </div>

        {/* Host Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Host Category:</span>
          <select
            value={hostTypeFilter}
            onChange={(e) => {
              setHostTypeFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
          >
            <option value="">All Host Categories</option>
            <option value="FACULTY">Teachers / Faculty</option>
            <option value="HOD">Department HOD</option>
            <option value="ADMIN_STAFF">Admin Staff</option>
            <option value="STUDENT">Student Host</option>
            <option value="ALUMNI">Alumni</option>
            <option value="VENDOR">Vendor / Contractor</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={pageData?.content || []}
        isLoading={isLoading}
        emptyTitle="No visitors found"
        emptyDescription="Get started by clicking Check-In New Visitor or Scan Face."
      />

      {pageData && (
        <Pagination
          currentPage={pageData.pageNumber}
          totalPages={pageData.totalPages}
          totalElements={pageData.totalElements}
          pageSize={pageData.pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Facial Recognition Webcam Modal */}
      <VisitorWebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onRecognized={handleRecognized}
        onRegisterNew={handleRegisterNewFromWebcam}
      />

      {/* Check In Modal */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          resetForm();
        }}
        title="Check-In Visitor & Issue Digital Pass"
        subtitle="Registers visitor details and generates a QR pass"
        maxWidth="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validateVisitorForm()) return;
            const normalizedData = {
              ...form,
              name: normalizeName(form.name),
              mobile: normalizePhone(form.mobile),
              hostName: normalizeName(form.hostName),
              purpose: form.purpose.trim(),
              vehicleNumber: form.vehicleNumber ? normalizeVehicleNumber(form.vehicleNumber) : '',
              studentPrn: form.studentPrn ? form.studentPrn.trim().toUpperCase() : '',
            };
            checkInMutation.mutate(normalizedData);
          }}
          className="space-y-4"
        >
          {capturedPhotoBlob && (
            <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Camera className="w-4 h-4" />
                <span>Facial photo attached for AI enrollment</span>
              </div>
              <Badge variant="purple" className="text-[10px]">Photo Ready</Badge>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Visitor Name"
              placeholder="Full Name"
              required
              value={form.name}
              error={formErrors.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
              }}
              onBlur={() => {
                const err = validateName(form.name, 'Visitor Name');
                if (err) setFormErrors((prev) => ({ ...prev, name: err }));
              }}
            />
            <Input
              label="Mobile Number"
              placeholder="10-digit mobile"
              required
              value={form.mobile}
              error={formErrors.mobile}
              onChange={(e) => {
                setForm({ ...form, mobile: e.target.value });
                if (formErrors.mobile) setFormErrors({ ...formErrors, mobile: '' });
              }}
              onBlur={() => {
                const err = validatePhone(form.mobile);
                if (err) setFormErrors((prev) => ({ ...prev, mobile: err }));
              }}
            />
            <Input
              label="Purpose of Visit"
              placeholder="Meeting, Inspection..."
              required
              value={form.purpose}
              error={formErrors.purpose}
              onChange={(e) => {
                setForm({ ...form, purpose: e.target.value });
                if (formErrors.purpose) setFormErrors({ ...formErrors, purpose: '' });
              }}
              onBlur={() => {
                const err = validatePurpose(form.purpose);
                if (err) setFormErrors((prev) => ({ ...prev, purpose: err }));
              }}
            />
            <Select
              label="Host Category"
              value={form.hostType}
              onChange={(e) => setForm({ ...form, hostType: e.target.value as HostType })}
              options={[
                { label: 'Faculty / Professor', value: 'FACULTY' },
                { label: 'Head of Department (HOD)', value: 'HOD' },
                { label: 'Admin Staff', value: 'ADMIN_STAFF' },
                { label: 'Student', value: 'STUDENT' },
                { label: 'Alumni', value: 'ALUMNI' },
                { label: 'Vendor', value: 'VENDOR' },
                { label: 'Other', value: 'OTHER' },
              ]}
            />

            <Select
              label="Host Department"
              value={form.hostDepartment}
              onChange={(e) => setForm({ ...form, hostDepartment: e.target.value as HostDepartment })}
              options={[
                { label: 'Computer Engineering (CE)', value: 'CE' },
                { label: 'Information Technology (IT)', value: 'IT' },
                { label: 'Electronics & Telecomm (ENTC)', value: 'ENTC' },
                { label: 'Electronics & Computer (ECE)', value: 'ECE' },
                { label: 'AI & Data Science (AIDS)', value: 'AIDS' },
                { label: 'Basic Sciences & Engineering (BSE)', value: 'BSE' },
                { label: 'Administrative Office (ADMIN)', value: 'ADMIN' },
              ]}
            />

            {(form.hostType === 'FACULTY' || form.hostType === 'HOD') && (
              <div className="space-y-1.5 bg-indigo-50/60 p-3 rounded-md border border-indigo-100">
                <label className="text-xs font-semibold text-indigo-950 flex items-center justify-between">
                  <span>Select from PICT Faculty Directory</span>
                  <span className="text-[10px] text-indigo-600 font-normal">
                    {facultiesList?.filter(f => !form.hostDepartment || f.department === form.hostDepartment).length || 0} available in dept
                  </span>
                </label>
                <select
                  className="w-full text-xs py-2 px-2.5 rounded border border-indigo-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  onChange={(e) => {
                    const sel = facultiesList?.find(f => f.name === e.target.value);
                    if (sel) {
                      setForm({
                        ...form,
                        hostName: sel.name,
                        hostDepartment: sel.department,
                        hostType: (sel.name.toLowerCase().includes('hod') || sel.email.toLowerCase().includes('hod')) ? 'HOD' : 'FACULTY',
                        notes: form.notes ? form.notes : `Contact: ${sel.email} | ${sel.phone}`
                      });
                      if (formErrors.hostName) setFormErrors({ ...formErrors, hostName: '' });
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>-- Quick pick from faculty directory --</option>
                  {(facultiesList || [])
                    .filter(f => !form.hostDepartment || f.department === form.hostDepartment)
                    .map(f => (
                      <option key={f.id} value={f.name}>
                        {f.name} ({f.department}) {f.phone ? `· ${f.phone}` : ''}
                      </option>
                    ))}
                </select>
                {facultiesList?.find(f => f.name.toLowerCase() === form.hostName.toLowerCase()) && (
                  <div className="mt-2 text-[11px] text-indigo-900 bg-white p-2 rounded border border-indigo-100 flex flex-col gap-0.5">
                    {(() => {
                      const f = facultiesList.find(fac => fac.name.toLowerCase() === form.hostName.toLowerCase())!;
                      return (
                        <>
                          <div className="font-semibold text-indigo-700">{f.name} &bull; <span className="text-slate-600 font-normal">{f.designation || 'Faculty'}</span></div>
                          <div className="text-slate-600">Email: <span className="text-slate-900 select-all font-mono">{f.email}</span></div>
                          {f.phone && <div className="text-slate-600">Phone: <span className="text-slate-900 font-mono font-medium">{f.phone}</span></div>}
                          {f.cabinLocation && <div className="text-slate-500 italic text-[10px]">{f.cabinLocation}</div>}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <Input
              label="Host Person Name"
              placeholder="Prof. Sharma / Admin Officer"
              required
              value={form.hostName}
              error={formErrors.hostName}
              onChange={(e) => {
                setForm({ ...form, hostName: e.target.value });
                if (formErrors.hostName) setFormErrors({ ...formErrors, hostName: '' });
              }}
              onBlur={() => {
                const err = validateName(form.hostName, 'Host Name');
                if (err) setFormErrors((prev) => ({ ...prev, hostName: err }));
              }}
            />

            {form.hostType === 'STUDENT' && (
              <Input
                label="Student PRN"
                placeholder="e.g. C2K21001"
                value={form.studentPrn}
                error={formErrors.studentPrn}
                onChange={(e) => {
                  setForm({ ...form, studentPrn: e.target.value.toUpperCase() });
                  if (formErrors.studentPrn) setFormErrors({ ...formErrors, studentPrn: '' });
                }}
                onBlur={() => {
                  const err = validatePrn(form.studentPrn);
                  if (err) setFormErrors((prev) => ({ ...prev, studentPrn: err }));
                }}
              />
            )}

            <Select
              label="Gate"
              value={form.gateId}
              onChange={(e) => setForm({ ...form, gateId: Number(e.target.value) })}
              options={gates && gates.length > 0
                ? gates.map((g) => ({ label: g.name, value: g.id }))
                : [{ label: 'Gate 1 - Main Entrance', value: 1 }]}
            />

            <Input
              label="ID Proof Type"
              placeholder="Aadhaar / Driving License"
              required
              value={form.idProofType}
              error={formErrors.idProofType}
              onChange={(e) => {
                setForm({ ...form, idProofType: e.target.value });
                if (formErrors.idProofType) setFormErrors({ ...formErrors, idProofType: '' });
              }}
            />
            <Input
              label="ID Proof Number"
              placeholder="ID Number"
              required
              value={form.idProofNumber}
              error={formErrors.idProofNumber}
              onChange={(e) => {
                setForm({ ...form, idProofNumber: e.target.value });
                if (formErrors.idProofNumber) setFormErrors({ ...formErrors, idProofNumber: '' });
              }}
            />
            <Input
              label="Vehicle Number (Optional)"
              placeholder="MH12AB1234"
              value={form.vehicleNumber}
              error={formErrors.vehicleNumber}
              onChange={(e) => {
                setForm({ ...form, vehicleNumber: e.target.value });
                if (formErrors.vehicleNumber) setFormErrors({ ...formErrors, vehicleNumber: '' });
              }}
              onBlur={() => {
                if (form.vehicleNumber) {
                  const err = validateVehicleNumber(form.vehicleNumber);
                  if (err) setFormErrors((prev) => ({ ...prev, vehicleNumber: err }));
                  else setForm({ ...form, vehicleNumber: normalizeVehicleNumber(form.vehicleNumber) });
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsCheckInOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={checkInMutation.isPending}>
              Complete Check-In
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Pass Preview Modal */}
      <Modal
        isOpen={!!qrVisitor}
        onClose={() => setQrVisitor(null)}
        title="Visitor Digital Gate Pass & QR Code"
        subtitle="Present or scan this pass at campus security checkpoints"
        maxWidth="md"
      >
        {qrVisitor && (
          <div className="p-2 space-y-5">
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">PICT Digital Access Pass</span>
                  <h4 className="font-extrabold text-lg text-white">{qrVisitor.name}</h4>
                </div>
                <Badge variant="purple" className="font-mono font-bold text-xs tracking-wider">{qrVisitor.passNumber || `PICT-PASS-${qrVisitor.id}`}</Badge>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {qrVisitor.qrCodeDataUrl ? (
                  <div className="bg-white p-3 rounded-2xl shrink-0 shadow-lg">
                    <img src={qrVisitor.qrCodeDataUrl} alt="QR Digital Pass Code" className="w-40 h-40" />
                  </div>
                ) : (
                  <QRCodeDisplay
                    value={JSON.stringify({
                      system: 'CampusAccess Visitor Pass',
                      passNo: qrVisitor.passNumber || `PICT-PASS-${qrVisitor.id}`,
                      name: qrVisitor.name,
                      mobile: qrVisitor.mobile,
                      host: qrVisitor.hostName,
                      dept: qrVisitor.hostDepartment,
                      purpose: qrVisitor.purpose,
                    })}
                    size={140}
                    title="VISITOR ACCESS QR"
                    subtitle={qrVisitor.passNumber || `PICT-PASS-${qrVisitor.id}`}
                  />
                )}

                <div className="grid grid-cols-2 gap-3 text-xs w-full">
                  <div>
                    <p className="text-slate-400">Mobile</p>
                    <p className="font-semibold">{qrVisitor.mobile}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Visiting Host</p>
                    <p className="font-semibold text-indigo-300">{qrVisitor.hostName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Department</p>
                    <p className="font-semibold">{qrVisitor.hostDepartment}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Host Type</p>
                    <p className="font-semibold text-emerald-400">{qrVisitor.hostType || 'FACULTY'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Purpose</p>
                    <p className="font-semibold truncate">{qrVisitor.purpose}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <Badge variant={qrVisitor.timeOut ? 'default' : 'success'}>
                      {qrVisitor.timeOut ? 'Checked Out' : 'Active Inside'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="primary" className="w-full" onClick={() => setQrVisitor(null)}>
                Close Pass View
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Check Out Modal */}
      <Modal
        isOpen={!!checkoutVisitor}
        onClose={() => setCheckoutVisitor(null)}
        title="Confirm Visitor Exit"
        subtitle="Log visitor checkout from campus"
        maxWidth="sm"
      >
        {checkoutVisitor && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to check out <strong>{checkoutVisitor.name}</strong> (Pass #{checkoutVisitor.passNumber})?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCheckoutVisitor(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={checkOutMutation.isPending}
                onClick={() => checkOutMutation.mutate({ visitorId: checkoutVisitor.id })}
              >
                Log Exit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

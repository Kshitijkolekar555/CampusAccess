import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Camera, CheckCircle2, UserPlus, Sparkles,
  AlertCircle, RefreshCw, Users, CameraOff, Loader2, X, Shield,
  Phone, Mail, MapPin, Car, FileText, ScanFace,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { visitorApi } from '../api/visitors';
import { VisitorWebcamModal } from '../components/visitor/VisitorWebcamModal';
import type { VisitorRecognitionResponse } from '../types';

/* ── colour tokens ────────────────────────────────────────────────────────── */
const C = {
  ink:    '#14171c',
  paper:  '#fafaf8',
  line:   '#e2e0da',
  text:   '#1c1c1a',
  mute:   '#8c887e',
  accent: '#2f5d7c',
  green:  '#047857',
};

/* ── Underline Input ──────────────────────────────────────────────────────── */
interface UInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}
const UInput: React.FC<UInputProps> = ({ label, type = 'text', value, onChange, placeholder, icon, required, disabled }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11,
        fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: C.mute, marginBottom: 7,
      }}>{label}{required && <span style={{ color: '#e53e3e', marginLeft: 3 }}>*</span>}</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${disabled ? C.line : focused ? C.text : C.line}`,
        paddingBottom: 8, transition: 'border-color 0.15s',
        opacity: disabled ? 0.55 : 1,
      }}>
        {icon && <span style={{ color: focused ? C.text : C.mute, flexShrink: 0, display: 'flex' }}>{icon}</span>}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required} disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'Inter,sans-serif', fontSize: 14, color: C.text,
            caretColor: C.accent,
          }}
        />
      </div>
    </div>
  );
};

/* ── USelect ──────────────────────────────────────────────────────────────── */
const USelect: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}> = ({ label, value, onChange, options, required }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{
      display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11,
      fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
      color: C.mute, marginBottom: 7,
    }}>{label}{required && <span style={{ color: '#e53e3e', marginLeft: 3 }}>*</span>}</label>
    <select value={value} onChange={e => onChange(e.target.value)} required={required}
      style={{
        width: '100%', background: 'transparent', border: 'none',
        borderBottom: `1px solid ${C.line}`, paddingBottom: 8, paddingTop: 2,
        fontFamily: 'Inter,sans-serif', fontSize: 14, color: C.text, outline: 'none',
        appearance: 'none', cursor: 'pointer',
      }}>
      <option value="">Select…</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

/* ── Step type ───────────────────────────────────────────────────────────── */
type Step = 'CAMERA' | 'RECOGNIZING' | 'RETURNING' | 'REGISTER' | 'CONFIRM';

/* ── HOST options ─────────────────────────────────────────────────────────── */
const HOST_TYPES = [
  { value: 'FACULTY', label: 'Faculty / Professor' },
  { value: 'HOD', label: 'Head of Department' },
  { value: 'ADMIN_STAFF', label: 'Administrative Staff' },
  { value: 'STUDENT', label: 'Student (relative/friend)' },
  { value: 'ALUMNI', label: 'Alumni' },
  { value: 'VENDOR', label: 'Vendor / Service' },
  { value: 'OTHER', label: 'Other' },
];
const DEPARTMENTS = [
  { value: 'IT',    label: 'Information Technology' },
  { value: 'CE',    label: 'Computer Engineering' },
  { value: 'ENTC',  label: 'E&TC Engineering' },
  { value: 'ECE',   label: 'Electronics & Communication' },
  { value: 'AIDS',  label: 'AI & Data Science' },
  { value: 'ADMIN', label: 'Administration / General' },
];
// Removed ID proof type and number from public visitor flow as requested
/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VisitorPortal — main component                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
export const VisitorPortal: React.FC = () => {
  const navigate = useNavigate();

  /* ── step state ─────────────────────────────────────────────────────────── */
  const [step, setStep] = useState<Step>('CAMERA');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<VisitorRecognitionResponse | null>(null);

  /* ── registration form state ────────────────────────────────────────────── */
  const [name, setName]           = useState('');
  const [mobile, setMobile]       = useState('');
  const [email, setEmail]         = useState('');
  const [hostName, setHostName]   = useState('');
  const [hostType, setHostType]   = useState('FACULTY');
  const [hostDept, setHostDept]   = useState('IT');
  const [purpose, setPurpose]     = useState('');
  const [vehicle, setVehicle]     = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedVisitor, setSubmittedVisitor] = useState<any>(null);

  /* ── camera recognition handlers (from shared VisitorWebcamModal) ────────── */
  const handleVisitorRecognized = (match: VisitorRecognitionResponse, blob: Blob | null) => {
    setRecognitionResult(match);
    if (blob) {
      setCapturedBlob(blob);
      setCapturedPreview(URL.createObjectURL(blob));
    } else if (match.photoPath) {
      setCapturedPreview(`http://localhost:8081/${match.photoPath.replace(/^\/+/, '')}`);
    }

    // Pre-fill returning visitor fields
    if (match.visitorName)             setName(match.visitorName);
    if (match.mobileNumber)            setMobile(match.mobileNumber);
    if (match.hostName)                setHostName(match.hostName);
    if (match.hostType)                setHostType(match.hostType);
    if (match.hostDepartment)          setHostDept(match.hostDepartment);
    if (match.purpose)                 setPurpose(match.purpose);
    if (match.vehicleNumber)           setVehicle(match.vehicleNumber);

    setStep('RETURNING');
  };

  const handleVisitorRegisterNew = (blob: Blob | null) => {
    if (blob) {
      setCapturedBlob(blob);
      setCapturedPreview(URL.createObjectURL(blob));
    }
    setRecognitionResult(null);
    setStep('REGISTER');
  };

  /* ── submit registration ────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !purpose.trim()) {
      toast.error('Please fill all required fields (Name, Mobile, Purpose)');
      return;
    }
    const mobileRe = /^[6-9]\d{9}$/;
    if (!mobileRe.test(mobile.replace(/\s/g, ''))) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      const visitorData = {
        name:            name.trim(),
        mobile:          mobile.trim(),
        purpose:         purpose.trim(),
        hostName:        hostName.trim() || 'General Inquiry',
        hostType:        hostType || 'OTHER',
        hostDepartment:  hostDept || 'ADMIN',
        gateId:          1,
        vehicleNumber:   vehicle.trim() || undefined,
        email:           email.trim() || undefined,
        // If returning, pass existing visitor ID so backend can update rather than create
        ...(recognitionResult?.matched && recognitionResult?.visitorId
            ? { existingVisitorId: recognitionResult.visitorId }
            : {}),
      };

      const result = await visitorApi.registerWithPhoto(capturedBlob, visitorData);
      setSubmittedVisitor(result);
      setStep('CONFIRM');
      toast.success('Visitor registration successful! Proceed to the gate for security verification.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── retake ─────────────────────────────────────────────────────────────── */
  const retake = () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
    setRecognitionResult(null);
    setStep('CAMERA');
  };

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 13px 0; background: ${C.ink}; color: #fff; border: none;
          border-radius: 2px; font-family: Inter,sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: background .18s;
        }
        .submit-btn:hover  { background: ${C.accent}; }
        .submit-btn:disabled { opacity: .6; cursor: not-allowed; }
        .outline-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 20px; background: transparent; border: 1px solid ${C.line};
          border-radius: 2px; font-family: Inter,sans-serif; font-size: 13px;
          color: ${C.text}; cursor: pointer; transition: border-color .15s;
        }
        .outline-btn:hover { border-color: ${C.text}; }
        .cam-btn {
          padding: 12px 24px; border-radius: 2px; font-family: Inter,sans-serif;
          font-size: 13.5px; font-weight: 600; cursor: pointer; border: none;
          display: inline-flex; align-items: center; gap: 8px; transition: background .18s;
        }
        .cam-btn.primary { background: ${C.ink}; color: white; }
        .cam-btn.primary:hover { background: ${C.accent}; }
        .cam-btn.outline { background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; }
        .cam-btn.outline:hover { border-color: white; }
        *:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr !important; }
          .visitor-content { padding: 24px 20px !important; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(250,250,248,0.92)', backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto', padding: '0 32px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={() => navigate('/enter')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: C.mute, fontSize: 13, fontFamily: 'Inter,sans-serif' }}>
            <ArrowLeft size={14} />
            Back
          </button>
          <img src="/logo.png" alt="CampusAccess" style={{ height: 34, objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(47,93,124,0.08)', borderRadius: 3, border: `1px solid rgba(47,93,124,0.18)` }}>
            <Users size={13} style={{ color: C.accent }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent }}>
              Visitor Portal
            </span>
          </div>
        </div>
      </header>

      {/* ── Progress indicator ──────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${C.line}`, background: 'white' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { key: 'CAMERA', label: 'Camera' },
            { key: 'RECOGNIZING', label: 'Identifying' },
            { key: 'RETURNING',   label: 'Confirm Details' },
            { key: 'REGISTER',    label: 'Register' },
            { key: 'CONFIRM',     label: 'Done' },
          ].map((s, i, arr) => {
            const steps: Step[] = ['CAMERA','RECOGNIZING','RETURNING','REGISTER','CONFIRM'];
            const currentIdx = steps.indexOf(step);
            const thisIdx    = steps.indexOf(s.key as Step);
            const isDone     = thisIdx < currentIdx;
            const isActive   = s.key === step;
            if (s.key === 'RECOGNIZING') return null; // internal only
            if (s.key === 'RETURNING' && step === 'REGISTER') return null;
            if (s.key === 'REGISTER' && step === 'RETURNING') return null;
            return (
              <React.Fragment key={s.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: isDone ? C.accent : isActive ? C.ink : C.line,
                    color: isDone || isActive ? 'white' : C.mute,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, flexShrink: 0,
                    transition: 'background 0.2s',
                  }}>
                    {isDone ? <CheckCircle2 size={13} /> : i + 1}
                  </div>
                  <span style={{
                    fontFamily: 'Inter,sans-serif', fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? C.text : isDone ? C.accent : C.mute,
                    whiteSpace: 'nowrap',
                  }}>{s.label}</span>
                </div>
                {i < arr.filter(x => x.key !== 'RECOGNIZING').length - 1 && (
                  <div style={{ flex: 1, height: 1, background: C.line, minWidth: 12 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="visitor-content" style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '40px 32px', flex: 1 }}>
          <AnimatePresence mode="wait">

            {/* ════════ STEP: CAMERA ════════════════════════════════════════ */}
            {step === 'CAMERA' && (
              <motion.div key="camera" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent, margin: '0 0 12px' }}>
                  Step 1 of 3 · Facial Verification
                </p>
                <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 'clamp(22px, 3.5vw, 32px)', color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                  Capture your photo
                </h1>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13.5, color: C.mute, margin: '0 0 24px', lineHeight: 1.65, maxWidth: 620 }}>
                  We use your photo to check if you've visited PICT before. If recognised, your visit profile is auto-filled. First-time visitors will be enrolled for rapid recognition on future visits.
                </p>

                {/* Shared VisitorWebcamModal rendered inline */}
                <div style={{ maxWidth: 680, marginBottom: 24 }}>
                  <VisitorWebcamModal
                    isOpen={true}
                    inline={true}
                    title="Camera Verification Terminal"
                    subtitle="Look straight into the camera, capture your photo, and scan against campus records"
                    onClose={() => navigate('/enter')}
                    onRecognized={handleVisitorRecognized}
                    onRegisterNew={handleVisitorRegisterNew}
                  />
                </div>

                <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(47,93,124,0.06)', border: `1px solid rgba(47,93,124,0.15)`, borderRadius: 6, maxWidth: 680 }}>
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12.5, color: C.mute, margin: 0, lineHeight: 1.6 }}>
                    <strong style={{ color: C.text }}>Why is your photo needed?</strong><br />
                    Your photo is stored securely and used exclusively for gate security clearance. All campus entries require physical guard authorization regardless of match status.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ════════ STEP: RECOGNIZING ═══════════════════════════════════ */}
            {step === 'RECOGNIZING' && (
              <motion.div key="recognizing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 16, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(47,93,124,0.08)', border: `1.5px solid ${C.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScanFace size={32} style={{ color: C.accent, animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
                <h2 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 20, color: C.text, margin: 0 }}>Checking visitor records…</h2>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13.5, color: C.mute, margin: 0 }}>Comparing your photo against previous visits. This usually takes a few seconds.</p>
                {capturedPreview && (
                  <img src={capturedPreview} alt="Captured" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} />
                )}
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
              </motion.div>
            )}

            {/* ════════ STEP: RETURNING VISITOR ═════════════════════════════ */}
            {step === 'RETURNING' && recognitionResult && (
              <motion.div key="returning" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.green, margin: '0 0 12px' }}>
                  ✓ Returning Visitor Recognised
                </p>
                <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 'clamp(22px, 3.5vw, 30px)', color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                  Welcome back!
                </h1>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13.5, color: C.mute, margin: '0 0 28px', lineHeight: 1.65 }}>
                  We found your previous visit record ({((1 - (recognitionResult.confidenceDistance ?? 0.25)) * 100).toFixed(0)}% match confidence). 
                  Your details are pre-filled below. Please confirm or update them and fill in today's visit purpose.
                </p>

                {/* Recognised banner */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, marginBottom: 28,
                }}>
                  {capturedPreview && (
                    <img src={capturedPreview} alt="Your photo" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #4ade80', flexShrink: 0 }} />
                  )}
                  <div>
                    <p style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, color: '#065f46', margin: '0 0 3px' }}>
                      <Sparkles size={13} style={{ display: 'inline', marginRight: 5 }} />
                      {recognitionResult.visitorName || name || 'Visitor'} recognised
                    </p>
                    <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#047857', margin: 0 }}>
                      Previous visits on record. Details auto-filled from last visit.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} className="form-grid">
                    <UInput label="Full Name" value={name} onChange={setName} placeholder="Your full name" icon={<Users size={14} />} required />
                    <UInput label="Mobile Number" value={mobile} onChange={setMobile} type="tel" placeholder="10-digit number" icon={<Phone size={14} />} required />
                  </div>
                  <UInput label="Email (optional)" value={email} onChange={setEmail} type="email" placeholder="you@example.com" icon={<Mail size={14} />} />
                  <UInput label="Host Name / Person being visited" value={hostName} onChange={setHostName} placeholder="e.g. Prof. Sharma" icon={<Shield size={14} />} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} className="form-grid">
                    <USelect label="Host Type" value={hostType} onChange={setHostType} options={HOST_TYPES} required />
                    <USelect label="Department" value={hostDept} onChange={setHostDept} options={DEPARTMENTS} required />
                  </div>
                  <UInput label="Purpose of Today's Visit" value={purpose} onChange={setPurpose} placeholder="e.g. Parent Meeting, Admission Enquiry" icon={<FileText size={14} />} required />
                  <UInput label="Vehicle Number (optional)" value={vehicle} onChange={setVehicle} placeholder="e.g. MH12AB1234" icon={<Car size={14} />} />

                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button type="button" className="outline-btn" onClick={retake} style={{ flex: 1 }}>
                      <RefreshCw size={13} /> Retake Photo
                    </button>
                    <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ flex: 2 }}>
                      {isSubmitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <>Confirm Visit & Submit <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ════════ STEP: REGISTER (new visitor) ════════════════════════ */}
            {step === 'REGISTER' && (
              <motion.div key="register" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent, margin: '0 0 12px' }}>
                  Step 2 of 3
                </p>
                <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 'clamp(22px, 3.5vw, 30px)', color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                  Your visit details
                </h1>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13.5, color: C.mute, margin: '0 0 24px', lineHeight: 1.65 }}>
                  {capturedBlob
                    ? "No previous record found. Please fill in your details below. Your photo has been captured for future recognition."
                    : "Please fill in your visitor details below."}
                </p>

                {/* Photo preview strip */}
                {capturedPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(47,93,124,0.05)', border: `1px solid rgba(47,93,124,0.15)`, borderRadius: 4, marginBottom: 22 }}>
                    <img src={capturedPreview} alt="Captured" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12.5, color: C.text, margin: '0 0 2px' }}>Photo captured ✓</p>
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11.5, color: C.mute, margin: 0 }}>Your photo will be stored for future gate recognition.</p>
                    </div>
                    <button type="button" onClick={retake} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mute, fontSize: 11, textDecoration: 'underline', padding: 0 }}>
                      Retake
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} className="form-grid">
                    <UInput label="Full Name" value={name} onChange={setName} placeholder="Your full name" icon={<Users size={14} />} required />
                    <UInput label="Mobile Number" value={mobile} onChange={setMobile} type="tel" placeholder="10-digit number" icon={<Phone size={14} />} required />
                  </div>
                  <UInput label="Email (optional)" value={email} onChange={setEmail} type="email" placeholder="you@example.com" icon={<Mail size={14} />} />
                  <UInput label="Host Name / Person being visited" value={hostName} onChange={setHostName} placeholder="e.g. Prof. Sharma" icon={<Shield size={14} />} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} className="form-grid">
                    <USelect label="Host Type" value={hostType} onChange={setHostType} options={HOST_TYPES} required />
                    <USelect label="Department" value={hostDept} onChange={setHostDept} options={DEPARTMENTS} required />
                  </div>
                  <UInput label="Purpose of Visit" value={purpose} onChange={setPurpose} placeholder="e.g. Parent Meeting, Admission Enquiry" icon={<FileText size={14} />} required />
                  <UInput label="Vehicle Number (optional)" value={vehicle} onChange={setVehicle} placeholder="e.g. MH12AB1234" icon={<Car size={14} />} />

                  <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ marginTop: 8 }}>
                    {isSubmitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <>Submit Visitor Registration <ArrowRight size={14} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ════════ STEP: CONFIRM ════════════════════════════════════════ */}
            {step === 'CONFIRM' && submittedVisitor && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle2 size={36} style={{ color: '#16a34a' }} />
                  </div>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.green, margin: '0 0 12px' }}>
                    Registration Successful
                  </p>
                  <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 28, color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                    You're registered!
                  </h1>
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, color: C.mute, margin: '0 auto 28px', maxWidth: 480, lineHeight: 1.65 }}>
                    Your visitor pass has been created. Please proceed to the security gate and show this reference number to the guard for entry clearance.
                  </p>

                  {/* Pass card */}
                  <div style={{ background: C.ink, borderRadius: 6, padding: '24px 28px', maxWidth: 400, margin: '0 auto 32px', textAlign: 'left' }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Visitor Token</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: C.accent, margin: '0 0 18px' }}>
                      {submittedVisitor.passNumber || `VT-${submittedVisitor.id}`}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>Name</p>
                        <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>{submittedVisitor.name}</p>
                      </div>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>Mobile</p>
                        <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>{submittedVisitor.mobile}</p>
                      </div>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>Purpose</p>
                        <p style={{ color: '#f0ede8', fontWeight: 500, margin: 0 }}>{submittedVisitor.purpose}</p>
                      </div>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>Time</p>
                        <p style={{ color: '#6ee7b7', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                          {new Date(submittedVisitor.timeIn || submittedVisitor.createdAt || Date.now()).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Important notice */}
                  <div style={{ padding: '14px 18px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 4, maxWidth: 460, margin: '0 auto 28px', textAlign: 'left' }}>
                    <p style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12.5, color: '#92400e', margin: '0 0 5px' }}>
                      ⚠ Guard verification required
                    </p>
                    <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.5 }}>
                      This registration does not automatically grant campus entry. Please proceed to the security gate where a guard will verify your identity and approve your entry.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { retake(); setName(''); setMobile(''); setEmail(''); setHostName(''); setPurpose(''); setVehicle(''); setSubmittedVisitor(null); }}
                      className="outline-btn" type="button">
                      Register Another Visit
                    </button>
                    <button onClick={() => navigate('/')} className="submit-btn" type="button" style={{ width: 'auto', padding: '10px 24px' }}>
                      Return to Home
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '16px 32px' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.line, textAlign: 'center', margin: 0 }}>
          Authorized use only · PICT Gate Security Terminal
        </p>
      </footer>
    </div>
  );
};

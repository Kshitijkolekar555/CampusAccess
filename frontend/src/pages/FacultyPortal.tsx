import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { facultyApi } from '../api/faculty';
import {
  Eye, EyeOff, Lock, Briefcase, Mail, Phone,
  ArrowRight, ArrowLeft, Shield, CheckCircle2, User as UserIcon, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FacultyVerifyResponse } from '../types';
import {
  validatePhone, validateEmail, validatePasswordStrength,
  normalizePhone, normalizeEmail, normalizeName, validateName
} from '../utils/validation';

const C = {
  ink:    '#14171c',
  paper:  '#fafaf8',
  line:   '#e2e0da',
  text:   '#1c1c1a',
  mute:   '#8c887e',
  accent: '#2f5d7c',
};

/* ─── underline input (exact match with StudentPortal.tsx) ───────────────── */
interface UInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

const UInput: React.FC<UInputProps> = ({
  label, type = 'text', value, onChange, onBlur, placeholder,
  icon, trailing, required, disabled, autoComplete,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11,
        fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: C.mute, marginBottom: 8,
      }}>{label}</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${disabled ? C.line : focused ? C.text : C.line}`,
        paddingBottom: 8, transition: 'border-color 0.15s',
        opacity: disabled ? 0.75 : 1,
      }}>
        {icon && <span style={{ color: focused ? C.text : C.mute, flexShrink: 0, display: 'flex', transition: 'color 0.15s' }}>{icon}</span>}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required} disabled={disabled} autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'Inter,sans-serif', fontSize: 14, color: C.text,
            caretColor: C.accent,
          }}
        />
        {trailing}
      </div>
    </div>
  );
};

/* ─── main component ─────────────────────────────────────────────────────── */
type ActionMode = 'LOGIN' | 'SIGNUP';

export const FacultyPortal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<ActionMode>(() =>
    location.pathname.includes('register') ? 'SIGNUP' : 'LOGIN'
  );

  useEffect(() => {
    if (location.pathname.includes('register')) {
      setMode('SIGNUP');
    } else if (location.pathname.includes('login')) {
      setMode('LOGIN');
    }
  }, [location.pathname]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotId, setForgotId] = useState('');

  // Register fields (full upfront form matching StudentPortal)
  const [regEmpNo, setRegEmpNo] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedFaculty, setVerifiedFaculty] = useState<FacultyVerifyResponse | null>(null);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPwd, setRegPwd] = useState('');

  const { setAuth, isAuthenticated, user } = useAuthStore();

  // If already authenticated as faculty/staff, navigate to dashboard
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'FACULTY' || user?.role === 'STAFF')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  /* ── login ────────────────────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u || !password) {
      toast.error('Please enter your Employee ID and password');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login({
        username: u,
        password,
        expectedRole: 'FACULTY',
      });
      const role = data.user?.role;
      if (role !== 'FACULTY' && role !== 'STAFF' && role !== 'ADMIN') {
        toast.error(`This account does not have faculty access (role: ${role}).`);
        return;
      }
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.fullName}!`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /* ── verify employee ID against authorized roster ──────────────────────── */
  const handleVerifyEmpNo = async (): Promise<FacultyVerifyResponse | null> => {
    const id = regEmpNo.trim();
    if (!id) {
      toast.error('Please enter your Employee ID to verify');
      return null;
    }
    setIsVerifying(true);
    try {
      const res = await facultyApi.verifyEmpNo(id);
      if (res && res.eligible) {
        setVerifiedFaculty(res);
        setRegFullName(res.fullName);
        const autoEmail = `${res.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@pict.edu`;
        if (!regEmail) setRegEmail(autoEmail);
        toast.success(`Verified: ${res.fullName} (${res.department} • ${res.staffType || 'Teaching'})`);
        return res;
      } else {
        setVerifiedFaculty(null);
        toast.error(res?.message || 'Employee ID not found in the authorized PICT faculty roster.');
        return null;
      }
    } catch (err: any) {
      setVerifiedFaculty(null);
      toast.error(err.response?.data?.message || 'Employee ID verification failed. Please check the ID.');
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  /* ── register ─────────────────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    let vf = verifiedFaculty;
    if (!vf) {
      vf = await handleVerifyEmpNo();
      if (!vf) return;
    }

    const cleanName = regFullName.trim() || vf.fullName;
    const cleanEmail = regEmail ? normalizeEmail(regEmail) : `${vf.empNo}@pict.edu`;
    const cleanPhone = regPhone ? normalizePhone(regPhone) : '';

    if (!cleanEmail) {
      toast.error('College email is required');
      return;
    }
    const ee = validateEmail(cleanEmail);
    if (ee) {
      toast.error(ee);
      return;
    }
    if (cleanPhone) {
      const pe = validatePhone(cleanPhone);
      if (pe) {
        toast.error(pe);
        return;
      }
    }
    const passErr = validatePasswordStrength(regPwd);
    if (passErr) {
      toast.error(passErr);
      return;
    }

    setLoading(true);
    try {
      const data = await facultyApi.register({
        empNo: vf.empNo,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        password: regPwd,
      });

      toast.success(`Faculty account registered for ${data.user?.fullName || cleanName}!`);
      if (data.accessToken && data.user) {
        setAuth(data.user, data.accessToken, data.refreshToken);
      } else {
        const loginData = await authApi.login({
          username: vf.empNo,
          password: regPwd,
          expectedRole: 'FACULTY',
        });
        setAuth(loginData.user, loginData.accessToken, loginData.refreshToken);
      }
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData?.errors && typeof respData.errors === 'object') {
        const details = Object.entries(respData.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        toast.error(`Registration error: ${details}`);
      } else {
        toast.error(respData?.message || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── forgot password ──────────────────────────────────────────────────── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotId.trim()) {
      toast.error('Enter your Employee ID or email');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword({ usernameOrEmail: forgotId.trim() });
      toast.success('Password reset instructions sent — check your college email.');
      setIsForgot(false);
      setForgotId('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password reset request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'Inter,sans-serif',
      }}
      className="login-split"
    >
      <style>{`
        @media (max-width: 880px) {
          .login-left  { display: none !important; }
          .login-right { width: 100% !important; padding: 32px 20px !important; }
        }
        @media (max-width: 520px) {
          .reg-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .login-right { padding: 24px 16px !important; }
        }
        .submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 13px 0; background: ${C.ink}; color: #fff; border: none;
          border-radius: 2px; font-family: Inter,sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: background .18s;
        }
        .submit-btn:hover { background: ${C.accent}; }
        .submit-btn:disabled { opacity: .6; cursor: not-allowed; }
        .submit-btn .arrow { transition: transform .18s; }
        .submit-btn:hover .arrow { transform: translateX(3px); }
        .outline-btn {
          display: flex; align-items: center; justify-content: center;
          padding: 12px 0; background: transparent; border: 1px solid ${C.line};
          border-radius: 2px; font-family: Inter,sans-serif; font-size: 13px;
          color: ${C.text}; cursor: pointer; transition: border-color .15s; width: 100%;
        }
        .outline-btn:hover { border-color: ${C.text}; }
        *:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
      `}</style>

      {/* ── LEFT PANEL (exact match with StudentPortal.tsx) ──────────────────── */}
      <div
        className="login-left"
        style={{
          width: '55%',
          minWidth: 440,
          background: `linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.88) 100%), url('/pict_gate.jpg') center/cover no-repeat`,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 64px',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 2 }}>
          <img src="/logo.png" alt="CampusAccess" style={{ height: 38, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <button
            type="button"
            onClick={() => navigate('/enter')}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 4,
              padding: '5px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#f1f5f9',
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 2, margin: '40px 0' }}>
          <div style={{ width: 40, height: 2.5, background: '#38bdf8', marginBottom: 24 }} />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(47,93,124,0.35)',
              border: '1px solid rgba(47,93,124,0.5)',
              borderRadius: 3,
              padding: '4px 12px',
              marginBottom: 20,
            }}
          >
            <Briefcase size={14} style={{ color: '#7dd3fc' }} />
            <span
              style={{
                fontFamily: 'JetBrains Mono,monospace',
                fontSize: 10.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#7dd3fc',
              }}
            >
              Faculty Portal
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'Inter,sans-serif',
              fontWeight: 700,
              fontSize: 34,
              lineHeight: 1.22,
              color: '#f8fafc',
              margin: '0 0 18px 0',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            }}
          >
            Faculty out-passes,<br />campus clearance<br />and visitor access.
          </h2>
          <p
            style={{
              fontFamily: 'Inter,sans-serif',
              fontSize: 14,
              lineHeight: 1.68,
              color: '#cbd5e1',
              margin: 0,
              maxWidth: 440,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            Log in with your Employee ID to access faculty out-passes, visitor approvals, and the Teacher Panel.
            Faculty registration verifies against the authorized PICT faculty database.
          </p>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            fontFamily: 'JetBrains Mono,monospace',
            fontSize: 10.5,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            lineHeight: 1.8,
          }}
        >
          Pune Institute of Computer Technology<br />Gate Security Terminal
        </div>
      </div>

      {/* ── RIGHT PANEL (exact match with StudentPortal.tsx) ─────────────────── */}
      <div
        className="login-right"
        style={{
          flex: 1,
          background: C.paper,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 48px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', maxWidth: 460 }}
        >
          {/* Back Button to Portal Selection */}
          <div style={{ marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => navigate('/enter')}
              aria-label="Back to portal selection"
              style={{
                background: '#ffffff',
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 500,
                color: C.text,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.18s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                fontFamily: 'Inter,sans-serif',
                minHeight: 42,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.color = C.accent;
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.line;
                e.currentTarget.style.color = C.text;
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Portal Selection</span>
            </button>
          </div>

          {/* Eyebrow */}
          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono,monospace',
                fontSize: 10.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.mute,
              }}
            >
              Faculty Portal
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'Inter,sans-serif',
              fontWeight: 600,
              fontSize: 26,
              color: C.text,
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {isForgot ? 'Reset password' : mode === 'LOGIN' ? 'Faculty sign in' : 'Create faculty account'}
          </h1>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.mute, margin: '0 0 28px' }}>
            {isForgot
              ? 'Enter your Employee ID or email to reset credentials.'
              : mode === 'LOGIN'
              ? 'Enter your Employee ID (e.g. 510 or 376) and password to sign in.'
              : 'Fill in your faculty details to register.'}
          </p>

          {/* ── FORGOT PASSWORD ─────────────────────────────────────────────── */}
          {isForgot && (
            <form onSubmit={handleForgot}>
              <UInput
                label="Employee ID or email"
                value={forgotId}
                onChange={setForgotId}
                placeholder="510 or rachna.karnavat@pict.edu"
                icon={<Mail size={15} />}
                required
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ flex: 1 }}
                  onClick={() => setIsForgot(false)}
                >
                  Back
                </button>
                <button type="submit" className="submit-btn" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}

          {/* ── LOGIN FORM ──────────────────────────────────────────────────── */}
          {!isForgot && mode === 'LOGIN' && (
            <form onSubmit={handleLogin}>
              <UInput
                label="Employee ID / Faculty ID"
                value={username}
                onChange={setUsername}
                placeholder="e.g. 510 or 376"
                icon={<Briefcase size={15} />}
                required
                autoComplete="username"
              />
              <UInput
                label="Password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                icon={<Lock size={15} />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mute, display: 'flex', padding: 0 }}
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                required
                autoComplete="current-password"
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => setIsForgot(true)}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: C.mute, cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in as Faculty'}
                {!loading && <ArrowRight size={14} className="arrow" />}
              </button>

              <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: C.mute }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('SIGNUP'); setIsForgot(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.accent,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                  }}
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM (exact match with StudentPortal.tsx layout) ───── */}
          {!isForgot && mode === 'SIGNUP' && (
            <form onSubmit={handleRegister}>
              <UInput
                label="Full Name"
                value={regFullName}
                onChange={setRegFullName}
                placeholder="e.g. Rachna Karnavat"
                icon={<UserIcon size={15} />}
                required
              />
              <UInput
                label="Employee ID / Faculty Username"
                value={regEmpNo}
                onChange={(val) => {
                  setRegEmpNo(val);
                  if (verifiedFaculty && val !== verifiedFaculty.empNo) {
                    setVerifiedFaculty(null);
                  }
                }}
                onBlur={() => {
                  if (regEmpNo.trim().length >= 2 && !verifiedFaculty) {
                    handleVerifyEmpNo();
                  }
                }}
                placeholder="e.g. 510 or 376"
                icon={<Briefcase size={15} />}
                required
                trailing={
                  <button
                    type="button"
                    onClick={handleVerifyEmpNo}
                    disabled={isVerifying || !regEmpNo.trim()}
                    style={{
                      background: verifiedFaculty ? '#059669' : C.ink,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 3,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {isVerifying ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : verifiedFaculty ? (
                      <>
                        <CheckCircle2 size={12} /> Verified
                      </>
                    ) : (
                      'Verify ID'
                    )}
                  </button>
                }
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="reg-grid">
                <UInput
                  label="Email"
                  value={regEmail}
                  onChange={setRegEmail}
                  placeholder="you@pict.edu"
                  icon={<Mail size={15} />}
                />
                <UInput
                  label="Mobile"
                  value={regPhone}
                  onChange={setRegPhone}
                  placeholder="9876543210"
                  icon={<Phone size={15} />}
                />
              </div>
              <UInput
                label="Password"
                type="password"
                value={regPwd}
                onChange={setRegPwd}
                placeholder="••••••••"
                icon={<Lock size={15} />}
                required
              />

              {verifiedFaculty && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(4,120,87,0.08)',
                    border: '1px solid rgba(4,120,87,0.25)',
                    borderRadius: 3,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: '#047857', flexShrink: 0 }} />
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11.5, color: '#065f46', margin: 0 }}>
                    <strong>{verifiedFaculty.fullName}</strong> — {verifiedFaculty.department} • {verifiedFaculty.staffType || 'Teaching Staff'} verified in PICT roster.
                  </p>
                </div>
              )}

              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(47,93,124,0.07)',
                  border: `1px solid rgba(47,93,124,0.18)`,
                  borderRadius: 3,
                  marginBottom: 20,
                }}
              >
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11.5, color: C.mute, margin: 0, lineHeight: 1.5 }}>
                  📷 No camera required. Faculty registration is verified against the official college dataset.
                </p>
              </div>

              <button type="submit" className="submit-btn" disabled={loading || isVerifying}>
                {loading ? 'Creating account…' : 'Create Faculty Account'}
                {!loading && <ArrowRight size={14} className="arrow" />}
              </button>

              <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: C.mute }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('LOGIN'); setIsForgot(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.accent,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                  }}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p
            style={{
              fontFamily: 'JetBrains Mono,monospace',
              fontSize: 10,
              color: C.mute,
              letterSpacing: '0.06em',
              textAlign: 'center',
              marginTop: 32,
              textTransform: 'uppercase',
            }}
          >
            Authorized Faculty Only · PICT Security Terminal
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default FacultyPortal;

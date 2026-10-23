import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { studentApi } from '../api/student';
import {
  Eye, EyeOff, Lock, GraduationCap, Mail, Phone,
  ArrowRight, ArrowLeft, Shield, CheckCircle2, Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { StudentVerifyResponse } from '../types';
import {
  validatePhone, validateEmail, validatePasswordStrength,
  validateName, normalizePhone, normalizeEmail, normalizeName,
} from '../utils/validation';

const C = {
  ink:    '#14171c',
  paper:  '#fafaf8',
  line:   '#e2e0da',
  text:   '#1c1c1a',
  mute:   '#8c887e',
  accent: '#2f5d7c',
};

/* ─── underline input ────────────────────────────────────────────────────── */
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

export const StudentPortal: React.FC = () => {
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

  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [isForgot, setIsForgot]   = useState(false);
  const [forgotId, setForgotId]   = useState('');

  // register fields
  const [regName, setRegName]     = useState('');
  const [regUser, setRegUser]     = useState('');
  const [regEmail, setRegEmail]   = useState('');
  const [regPhone, setRegPhone]   = useState('');
  const [regPwd, setRegPwd]       = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<StudentVerifyResponse | null>(null);

  const { setAuth, isAuthenticated, user } = useAuthStore();

  // If already authenticated as student, go to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'STUDENT') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  /* ── login ────────────────────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u || !password) {
      toast.error('Please enter your PRN / Student ID and password');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login({ username: u, password, expectedRole: 'STUDENT' });
      const role = data.user?.role;
      if (role !== 'STUDENT') {
        toast.error(`This account is not a student account (role: ${role}). Use the appropriate portal.`);
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

  /* ── verify student ID against authorized dataset ──────────────────────── */
  const handleVerifyStudentId = async (): Promise<StudentVerifyResponse | null> => {
    const id = regUser.trim();
    if (!id) {
      toast.error('Please enter your Student ID or PRN to verify');
      return null;
    }
    setIsVerifying(true);
    try {
      const res = await studentApi.verifyStudentId(id);
      if (res && res.eligible) {
        setVerifiedStudent(res);
        setRegName(res.fullName);
        if (res.email && !regEmail) {
          setRegEmail(res.email);
        } else if (!regEmail) {
          setRegEmail(`${res.studentId.toLowerCase()}@pict.edu`);
        }
        if (res.mobile && !regPhone) {
          setRegPhone(res.mobile);
        }
        toast.success(`Verified: ${res.fullName} (${res.department} • ${res.className || res.academicYear || 'TE'})`);
        return res;
      } else {
        setVerifiedStudent(null);
        toast.error(res?.message || 'Student ID not found in the authorized student dataset.');
        return null;
      }
    } catch (err: any) {
      setVerifiedStudent(null);
      toast.error(err.response?.data?.message || 'Student ID verification failed. Please check your ID.');
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  /* ── register ─────────────────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    let vs = verifiedStudent;
    if (!vs) {
      vs = await handleVerifyStudentId();
      if (!vs) return;
    }

    const cleanName  = normalizeName(regName || vs.fullName);
    const cleanUser  = vs.studentId || regUser.trim().toUpperCase();
    const cleanEmail = regEmail ? normalizeEmail(regEmail) : (vs.email || `${cleanUser.toLowerCase()}@pict.edu`);
    const cleanPhone = regPhone ? normalizePhone(regPhone) : (vs.mobile || '');

    const nameErr = validateName(cleanName, 'Full Name');
    if (nameErr) { toast.error(nameErr); return; }
    if (!cleanUser) { toast.error('Student ID / PRN is required'); return; }
    const passErr = validatePasswordStrength(regPwd);
    if (passErr) { toast.error(passErr); return; }
    if (cleanPhone) { const pe = validatePhone(cleanPhone); if (pe) { toast.error(pe); return; } }
    if (cleanEmail) { const ee = validateEmail(cleanEmail); if (ee) { toast.error(ee); return; } }

    setLoading(true);
    try {
      const authData = await studentApi.register({
        studentId: vs.studentId,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        password: regPwd,
      });

      toast.success(`Student account created for ${authData.user?.fullName || cleanName}!`);
      if (authData.accessToken && authData.user) {
        setAuth(authData.user, authData.accessToken, authData.refreshToken);
      } else {
        const loginData = await authApi.login({
          username: vs.studentId,
          password: regPwd,
          expectedRole: 'STUDENT',
        });
        setAuth(loginData.user, loginData.accessToken, loginData.refreshToken);
      }
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        const details = Object.entries(data.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        toast.error(`Validation failed: ${details}`);
      } else {
        toast.error(data?.message || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── forgot password ──────────────────────────────────────────────────── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotId.trim()) { toast.error('Enter your PRN or email'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword({ usernameOrEmail: forgotId.trim() });
      toast.success('Reset instructions sent — check your email.');
      setIsForgot(false); setForgotId('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password reset request failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', fontFamily: 'Inter,sans-serif' }}
         className="login-split">
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

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div className="login-left" style={{
        width: '55%', minWidth: 440,
        background: `linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.88) 100%), url('/pict_gate.jpg') center/cover no-repeat`,
        color: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '64px 64px', flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 2 }}>
          <img src="/logo.png" alt="CampusAccess" style={{ height: 38, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <button
            type="button" onClick={() => navigate('/enter')}
            style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)', borderRadius: 4,
              padding: '5px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#f1f5f9', fontSize: 12.5, fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 2, margin: '40px 0' }}>
          <div style={{ width: 40, height: 2.5, background: '#38bdf8', marginBottom: 24 }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(47,93,124,0.35)', border: '1px solid rgba(47,93,124,0.5)',
            borderRadius: 3, padding: '4px 12px', marginBottom: 20,
          }}>
            <Shield size={12} color="#38bdf8" />
            <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e0f2fe', fontWeight: 600 }}>
              Student Identity Portal
            </span>
          </div>
          <h2 style={{
            fontFamily: 'Inter,sans-serif', fontSize: 34, fontWeight: 700,
            lineHeight: 1.25, margin: '0 0 16px', color: '#fff', letterSpacing: '-0.02em',
          }}>
            Automated campus access &amp; student movement.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, maxWidth: 440, margin: 0 }}>
            PICT Gate Security System manages gate passes, hostel outpasses, and authorized entry logs.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gate Pass</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginTop: 2 }}>Digital QR &amp; Approval</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outpass</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginTop: 2 }}>Hostel &amp; College Hours</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="login-right" style={{
        flex: 1, background: C.paper, display: 'flex',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '48px 40px', overflowY: 'auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          {/* role badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: C.accent, display: 'inline-block',
            }} />
            <span style={{
              fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: C.accent,
            }}>
              Student Access
            </span>
          </div>

          {/* title */}
          <h1 style={{
            fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 26,
            color: C.text, margin: '0 0 6px', letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>
            {isForgot ? 'Reset password' : mode === 'LOGIN' ? 'Student sign in' : 'Create student account'}
          </h1>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: C.mute, margin: '0 0 28px' }}>
            {isForgot
              ? 'Enter your PRN or email to reset credentials.'
              : mode === 'LOGIN'
              ? 'Enter your PRN or Enrollment No and password to access your student portal.'
              : 'Verify your student ID against the institutional dataset and create your account.'}
          </p>

          {/* ── FORGOT PASSWORD ─────────────────────────────────────────────── */}
          {isForgot && (
            <form onSubmit={handleForgot}>
              <UInput label="PRN or email" value={forgotId} onChange={setForgotId}
                placeholder="F24IT32 or you@pict.edu" icon={<Mail size={15} />} required />
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="outline-btn" style={{ flex: 1 }}
                  onClick={() => setIsForgot(false)}>Back</button>
                <button type="submit" className="submit-btn" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}

          {/* ── LOGIN FORM ──────────────────────────────────────────────────── */}
          {!isForgot && mode === 'LOGIN' && (
            <form onSubmit={handleLogin}>
              <UInput label="PRN / Student Username" value={username} onChange={setUsername}
                placeholder="e.g. S25ET043 or student1" icon={<GraduationCap size={15} />}
                required autoComplete="username" />
              <UInput label="Password" type={showPwd ? 'text' : 'password'}
                value={password} onChange={setPassword} placeholder="••••••••"
                icon={<Lock size={15} />}
                trailing={
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mute, display: 'flex', padding: 0 }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                required autoComplete="current-password" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 24 }}>
                <button type="button" onClick={() => setIsForgot(true)}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: C.mute, cursor: 'pointer', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in as Student'}
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

          {/* ── REGISTER FORM ───────────────────────────────────────────────── */}
          {!isForgot && mode === 'SIGNUP' && (
            <form onSubmit={handleRegister}>
              <UInput
                label="Student ID / Enrollment / PRN"
                value={regUser}
                onChange={(val) => {
                  setRegUser(val);
                  if (verifiedStudent && val.trim().toUpperCase() !== verifiedStudent.studentId.toUpperCase()) {
                    setVerifiedStudent(null);
                  }
                }}
                onBlur={() => {
                  if (regUser.trim().length >= 3 && !verifiedStudent) {
                    handleVerifyStudentId();
                  }
                }}
                placeholder="e.g. S25ET043 or F24ET046"
                icon={<Shield size={15} />}
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => handleVerifyStudentId()}
                    disabled={isVerifying || !regUser.trim()}
                    style={{
                      background: verifiedStudent ? '#059669' : C.ink,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 2,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      cursor: isVerifying || !regUser.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      opacity: !regUser.trim() ? 0.6 : 1,
                    }}
                  >
                    {isVerifying ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : verifiedStudent ? (
                      <CheckCircle2 size={12} />
                    ) : null}
                    {verifiedStudent ? 'Verified' : isVerifying ? 'Checking' : 'Verify'}
                  </button>
                }
              />

              {verifiedStudent && (
                <div style={{
                  padding: '8px 12px', background: 'rgba(5,150,105,0.08)',
                  border: '1px solid rgba(5,150,105,0.25)', borderRadius: 3, marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#047857'
                }}>
                  <CheckCircle2 size={14} />
                  <span>Authorized Student Record Verified: <strong>{verifiedStudent.fullName}</strong> ({verifiedStudent.department} • {verifiedStudent.className || verifiedStudent.academicYear || 'TE'})</span>
                </div>
              )}

              <UInput
                label="Full Name"
                value={regName}
                onChange={setRegName}
                placeholder="e.g. Laxman Basaveshwar Gaidhankar"
                icon={<GraduationCap size={15} />}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="reg-grid">
                <UInput label="College Email" value={regEmail} onChange={setRegEmail}
                  placeholder="you@pict.edu" icon={<Mail size={15} />} />
                <UInput label="Mobile" value={regPhone} onChange={setRegPhone}
                  placeholder="9876543210" icon={<Phone size={15} />} />
              </div>
              <UInput label="Password" type="password" value={regPwd} onChange={setRegPwd}
                placeholder="••••••••" icon={<Lock size={15} />} required />
              <div style={{
                padding: '10px 12px', background: 'rgba(47,93,124,0.07)',
                border: `1px solid rgba(47,93,124,0.18)`, borderRadius: 3, marginBottom: 20,
              }}>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11.5, color: C.mute, margin: 0, lineHeight: 1.5 }}>
                  📷 No camera required. Student registration is credential-only.
                </p>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Student Account'}
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

          {/* footer */}
          <p style={{
            fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.mute,
            letterSpacing: '0.06em', textAlign: 'center', marginTop: 32, textTransform: 'uppercase',
          }}>
            Authorized students only · PICT Security Terminal
          </p>
        </motion.div>
      </div>
    </div>
  );
};

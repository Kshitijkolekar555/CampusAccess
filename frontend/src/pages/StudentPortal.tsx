import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import {
  Eye, EyeOff, Lock, GraduationCap, Mail, Phone,
  ArrowRight, ArrowLeft, Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
  placeholder?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  required?: boolean;
  autoComplete?: string;
}
const UInput: React.FC<UInputProps> = ({
  label, type = 'text', value, onChange, placeholder,
  icon, trailing, required, autoComplete,
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
        borderBottom: `1px solid ${focused ? C.text : C.line}`,
        paddingBottom: 8, transition: 'border-color 0.15s',
      }}>
        {icon && <span style={{ color: focused ? C.text : C.mute, flexShrink: 0, display: 'flex', transition: 'color 0.15s' }}>{icon}</span>}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
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
  const [mode, setMode] = useState<ActionMode>('LOGIN');
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

  const { setAuth, isAuthenticated, user } = useAuthStore();
  const navigate    = useNavigate();

  // If already authenticated as student, go to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'STUDENT') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  /* ── login ────────────────────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const data = await authApi.login({ username: username.trim(), password, expectedRole: 'STUDENT' });
      const role = data.user?.role;
      if (role !== 'STUDENT') {
        toast.error(`This account is not a student account (role: ${role}). Use Guard Portal if you are security staff.`);
        return;
      }
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.fullName}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  /* ── register ─────────────────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName  = normalizeName(regName);
    const cleanUser  = regUser.trim();
    const cleanEmail = regEmail ? normalizeEmail(regEmail) : '';
    const cleanPhone = regPhone ? normalizePhone(regPhone) : '';

    const nameErr = validateName(cleanName, 'Full Name');
    if (nameErr) { toast.error(nameErr); return; }
    if (!cleanUser) { toast.error('PRN / Username is required'); return; }
    const passErr = validatePasswordStrength(regPwd);
    if (passErr) { toast.error(passErr); return; }
    if (cleanPhone) { const pe = validatePhone(cleanPhone); if (pe) { toast.error(pe); return; } }
    if (cleanEmail) { const ee = validateEmail(cleanEmail); if (ee) { toast.error(ee); return; } }

    setLoading(true);
    try {
      const newUser = await authApi.register({
        fullName: cleanName, username: cleanUser,
        email: cleanEmail || `${cleanUser.toLowerCase()}@pict.edu`,
        phone: cleanPhone || undefined,
        password: regPwd, role: 'STUDENT',
      });
      toast.success(`Student account created for ${newUser?.fullName || regName}!`);
      const data = await authApi.login({ username: regUser, password: regPwd, expectedRole: 'STUDENT' });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally { setLoading(false); }
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
            <GraduationCap size={14} style={{ color: '#7dd3fc' }} />
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7dd3fc' }}>Student Portal</span>
          </div>
          <h2 style={{
            fontFamily: 'Inter,sans-serif', fontWeight: 700,
            fontSize: 34, lineHeight: 1.22, color: '#f8fafc',
            margin: '0 0 18px 0', letterSpacing: '-0.02em',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}>
            Student gate passes,<br/>hostel outpasses<br/>and more.
          </h2>
          <p style={{
            fontFamily: 'Inter,sans-serif', fontSize: 14, lineHeight: 1.68,
            color: '#cbd5e1', margin: 0, maxWidth: 440,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}>
            Log in with your PRN to access gate passes, hostel outpasses, and campus notifications.
            Student registration does not require a camera.
          </p>
        </div>

        <div style={{
          position: 'relative', zIndex: 2,
          fontFamily: 'JetBrains Mono,monospace', fontSize: 10.5,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', lineHeight: 1.8,
        }}>
          Pune Institute of Computer Technology<br/>Gate Security Terminal
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="login-right" style={{
        flex: 1, background: C.paper,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 48px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', maxWidth: 460 }}
        >
          {/* eyebrow + switch link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{
              fontFamily: 'JetBrains Mono,monospace', fontSize: 10.5,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mute,
            }}>
              Student Portal
            </span>
            {!isForgot && (
              <button type="button"
                onClick={() => { setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setIsForgot(false); }}
                style={{
                  fontFamily: 'Inter,sans-serif', fontSize: 12, color: C.accent,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}>
                {mode === 'LOGIN' ? 'Create an account' : 'Sign in instead'}
              </button>
            )}
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
              ? 'Enter your PRN or username and password.'
              : 'Fill in your student details to register.'}
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
                placeholder="e.g. F24IT32" icon={<GraduationCap size={15} />}
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
            </form>
          )}

          {/* ── REGISTER FORM ───────────────────────────────────────────────── */}
          {!isForgot && mode === 'SIGNUP' && (
            <form onSubmit={handleRegister}>
              <UInput label="Full Name" value={regName} onChange={setRegName}
                placeholder="e.g. Siddharth Roy" icon={<GraduationCap size={15} />} required />
              <UInput label="PRN / Student Username" value={regUser} onChange={setRegUser}
                placeholder="e.g. F24IT32" icon={<Shield size={15} />} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="reg-grid">
                <UInput label="Email" value={regEmail} onChange={setRegEmail}
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import {
  Eye, EyeOff, Lock, User as UserIcon, GraduationCap,
  Mail, Phone, Shield, ArrowRight, ArrowLeft,
  Building2, Users, ShieldCheck, ChevronDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  validatePhone, validateEmail, validatePasswordStrength,
  validateName, validatePrn, normalizePhone, normalizeEmail, normalizeName,
} from '../utils/validation';
import { UserRole } from '../types';

/* ─── types ─────────────────────────────────────────────────────────────── */
type ActionMode = 'LOGIN' | 'SIGNUP';

/* ─── colour tokens (CSS custom properties used inline) ─────────────────── */
const C = {
  ink:    '#14171c',
  paper:  '#fafaf8',
  line:   '#e2e0da',
  text:   '#1c1c1a',
  mute:   '#8c887e',
  accent: '#2f5d7c',
};

/* ─── role meta ──────────────────────────────────────────────────────────── */
const ROLE_TITLE: Partial<Record<UserRole, string>> = {
  SECURITY_GUARD: 'Guard',
  GUARD: 'Guard',
  FACULTY: 'Faculty',
  STAFF: 'Staff',
  ADMIN: 'Admin',
  SECURITY_OFFICER: 'Security Officer',
  STUDENT: 'Student',
  HOSTEL_WARDEN: 'Warden',
  CANTEEN_MANAGER: 'Canteen',
  VISITOR: 'Visitor',
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
const UInput: React.FC<UInputProps> = ({ label, type='text', value, onChange, placeholder, icon, trailing, required, autoComplete }) => {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? C.text : C.line;
  const iconColor   = focused ? C.text : C.mute;
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display:'block', fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color: C.mute, marginBottom:8 }}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${borderColor}`, paddingBottom:8, transition:'border-color 0.15s' }}>
        {icon && <span style={{ color: iconColor, flexShrink:0, display:'flex', transition:'color 0.15s' }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            fontFamily:'Inter,sans-serif', fontSize:14, color: C.text,
            caretColor: C.accent,
          }}
        />
        {trailing}
      </div>
    </div>
  );
};

/* ─── boom barrier SVG ───────────────────────────────────────────────────── */
const BoomBarrierSVG = () => (
  <svg viewBox="0 0 220 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', maxWidth:200, opacity:0.55 }}>
    {/* post */}
    <rect x="18" y="30" width="14" height="78" rx="2" stroke={C.accent} strokeWidth="1.5"/>
    {/* base */}
    <rect x="8" y="104" width="34" height="6" rx="2" stroke={C.accent} strokeWidth="1.5"/>
    {/* pivot box */}
    <rect x="16" y="26" width="18" height="12" rx="3" stroke={C.accent} strokeWidth="1.5"/>
    {/* arm */}
    <line x1="25" y1="32" x2="200" y2="32" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"/>
    {/* stripes on arm */}
    {[50,80,110,140,170].map(x => (
      <line key={x} x1={x} y1="27" x2={x-7} y2="37" stroke={C.accent} strokeWidth="1.5" strokeOpacity="0.45"/>
    ))}
    {/* counterweight */}
    <rect x="8" y="34" width="10" height="22" rx="2" stroke={C.accent} strokeWidth="1.5"/>
    {/* road lines */}
    <line x1="60" y1="108" x2="85" y2="108"  stroke="#3a3a38" strokeWidth="1.5"/>
    <line x1="95" y1="108" x2="120" y2="108" stroke="#3a3a38" strokeWidth="1.5"/>
    <line x1="130" y1="108" x2="155" y2="108" stroke="#3a3a38" strokeWidth="1.5"/>
  </svg>
);

/* ─── main component ─────────────────────────────────────────────────────── */
export const Login: React.FC = () => {
  const [actionMode, setActionMode]       = useState<ActionMode>('LOGIN');
  const [selectedRole, setSelectedRole]   = useState<UserRole>('SECURITY_GUARD');
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  // registration
  const [regFullName, setRegFullName]     = useState('');
  const [regUsername, setRegUsername]     = useState('');
  const [regEmail, setRegEmail]           = useState('');
  const [regPhone, setRegPhone]           = useState('');
  const [regPassword, setRegPassword]     = useState('');

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  /* handlers ------------------------------------------------------------- */
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u || !password) { toast.error('Please fill in all credentials'); return; }
    setLoading(true);
    try {
      const data = await authApi.login({ username: u, password, expectedRole: selectedRole });
      const userRole = data.user.role;
      const isGuardMatch = (userRole.includes('GUARD') || userRole === 'SECURITY_OFFICER' || userRole === 'ADMIN');
      const isDirectMatch = userRole === selectedRole;

      if (!isDirectMatch && !isGuardMatch) {
        toast.error(`Role mismatch: account is registered as [${userRole}], not [${selectedRole}].`);
        return;
      }
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.fullName}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName  = normalizeName(regFullName);
    const cleanUser  = regUsername.trim();
    const cleanEmail = regEmail ? normalizeEmail(regEmail) : '';
    const cleanPhone = regPhone ? normalizePhone(regPhone) : '';
    const nameErr = validateName(cleanName, 'Full Name');
    if (nameErr) { toast.error(nameErr); return; }
    if (!cleanUser) { toast.error('Username is required'); return; }
    const passErr = validatePasswordStrength(regPassword);
    if (passErr) { toast.error(passErr); return; }
    if (cleanPhone) {
      const pe = validatePhone(cleanPhone); if (pe) { toast.error(pe); return; }
    }
    if (cleanEmail) {
      const ee = validateEmail(cleanEmail); if (ee) { toast.error(ee); return; }
    }
    setLoading(true);
    try {
      const targetRole = selectedRole === 'SECURITY_GUARD' ? 'GUARD' : selectedRole;
      const newUser = await authApi.register({
        fullName: cleanName, username: cleanUser,
        email: cleanEmail || `${cleanUser.toLowerCase()}@pict.edu`,
        phone: cleanPhone || undefined, password: regPassword, role: targetRole,
      });
      toast.success(`Account created for ${newUser?.fullName || regFullName}!`);
      const data = await authApi.login({ username: regUsername, password: regPassword, expectedRole: selectedRole });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) { toast.error('Please enter your username or email'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword({ usernameOrEmail: forgotIdentifier.trim() });
      toast.success('Reset instructions sent — check your email.');
      setIsForgotPassword(false); setForgotIdentifier('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password reset request failed');
    } finally { setLoading(false); }
  };

  /* fill-form helper (does NOT auto-submit) */
  const fillDemo = (u: string, p: string, role: UserRole) => {
    setSelectedRole(role); setUsername(u); setPassword(p);
  };

  /* quick 1-click demo (fills + submits) */
  const quickDemo = async (u: string, p: string, role: UserRole) => {
    setSelectedRole(role); setUsername(u); setPassword(p);
    setLoading(true);
    try {
      const data = await authApi.login({ username: u, password: p, expectedRole: role });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Signed in as ${data.user.fullName}`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally { setLoading(false); }
  };

  /* ─── derived ─────────────────────────────────────────────────────────── */
  const roleLabel = ROLE_TITLE[selectedRole] || selectedRole;
  const formTitle = isForgotPassword ? 'Reset password'
    : actionMode === 'LOGIN' ? 'Sign in to your account'
    : 'Create an account';

  /* ─── render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'row', fontFamily:'Inter,sans-serif' }}
         className="login-split">
      <style>{`
        @media (max-width: 880px) {
          .login-split { flex-direction: column !important; }
          .login-left  {
            width: 100% !important;
            min-width: 0 !important;
            padding: 16px 20px !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            background: #0f172a !important;
          }
          .login-left-body { display: none !important; }
          .login-right { width: 100% !important; padding: 32px 20px !important; }
        }
        @media (max-width: 520px) {
          .reg-grid { grid-template-columns: 1fr !important; gap: 0px !important; }
          .login-right { padding: 24px 16px !important; }
        }
        .role-tab { background:none; border:none; cursor:pointer; padding:0 0 10px 0;
          font-family:Inter,sans-serif; font-size:13px; color:${C.mute};
          border-bottom:2px solid transparent; transition:color .15s,border-color .15s; white-space:nowrap; }
        .role-tab:hover { color:${C.text}; }
        .role-tab.active { color:${C.text}; font-weight:600; border-bottom-color:${C.accent}; }
        .submit-btn { display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:13px 0; background:${C.ink}; color:#fff; border:none;
          border-radius:2px; font-family:Inter,sans-serif; font-size:13px; font-weight:500;
          cursor:pointer; transition:background .18s; }
        .submit-btn:hover { background:${C.accent}; }
        .submit-btn:disabled { opacity:.6; cursor:not-allowed; }
        .submit-btn .arrow { transition:transform .18s; }
        .submit-btn:hover .arrow { transform:translateX(3px); }
        .outline-btn { display:flex; align-items:center; justify-content:center;
          padding:12px 0; background:transparent; border:1px solid ${C.line};
          border-radius:2px; font-family:Inter,sans-serif; font-size:13px;
          color:${C.text}; cursor:pointer; transition:border-color .15s; width:100%; }
        .outline-btn:hover { border-color:${C.text}; }
        .demo-use { background:none; border:none; color:${C.accent}; font-family:'JetBrains Mono',monospace;
          font-size:11px; cursor:pointer; padding:0; }
        .demo-use:hover { text-decoration:underline; }
        details > summary { list-style:none; }
        details > summary::-webkit-details-marker { display:none; }
        *:focus-visible { outline:2px solid ${C.accent}; outline-offset:2px; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
        }
      `}</style>

      {/* ── LEFT PANEL ────────────────────────────────────────────────────── */}
      <div className="login-left" style={{
        width:'58%', minWidth:480,
        background:`linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%), url('/pict_gate.jpg') center/cover no-repeat`,
        color:'#fff',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding:'64px 64px', flexShrink:0, position:'relative', overflow:'hidden',
      }}>
        {/* logo + wordmark */}
        <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative', zIndex:2, width:'100%' }}>
          <img src="/logo.png" alt="CampusAccess" style={{ height: 40, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <button
            type="button"
            onClick={() => navigate('/enter')}
            title="Back to portal selection"
            style={{ marginLeft:'auto', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.22)',
              borderRadius:4, padding:'5px 12px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, color:'#f1f5f9', fontSize:12.5, fontWeight:500 }}>
            <ArrowLeft size={14}/> Back
          </button>
        </div>

        {/* mid: rule + headline + description */}
        <div className="login-left-body" style={{ position:'relative', zIndex:2, margin:'40px 0' }}>
          <div style={{ width:40, height:2.5, background:'#38bdf8', marginBottom:24 }}/>
          <h2 style={{
            fontFamily:'Inter,sans-serif', fontWeight:700,
            fontSize:38, lineHeight:1.22, color:'#f8fafc', margin:'0 0 18px 0', letterSpacing:'-0.02em',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}>
            Guard access,<br/>shift control &amp;<br/>gate management.
          </h2>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:15, lineHeight:1.68, color:'#cbd5e1', margin:0, maxWidth:500, textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>
            Security guard terminal for managing visitor check-ins, student passes, vehicle logs, and duty rosters.
          </p>
          <div style={{ marginTop:36, background:'rgba(15,23,42,0.65)', border:'1px solid rgba(255,255,255,0.18)', backdropFilter:'blur(10px)', padding:'20px 22px', borderRadius:8, maxWidth:500 }}>
            <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'#38bdf8', margin:'0 0 5px' }}>
              PICT Main Campus Gate
            </p>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:13.5, color:'#f1f5f9', margin:0, fontWeight:500 }}>
              Authorized Gate 1 Security Clearance & Control Terminal
            </p>
          </div>
        </div>

        {/* bottom institution label */}
        <div className="login-left-body" style={{ position:'relative', zIndex:2, fontFamily:'JetBrains Mono,monospace', fontSize:10.5, letterSpacing:'0.12em',
          textTransform:'uppercase', color:'#94a3b8', lineHeight:1.8 }}>
          Pune Institute of Computer Technology<br/>Gate Security Terminal<br/>
          <span style={{ color:'rgba(255,255,255,0.35)', marginTop:8, display:'block' }}>Not a guard? <button type="button" onClick={() => navigate('/enter')} style={{ background:'none', border:'none', color:'#7dd3fc', cursor:'pointer', fontFamily:'JetBrains Mono,monospace', fontSize:10.5, padding:0, textDecoration:'underline', letterSpacing:'0.12em' }}>Student / Visitor portal →</button></span>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────────── */}
      <div className="login-right" style={{
        flex:1, background:C.paper, display:'flex', alignItems:'center',
        justifyContent:'center', padding:'48px 48px',
      }}>
        <motion.div
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.3 }}
          style={{ width:'100%', maxWidth:460 }}
        >

          {/* eyebrow */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10.5, letterSpacing:'0.1em',
              textTransform:'uppercase', color:C.mute }}>
              Guard Portal
            </span>
          </div>

          {/* title */}
          <h1 style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:26,
            color:C.text, margin:'0 0 6px 0', letterSpacing:'-0.01em', lineHeight:1.2 }}>
            {formTitle}
          </h1>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:C.mute, margin:'0 0 28px 0' }}>
            {isForgotPassword
              ? 'Enter your guard username or email to reset credentials.'
              : actionMode === 'LOGIN'
              ? 'Enter your security guard credentials to access the terminal.'
              : 'Enter registration details to create a guard account.'}
          </p>

          {/* ── FORGOT PASSWORD ───────────────────────────────────────────── */}
          {isForgotPassword && (
            <form onSubmit={handleForgotPasswordSubmit}>
              <UInput
                label="Username or email"
                value={forgotIdentifier}
                onChange={setForgotIdentifier}
                placeholder="guard1 or guard@pict.edu"
                icon={<Mail size={15}/>}
                required
              />
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button type="button" className="outline-btn" style={{ flex:1 }}
                  onClick={() => setIsForgotPassword(false)}>
                  Back
                </button>
                <button type="submit" className="submit-btn" style={{ flex:2 }} disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}

          {/* ── LOGIN FORM ────────────────────────────────────────────────── */}
          {!isForgotPassword && actionMode === 'LOGIN' && (
            <form onSubmit={handleStandardLogin}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#f1f5f9', padding: 4, borderRadius: 6 }}>
                <button
                  type="button"
                  onClick={() => setSelectedRole('SECURITY_GUARD')}
                  style={{
                    flex: 1,
                    padding: '8px 8px',
                    borderRadius: 4,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'default',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Security Guard
                </button>
              </div>

              <UInput
                label="Guard Username"
                value={username}
                onChange={setUsername}
                placeholder="Enter guard username"
                icon={<UserIcon size={15}/>}
                required
                autoComplete="username"
              />
              <UInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                icon={<Lock size={15}/>}
                trailing={
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:C.mute, display:'flex', padding:0 }}>
                    {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                }
                required
                autoComplete="current-password"
              />
              {/* remember + forgot */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.mute, cursor:'pointer' }}>
                  <input type="checkbox" defaultChecked
                    style={{ accentColor:C.accent, width:13, height:13 }}/>
                  Remember me
                </label>
                <button type="button" onClick={() => setIsForgotPassword(true)}
                  style={{ background:'none', border:'none', fontSize:12, color:C.mute, cursor:'pointer', padding:0 }}>
                  Forgot password?
                </button>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in as Guard'}
                {!loading && <ArrowRight size={14} className="arrow"/>}
              </button>
              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: C.mute }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setActionMode('SIGNUP'); setIsForgotPassword(false); }}
                  style={{
                    background: 'none', border: 'none', color: C.accent, fontWeight: 600,
                    cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit',
                  }}
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM ─────────────────────────────────────────────── */}
          {!isForgotPassword && actionMode === 'SIGNUP' && (
            <form onSubmit={handleRegister}>
              <UInput label="Full name" value={regFullName} onChange={setRegFullName}
                placeholder="e.g. Ramesh Shinde" icon={<UserIcon size={15}/>} required/>
              <UInput label="Guard Username" value={regUsername} onChange={setRegUsername}
                placeholder="Choose guard username" icon={<Shield size={15}/>} required/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="reg-grid">
                <UInput label="Email" value={regEmail} onChange={setRegEmail}
                  placeholder="guard@pict.edu" icon={<Mail size={15}/>}/>
                <UInput label="Mobile" value={regPhone} onChange={setRegPhone}
                  placeholder="9876543210" icon={<Phone size={15}/>}/>
              </div>
              <UInput label="Password" type="password" value={regPassword} onChange={setRegPassword}
                placeholder="••••••••" icon={<Lock size={15}/>} required/>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating account…' : `Register as Guard`}
                {!loading && <ArrowRight size={14} className="arrow"/>}
              </button>
              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: C.mute }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setActionMode('LOGIN'); setIsForgotPassword(false); }}
                  style={{
                    background: 'none', border: 'none', color: C.accent, fontWeight: 600,
                    cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit',
                  }}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* ── DEMO PRESETS (collapsible) ─────────────────────────────────── */}
          {actionMode === 'LOGIN' && !isForgotPassword && (
            <details style={{ marginTop:28 }}>
              <summary style={{
                cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12,
                color:C.mute, display:'flex', alignItems:'center', justifyContent:'space-between',
                borderTop:`1px solid ${C.line}`, paddingTop:16, userSelect:'none',
              }}>
                <span>Quick demo test presets</span>
                <ChevronDown size={13} style={{ color:C.mute }}/>
              </summary>
              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { user:'guard1', pass:'Guard123!', role:'SECURITY_GUARD' as UserRole, label:'Security Guard' },
                ].map(d => (
                  <div key={d.role} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'6px 0', borderBottom:`1px solid ${C.line}`,
                  }}>
                    <div>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:C.text, fontWeight:500 }}>{d.label}</span>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:C.mute, marginLeft:8 }}>{d.user}</span>
                    </div>
                    <button className="demo-use" type="button" onClick={() => quickDemo(d.user, d.pass, d.role)}>
                      Use & Sign In
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* footer */}
          <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:C.mute,
            letterSpacing:'0.06em', textAlign:'center', marginTop:32, textTransform:'uppercase' }}>
            Authorized personnel only · PICT Security Terminal
          </p>
        </motion.div>
      </div>
    </div>
  );
};

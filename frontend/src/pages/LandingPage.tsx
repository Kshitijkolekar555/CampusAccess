import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Users, Car, GraduationCap, ShieldCheck, Clock, Truck } from 'lucide-react';

const C = {
  ink:    '#14171c',
  paper:  '#fafaf8',
  line:   '#e2e0da',
  text:   '#1c1c1a',
  mute:   '#8c887e',
  accent: '#2f5d7c',
};

const modules = [
  {
    icon: <Users size={18} />,
    title: 'Visitor Management',
    desc: 'Check-in, QR pass issuance, host notification, and exit logging — all in real time.',
  },
  {
    icon: <GraduationCap size={18} />,
    title: 'Student Gate Passes',
    desc: 'PRN-verified day outpasses and hostel permissions with warden approval flow.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Guard & Shift Control',
    desc: 'Assign duty rosters, track break times, and maintain guard attendance records.',
  },
  {
    icon: <Car size={18} />,
    title: 'Vehicle & Vendor Logs',
    desc: 'Inward/outward vehicle registry with number-plate entry and delivery tracking.',
  },
  {
    icon: <Clock size={18} />,
    title: 'Duty Shift Roster',
    desc: 'Automated shift scheduling for security staff across all campus gates.',
  },
  {
    icon: <Truck size={18} />,
    title: 'Delivery & Vendors',
    desc: 'Pre-registered vendor access with time-bound entry permits and exit confirmation.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: C.paper, color: C.text, fontFamily: 'Inter, sans-serif' }}>

      <style>{`
        .lp-nav-link { color: ${C.mute}; text-decoration: none; font-size: 13px; transition: color .15s; }
        .lp-nav-link:hover { color: ${C.text}; }
        .lp-module-card { background: white; border: 1px solid ${C.line}; border-radius: 4px; padding: 22px 24px; transition: border-color .15s; }
        .lp-module-card:hover { border-color: ${C.mute}; }
        .lp-cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: ${C.ink}; color: white;
          padding: 12px 24px; border: none; border-radius: 2px;
          font-family: Inter, sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: background .15s; text-decoration: none;
        }
        .lp-cta-primary:hover { background: ${C.accent}; }
        .lp-cta-primary .arrow { transition: transform .15s; }
        .lp-cta-primary:hover .arrow { transform: translateX(3px); }
        .lp-cta-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; color: ${C.mute};
          padding: 12px 20px; border: 1px solid ${C.line}; border-radius: 2px;
          font-family: Inter, sans-serif; font-size: 13px;
          cursor: pointer; transition: border-color .15s, color .15s; text-decoration: none;
        }
        .lp-cta-ghost:hover { border-color: ${C.text}; color: ${C.text}; }
        @media (max-width: 700px) {
          .lp-hero-grid { grid-template-columns: 1fr !important; }
          .lp-module-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40, background: 'rgba(250,250,248,0.92)',
        backdropFilter: 'blur(8px)', borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/logo.png" alt="CampusAccess" style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="/faculties" className="lp-nav-link" style={{ fontWeight: 600, color: '#2f5d7c' }}>Faculty Directory</a>
            <a href="#modules" className="lp-nav-link">Modules</a>
            <a href="#about" className="lp-nav-link">About</a>
            <button
              onClick={() => navigate('/login')}
              className="lp-cta-primary"
              style={{ padding: '8px 18px', fontSize: 12 }}
            >
              Sign in <ArrowRight size={12} className="arrow" />
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '80px 32px 72px', overflow: 'hidden' }}>
        {/* Clearly visible campus bg image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/pict_campus.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.70,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
          {/* Eyebrow */}
          <p style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#1e3a5f', fontWeight: 700, marginBottom: 20,
          }}>
            Pune Institute of Computer Technology · Gate Security Terminal
          </p>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 700,
            fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.15,
            color: '#0f172a', letterSpacing: '-0.02em',
            margin: '0 0 22px 0',
          }}>
            Campus access control,<br />
            handled with precision.
          </h1>

          {/* Description */}
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.65,
            color: '#1e293b', fontWeight: 600, margin: '0 auto 36px', maxWidth: 500,
          }}>
            A unified gate management system for visitors, student passes, guard shifts, vehicles,
            and vendor deliveries — built for PICT's daily security operations.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="lp-cta-primary" onClick={() => navigate('/login')}>
              Enter System <ArrowRight size={13} className="arrow" />
            </button>
            <button 
              className="lp-cta-ghost" 
              onClick={() => navigate('/faculties')}
              style={{ background: 'white', color: '#1e3a5f', borderColor: '#2f5d7c', fontWeight: 600 }}
            >
              Faculty Directory
            </button>
            <a href="#modules" className="lp-cta-ghost" style={{ background: 'rgba(250,250,248,0.85)', color: '#0f172a', borderColor: '#94a3b8', fontWeight: 600 }}>
              View modules
            </a>
          </div>
        </div>
      </section>

      {/* ── Thin rule ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ borderTop: `1px solid ${C.line}` }} />
      </div>

      {/* ── Module grid ────────────────────────────────────────────────── */}
      <section id="modules" style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 32px' }}>
        {/* Section heading */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.mute, margin: '0 0 10px 0' }}>
            System Modules
          </p>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 26, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>
            Everything campus security needs.
          </h2>
        </div>

        <div
          className="lp-module-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
        >
          {modules.map((m) => (
            <div key={m.title} className="lp-module-card">
              <div style={{ color: C.accent, marginBottom: 14 }}>{m.icon}</div>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, color: C.text, margin: '0 0 7px 0' }}>
                {m.title}
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.6, color: C.mute, margin: 0 }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Thin rule ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ borderTop: `1px solid ${C.line}` }} />
      </div>

      {/* ── About Section ────────────────────────────────────────────────── */}
      <section id="about" style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 32px' }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, margin: '0 0 10px 0' }}>
            About the System
          </p>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 30, color: C.text, margin: '0 0 16px 0', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
            Institutional Gate Security & Campus Access Infrastructure
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, lineHeight: 1.7, color: C.text, maxWidth: 820, margin: 0 }}>
            CampusAccess is an enterprise security portal designed specifically for Pune Institute of Computer Technology (PICT).
            It replaces manual paper registers with an automated, role-authenticated gate management terminal that connects
            entry gates, hostel wardens, guard duty rosters, student outpasses, and campus administration in real time.
          </p>
        </div>

        {/* Feature Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 48 }}>
          <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 6, padding: '24px 22px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 4, background: 'rgba(47,93,124,0.1)', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 8px 0' }}>
              Role-Based Access Control
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.6, color: C.mute, margin: 0 }}>
              Tailored interfaces for Guards, Wardens, Faculty, Students, and System Administrators with strict permission enforcement.
            </p>
          </div>

          <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 6, padding: '24px 22px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 4, background: 'rgba(47,93,124,0.1)', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <GraduationCap size={20} />
            </div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 8px 0' }}>
              Digital Outpass Workflow
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.6, color: C.mute, margin: 0 }}>
              PRN-verified hostel leave requests, parent consent validation, and Warden electronic approval flow for gate clearance.
            </p>
          </div>

          <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 6, padding: '24px 22px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 4, background: 'rgba(47,93,124,0.1)', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 8px 0' }}>
              Live Campus Occupancy
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.6, color: C.mute, margin: 0 }}>
              Real-time polling of visitors currently inside campus, host faculty verification, and entry/exit time logging.
            </p>
          </div>

          <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 6, padding: '24px 22px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 4, background: 'rgba(47,93,124,0.1)', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Clock size={20} />
            </div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 8px 0' }}>
              Guard Shift & Duty Roster
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.6, color: C.mute, margin: 0 }}>
              Automated duty shift scheduling across campus gate locations with break time logging and attendance tracking.
            </p>
          </div>
        </div>

        {/* Stats Strip Banner */}
        <div style={{ background: C.ink, borderRadius: 6, padding: '32px 36px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6ee7b7' }}>
              PICT Security Operation
            </span>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, color: '#f0ede8', margin: '4px 0 0' }}>
              Ready for daily campus access management?
            </h3>
          </div>
          <button className="lp-cta-primary" onClick={() => navigate('/login')} style={{ background: C.accent }}>
            Sign In to Terminal <ArrowRight size={13} className="arrow" />
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '20px 32px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="CampusAccess" style={{ height: 26, width: 'auto', objectFit: 'contain', opacity: 0.7 }} />
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.mute }}>
              PICT Gate Security Terminal · v2.4.0
            </span>
          </div>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.line }}>
            Authorized use only
          </span>
        </div>
      </footer>

    </div>
  );
};

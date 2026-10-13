import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const C = {
  ink:    '#14171c',
  paper:  '#fafaf8',
  line:   '#e2e0da',
  text:   '#1c1c1a',
  mute:   '#8c887e',
  accent: '#2f5d7c',
};

export const EnterSystem: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: C.paper,
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .portal-card {
          background: white;
          border: 1.5px solid ${C.line};
          border-radius: 6px;
          padding: 36px 32px;
          cursor: pointer;
          transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0;
        }
        .portal-card:hover {
          border-color: ${C.accent};
          box-shadow: 0 8px 32px rgba(47,93,124,0.12);
          transform: translateY(-2px);
        }
        .portal-card:hover .card-arrow {
          transform: translateX(4px);
        }
        .card-arrow {
          transition: transform 0.18s;
        }
        .portal-card .action-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 2px;
          font-family: Inter, sans-serif; font-size: 12.5px; font-weight: 500;
          cursor: pointer; transition: background 0.15s, color 0.15s;
          text-decoration: none; border: 1px solid transparent;
        }
        .portal-card .action-btn.primary {
          background: ${C.ink}; color: white; border-color: ${C.ink};
        }
        .portal-card .action-btn.primary:hover { background: ${C.accent}; border-color: ${C.accent}; }
        .portal-card .action-btn.outline {
          background: transparent; color: ${C.text}; border-color: ${C.line};
        }
        .portal-card .action-btn.outline:hover { border-color: ${C.text}; }
        .guard-link {
          color: ${C.mute}; font-size: 12px; text-decoration: none;
          border-bottom: 1px dashed ${C.line}; transition: color 0.15s, border-color 0.15s;
        }
        .guard-link:hover { color: ${C.accent}; border-color: ${C.accent}; }
        @media (max-width: 640px) {
          .cards-grid { grid-template-columns: 1fr !important; }
          .enter-section { padding: 48px 20px !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(250,250,248,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto', padding: '0 32px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              color: C.mute, fontSize: 13, fontFamily: 'Inter, sans-serif',
            }}
          >
            <ArrowLeft size={14} />
            Back to home
          </button>

          <img src="/logo.png" alt="CampusAccess" style={{ height: 34, objectFit: 'contain' }} />

          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: `1px solid ${C.line}`,
              borderRadius: 2, padding: '5px 14px',
              fontSize: 12, fontFamily: 'Inter, sans-serif', color: C.mute,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.mute; }}
          >
            <Shield size={12} />
            Guard Portal
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="enter-section" style={{ maxWidth: 900, width: '100%', margin: '0 auto', padding: '72px 32px' }}>

          {/* Eyebrow */}
          <p style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: C.accent, fontWeight: 600, margin: '0 0 16px',
          }}>
            Campus Entry System
          </p>

          {/* Heading */}
          <h1 style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.18,
            color: C.text, letterSpacing: '-0.02em', margin: '0 0 12px',
          }}>
            Who are you entering as?
          </h1>

          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: 14.5,
            lineHeight: 1.65, color: C.mute, margin: '0 0 48px',
            maxWidth: 560,
          }}>
            Select the option that best describes your reason for visiting PICT campus today.
          </p>

          {/* Portal Cards */}
          <div
            className="cards-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}
          >
            {/* Student Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.05 }}
            >
              <div
                className="portal-card"
                onClick={() => navigate('/student/login')}
                role="button"
                tabIndex={0}
                aria-label="Student Portal"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/student/login'); }}
              >
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 4,
                  background: 'rgba(47,93,124,0.08)',
                  border: `1px solid rgba(47,93,124,0.18)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.accent, marginBottom: 20,
                }}>
                  <GraduationCap size={22} />
                </div>

                {/* Label */}
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: C.mute, margin: '0 0 6px',
                }}>
                  For enrolled students
                </p>
                <h2 style={{
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  fontSize: 22, color: C.text, margin: '0 0 10px',
                  letterSpacing: '-0.01em',
                }}>
                  Student
                </h2>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 13,
                  lineHeight: 1.6, color: C.mute, margin: '0 0 24px',
                }}>
                  Access the student portal to log in, manage gate passes, and track hostel outpass status.
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                  <button
                    className="action-btn primary"
                    onClick={e => { e.stopPropagation(); navigate('/student/login'); }}
                  >
                    Student Login <ArrowRight size={12} className="card-arrow" />
                  </button>
                  <button
                    className="action-btn outline"
                    onClick={e => { e.stopPropagation(); navigate('/student/register'); }}
                  >
                    Register
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Visitor Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.12 }}
            >
              <div
                className="portal-card"
                onClick={() => navigate('/visitor')}
                role="button"
                tabIndex={0}
                aria-label="Visitor Portal"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/visitor'); }}
              >
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 4,
                  background: 'rgba(20,23,28,0.06)',
                  border: `1px solid rgba(20,23,28,0.12)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.text, marginBottom: 20,
                }}>
                  <Users size={22} />
                </div>

                {/* Label */}
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: C.mute, margin: '0 0 6px',
                }}>
                  For campus visitors
                </p>
                <h2 style={{
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  fontSize: 22, color: C.text, margin: '0 0 10px',
                  letterSpacing: '-0.01em',
                }}>
                  Visitor
                </h2>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 13,
                  lineHeight: 1.6, color: C.mute, margin: '0 0 24px',
                }}>
                  Register as a campus visitor. Camera-assisted identification makes returning visits faster — we'll recognise you.
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                  <button
                    className="action-btn primary"
                    style={{ background: C.ink }}
                    onClick={e => { e.stopPropagation(); navigate('/visitor'); }}
                  >
                    Continue as Visitor <ArrowRight size={12} className="card-arrow" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Guard portal link */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, color: C.mute, margin: '0 0 8px' }}>
              Security personnel?
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
                color: C.accent, display: 'inline-flex', alignItems: 'center', gap: 5,
                textDecoration: 'underline', textDecorationColor: 'transparent',
                transition: 'text-decoration-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.textDecorationColor = C.accent)}
              onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
            >
              <Shield size={13} />
              Go to Guard Portal
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '16px 32px' }}>
        <p style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: C.line, textAlign: 'center', margin: 0,
        }}>
          Authorized use only · PICT Gate Security Terminal
        </p>
      </footer>
    </div>
  );
};

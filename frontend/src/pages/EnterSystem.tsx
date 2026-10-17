import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const C = {
  ink:    '#14171c',
  paper:  '#f8f9fa',
  line:   '#e2e8f0',
  lineDark: '#cbd5e1',
  text:   '#0f172a',
  mute:   '#64748b',
  accent: '#2563eb',
  accentLight: '#eff6ff',
};

export const EnterSystem: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: C.paper,
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        .portal-card {
          background: #ffffff;
          border: 1px solid ${C.line};
          border-radius: 12px;
          padding: 36px 32px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
        }

        .portal-card:hover {
          border-color: ${C.accent};
          box-shadow: 0 12px 28px -4px rgba(37, 99, 235, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.04);
          transform: translateY(-3px);
        }

        .portal-card:hover .card-arrow {
          transform: translateX(4px);
        }

        .card-arrow {
          transition: transform 0.2s ease;
        }

        .portal-card .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s ease;
          text-decoration: none;
          box-sizing: border-box;
          line-height: 1.4;
        }

        .portal-card .action-btn.primary {
          background: ${C.ink};
          color: #ffffff;
          border: 1px solid ${C.ink};
        }

        .portal-card .action-btn.primary:hover {
          background: ${C.accent};
          border-color: ${C.accent};
        }

        .portal-card .action-btn.outline {
          background: #ffffff;
          color: ${C.text};
          border: 1px solid ${C.lineDark};
        }

        .portal-card .action-btn.outline:hover {
          border-color: ${C.text};
          background: #f8fafc;
        }

        @media (max-width: 680px) {
          .cards-grid { grid-template-columns: 1fr !important; }
          .enter-section { padding: 40px 20px !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: C.mute,
              fontSize: 13.5,
              fontWeight: 500,
              padding: '6px 10px',
              borderRadius: 6,
              transition: 'color 0.15s, background 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.mute; e.currentTarget.style.background = 'none'; }}
          >
            <ArrowLeft size={16} />
            Back to home
          </button>

          <img src="/logo.png" alt="CampusAccess" style={{ height: 36, objectFit: 'contain' }} />

          <button
            onClick={() => navigate('/login')}
            style={{
              background: '#ffffff',
              border: `1px solid ${C.lineDark}`,
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12.5,
              fontWeight: 500,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.18s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.color = C.accent;
              e.currentTarget.style.background = C.accentLight;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.lineDark;
              e.currentTarget.style.color = C.text;
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            <Shield size={14} />
            Guard Portal
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="enter-section" style={{ maxWidth: 880, width: '100%', margin: '0 auto', padding: '60px 24px' }}>

          {/* Eyebrow: Natural clean sans pill badge */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 600,
              color: C.accent,
              background: C.accentLight,
              border: '1px solid #dbeafe',
              borderRadius: 6,
              padding: '4px 10px',
              letterSpacing: 'normal',
            }}>
              Campus Entry System
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 38px)',
            lineHeight: 1.2,
            color: C.text,
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
          }}>
            Who are you entering as?
          </h1>

          <p style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: C.mute,
            margin: '0 0 40px',
            maxWidth: 580,
          }}>
            Select the option that best describes your reason for visiting PICT campus today.
          </p>

          {/* Portal Cards Grid */}
          <div
            className="cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 24,
              alignItems: 'stretch',
              marginBottom: 44,
            }}
          >
            {/* Student Card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.05 }}
              style={{ display: 'flex', height: '100%' }}
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
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.accent,
                  marginBottom: 20,
                  flexShrink: 0,
                }}>
                  <GraduationCap size={24} />
                </div>

                {/* Sub-label: Standard clean font */}
                <p style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.mute,
                  margin: '0 0 6px',
                  letterSpacing: 'normal',
                }}>
                  For enrolled students
                </p>

                {/* Title */}
                <h2 style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.text,
                  margin: '0 0 10px',
                  letterSpacing: '-0.015em',
                }}>
                  Student
                </h2>

                {/* Description */}
                <p style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: C.mute,
                  margin: '0 0 32px',
                  minHeight: 64,
                }}>
                  Access the student portal to log in, manage gate passes, and track hostel outpass status.
                </p>

                {/* Actions strictly pinned to bottom */}
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}>
                  <button
                    className="action-btn primary"
                    onClick={e => { e.stopPropagation(); navigate('/student/login'); }}
                  >
                    Student Login <ArrowRight size={13} className="card-arrow" />
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
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.12 }}
              style={{ display: 'flex', height: '100%' }}
            >
              <div
                className="portal-card"
                onClick={() => navigate('/visitor')}
                role="button"
                tabIndex={0}
                aria-label="Campus Visitors"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/visitor'); }}
              >
                {/* Icon */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.06)',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.text,
                  marginBottom: 20,
                  flexShrink: 0,
                }}>
                  <Users size={24} />
                </div>

                {/* Sub-label: Standard clean font */}
                <p style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.mute,
                  margin: '0 0 6px',
                  letterSpacing: 'normal',
                }}>
                  For campus visitors
                </p>

                {/* Title */}
                <h2 style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.text,
                  margin: '0 0 10px',
                  letterSpacing: '-0.015em',
                }}>
                  Campus Visitors
                </h2>

                {/* Description */}
                <p style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: C.mute,
                  margin: '0 0 32px',
                  minHeight: 64,
                }}>
                  Pre-register your visit, verify using face recognition, and receive a digital pass for campus security gate clearance.
                </p>

                {/* Actions strictly pinned to bottom */}
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}>
                  <button
                    className="action-btn primary"
                    onClick={e => { e.stopPropagation(); navigate('/visitor'); }}
                  >
                    Visitor Check-In <ArrowRight size={13} className="card-arrow" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Guard Portal Link */}
          <div style={{
            textAlign: 'center',
            paddingTop: 12,
            borderTop: `1px solid ${C.line}`,
          }}>
            <p style={{ fontSize: 13, color: C.mute, margin: '0 0 6px' }}>
              Security personnel?
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                color: C.accent,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.accentLight;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <Shield size={14} />
              Go to Guard Portal
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${C.line}`,
        padding: '18px 24px',
        background: '#ffffff',
      }}>
        <p style={{
          fontSize: 12,
          color: '#94a3b8',
          textAlign: 'center',
          margin: 0,
        }}>
          Authorized use only · PICT Gate Security Terminal
        </p>
      </footer>
    </div>
  );
};

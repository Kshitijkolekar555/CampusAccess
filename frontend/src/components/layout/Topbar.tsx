import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <header
      style={{
        height: 52,
        background: 'white',
        borderBottom: '1px solid var(--line)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Page search — underline style */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search visitors, passes, vehicles…"
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontFamily: 'Inter, sans-serif', fontSize: 13,
            color: 'var(--text)', width: 240,
            caretColor: 'var(--accent)',
          }}
          className="placeholder:text-[var(--mute)]"
        />
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Role label */}
        {user?.role && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            {user.role.replace('_', ' ')}
          </span>
        )}

        {/* Notifications */}
        <Link
          to="/notifications"
          style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            color: 'var(--mute)', textDecoration: 'none',
          }}
        >
          <Bell className="w-4 h-4" />
          <span
            style={{
              position: 'absolute', top: -2, right: -2,
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--accent)',
              border: '1.5px solid white',
            }}
          />
        </Link>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16, borderLeft: '1px solid var(--line)' }}>
          <Link
            to="/profile"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 28, height: 28, borderRadius: 4,
                background: 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11, color: '#e8e6e2',
              }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
              {user?.username}
            </span>
          </Link>

          <button
            onClick={logout}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--mute)', display: 'flex', padding: 0, transition: 'color 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#be123c')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--mute)')}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

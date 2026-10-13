import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import {
  LayoutDashboard, Users, Car, Truck, GraduationCap, Home,
  ShieldCheck, Clock, UserCheck, DoorClosed, Bell, User as UserIcon,
  LogOut, X
} from 'lucide-react';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  category?: 'overview' | 'gate' | 'academic' | 'admin';
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard',        path: '/dashboard',       icon: <LayoutDashboard className="w-3.5 h-3.5" />, category: 'overview' },
  { title: 'Visitors',         path: '/visitors',        icon: <Users className="w-3.5 h-3.5" />,          roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'gate' },
  { title: 'Vehicles',         path: '/vehicles',        icon: <Car className="w-3.5 h-3.5" />,            roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'gate' },
  { title: 'Vendors',          path: '/vendors',         icon: <Truck className="w-3.5 h-3.5" />,          roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'gate' },
  { title: 'Duty Shifts',      path: '/shifts',          icon: <Clock className="w-3.5 h-3.5" />,          roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'gate' },
  { title: 'Student Passes',   path: '/student-passes',  icon: <GraduationCap className="w-3.5 h-3.5" />,  roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD','STUDENT'], category: 'academic' },
  { title: 'Hostel Outpasses', path: '/hostel-outpasses',icon: <Home className="w-3.5 h-3.5" />,           roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD','STUDENT'], category: 'academic' },
  { title: 'Gates',            path: '/gates',           icon: <DoorClosed className="w-3.5 h-3.5" />,     roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'academic' },
  { title: 'Notifications',    path: '/notifications',   icon: <Bell className="w-3.5 h-3.5" />,           roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD','STUDENT'], category: 'admin' },
  { title: 'Profile',          path: '/profile',         icon: <UserIcon className="w-3.5 h-3.5" />,       category: 'admin' },
];

const CATS = [
  { key: 'overview',  label: 'Overview'      },
  { key: 'gate',      label: 'Gate & Ops'    },
  { key: 'academic',  label: 'Campus'        },
  { key: 'admin',     label: 'Admin'         },
];

const S = {
  brand: {
    padding: '14px 18px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
  },
  nav: { flex: 1, overflowY: 'auto' as const, padding: '12px 10px' },
  catLabel: {
    fontFamily: 'Inter, sans-serif',
    fontSize: 10,
    letterSpacing: '0.08em',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#64748b',
    padding: '12px 10px 6px',
  },
  footer: {
    padding: '12px 14px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatar: {
    width: 30, height: 30, borderRadius: 4,
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, color: '#4f46e5',
    flexShrink: 0,
  },
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredMenu = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user ? item.roles.includes(user.role) : false;
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Desktop Sticky / Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 md:w-[220px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div style={S.brand} className="justify-between items-center">
          <img
            src="/logo.png"
            alt="CampusAccess"
            style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block' }}
          />

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="md:hidden flex items-center justify-center p-2 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav style={S.nav}>
          {CATS.map((cat) => {
            const items = filteredMenu.filter((m) => m.category === cat.key);
            if (items.length === 0) return null;

            return (
              <div key={cat.key} style={{ marginBottom: 8 }}>
                <div style={S.catLabel}>{cat.label}</div>
                {items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 10px',
                      borderRadius: 4,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#4f46e5' : '#334155',
                      textDecoration: 'none',
                      borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                      background: isActive ? '#eef2ff' : 'transparent',
                      transition: 'color 0.12s, background 0.12s',
                      marginBottom: 2,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <span style={{ flexShrink: 0, color: isActive ? '#4f46e5' : '#64748b' }}>{item.icon}</span>
                        <span>{item.title}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div style={S.footer}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, overflow: 'hidden' }}>
            <div style={S.avatar}>{user?.fullName?.charAt(0) || 'U'}</div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName || 'User'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#4f46e5', margin: 0 }}>
                {user?.role || 'Guest'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: 8, display: 'flex',
              borderRadius: 3, transition: 'color 0.12s',
              minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import {
  LayoutDashboard, Users, Car, Truck, GraduationCap, Home,
  ShieldCheck, Clock, UserCheck, DoorClosed, Bell, User as UserIcon,
  LogOut,
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
  { title: 'Visitors',         path: '/visitors',        icon: <Users className="w-3.5 h-3.5" />,          roles: ['ADMIN','SECURITY_OFFICER','SECURITY_GUARD','GUARD','STAFF'], category: 'gate' },
  { title: 'Vehicles',         path: '/vehicles',        icon: <Car className="w-3.5 h-3.5" />,            roles: ['ADMIN','SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'gate' },
  { title: 'Vendors',          path: '/vendors',         icon: <Truck className="w-3.5 h-3.5" />,          roles: ['ADMIN','SECURITY_OFFICER'], category: 'gate' },
  { title: 'Duty Shifts',      path: '/shifts',          icon: <Clock className="w-3.5 h-3.5" />,          roles: ['ADMIN','SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'gate' },
  { title: 'Student Passes',   path: '/student-passes',  icon: <GraduationCap className="w-3.5 h-3.5" />,  roles: ['ADMIN','SECURITY_OFFICER','SECURITY_GUARD','GUARD','HOSTEL_WARDEN','STUDENT'], category: 'academic' },
  { title: 'Hostel Outpasses', path: '/hostel-outpasses',icon: <Home className="w-3.5 h-3.5" />,           roles: ['ADMIN','SECURITY_OFFICER','SECURITY_GUARD','GUARD','HOSTEL_WARDEN','STUDENT'], category: 'academic' },
  { title: 'Gates',            path: '/gates',           icon: <DoorClosed className="w-3.5 h-3.5" />,     roles: ['ADMIN','SECURITY_OFFICER'], category: 'academic' },
  { title: 'Guard Staff',      path: '/guards',          icon: <ShieldCheck className="w-3.5 h-3.5" />,    roles: ['ADMIN','SECURITY_OFFICER'], category: 'admin' },
  { title: 'Users',            path: '/users',           icon: <UserCheck className="w-3.5 h-3.5" />,      roles: ['ADMIN'], category: 'admin' },
  { title: 'Notifications',    path: '/notifications',   icon: <Bell className="w-3.5 h-3.5" />,           roles: ['ADMIN','SECURITY_OFFICER','SECURITY_GUARD','GUARD','STAFF','HOSTEL_WARDEN'], category: 'admin' },
  { title: 'Profile',          path: '/profile',         icon: <UserIcon className="w-3.5 h-3.5" />,       category: 'admin' },
];

const CATS = [
  { key: 'overview',  label: 'Overview'      },
  { key: 'gate',      label: 'Gate & Ops'    },
  { key: 'academic',  label: 'Campus'        },
  { key: 'admin',     label: 'Admin'         },
];

const S = {
  sidebar: {
    width: 220,
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    height: '100vh',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    flexShrink: 0,
    position: 'sticky' as const,
    top: 0,
    zIndex: 30,
    userSelect: 'none' as const,
  },
  brand: {
    padding: '16px 18px',
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

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const filteredMenu = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user ? item.roles.includes(user.role) : false;
  });

  return (
    <aside style={S.sidebar}>
      {/* Brand */}
      <div style={S.brand}>
        <img
          src="/logo.png"
          alt="CampusAccess"
          style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
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
          onClick={logout}
          title="Sign out"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', padding: 4, display: 'flex',
            borderRadius: 3, transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

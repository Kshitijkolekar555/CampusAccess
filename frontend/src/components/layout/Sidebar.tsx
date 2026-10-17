import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import {
  LayoutDashboard, Users, Car, Truck, GraduationCap, Home,
  ShieldCheck, Clock, UserCheck, DoorClosed, Bell, User as UserIcon,
  LogOut, X, Ticket
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
  { title: 'Student Passes',   path: '/student-passes',  icon: <GraduationCap className="w-3.5 h-3.5" />,  roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD','STUDENT'], category: 'gate' },
  { title: 'Campus Outpasses', path: '/outpasses',       icon: <Home className="w-3.5 h-3.5" />,           roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD','STUDENT'], category: 'gate' },
  { title: 'Vehicles',         path: '/vehicles',        icon: <Car className="w-3.5 h-3.5" />,            roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'gate' },
  { title: 'Vendors',          path: '/vendors',         icon: <Truck className="w-3.5 h-3.5" />,          roles: ['SECURITY_OFFICER','SECURITY_GUARD','GUARD'], category: 'gate' },
  { title: 'Profile',          path: '/profile',         icon: <UserIcon className="w-3.5 h-3.5" />,       category: 'admin' },
];

const CATS = [
  { key: 'overview',  label: 'Overview'      },
  { key: 'gate',      label: 'Gate & Ops'    },
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

      {/* Main Responsive Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#e2e8f0] flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Brand Header */}
        <div style={S.brand} className="justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-indigo-600/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 leading-tight">CampusAccess</div>
              <div className="text-[10px] text-slate-500 font-medium">PICT Security Terminal</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={S.nav} className="space-y-6">
          {CATS.map((cat) => {
            const items = filteredMenu.filter((i) => (i.category || 'gate') === cat.key);
            if (!items.length) return null;

            return (
              <div key={cat.key}>
                <div style={S.catLabel}>{cat.label}</div>
                <div className="space-y-1 mt-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div style={S.footer}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div style={S.avatar}>
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{user?.fullName || 'User'}</div>
              <div className="text-[10px] text-slate-500 capitalize truncate">{user?.role?.toLowerCase() || 'Role'}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Sign out of terminal"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

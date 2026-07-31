import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  Users,
  Car,
  Truck,
  GraduationCap,
  Home,
  ShieldCheck,
  Clock,
  UserCheck,
  DoorClosed,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { clsx } from 'clsx';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    title: 'Visitors',
    path: '/visitors',
    icon: <Users className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD'],
  },
  {
    title: 'Vehicles',
    path: '/vehicles',
    icon: <Car className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD'],
  },
  {
    title: 'Vendors & Delivery',
    path: '/vendors',
    icon: <Truck className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD'],
  },
  {
    title: 'Student Passes',
    path: '/student-passes',
    icon: <GraduationCap className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'HOSTEL_WARDEN'],
  },
  {
    title: 'Hostel Outpasses',
    path: '/hostel-outpasses',
    icon: <Home className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'HOSTEL_WARDEN'],
  },
  {
    title: 'Guard Operations',
    path: '/guards',
    icon: <ShieldCheck className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD'],
  },
  {
    title: 'Duty Shifts',
    path: '/shifts',
    icon: <Clock className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD'],
  },
  {
    title: 'User Management',
    path: '/users',
    icon: <UserCheck className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    title: 'Gate Config',
    path: '/gates',
    icon: <DoorClosed className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD'],
  },
  {
    title: 'Notifications',
    path: '/notifications',
    icon: <Bell className="w-5 h-5" />,
    roles: ['ADMIN', 'SECURITY_OFFICER'],
  },
  {
    title: 'My Profile',
    path: '/profile',
    icon: <UserIcon className="w-5 h-5" />,
  },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();

  const filteredMenu = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user ? item.roles.includes(user.role) : false;
  });

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-wide">CampusAccess</h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Enterprise SaaS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Main Navigation
        </div>
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )
            }
          >
            <div className="flex items-center gap-3">
              <span className="transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
              <span>{item.title}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'User'}</p>
            <p className="text-[10px] font-medium text-slate-400 truncate uppercase">{user?.role || 'Guest'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

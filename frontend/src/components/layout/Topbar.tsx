import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Search, Bell, Shield, User as UserIcon, LogOut } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Search Bar */}
      <div className="relative w-72 md:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Global search (Visitors, Passes, Vehicles)..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 border border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        {user?.role && (
          <Badge variant="purple" size="md" icon={<Shield className="w-3.5 h-3.5" />}>
            {user.role}
          </Badge>
        )}

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </Link>

        {/* User Quick Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="hidden sm:inline">{user?.username}</span>
          </Link>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

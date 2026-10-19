
import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Menu, Search, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopbarProps {
  onToggleMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMenu }) => {
  const { user, logout } = useAuthStore();

  const userInitial = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U';
  const roleDisplay = user?.role ? user.role.replace(/_/g, ' ') : '';

  return (
    <header className="h-[52px] px-3 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left controls: Mobile Menu + Search */}
      <div className="flex items-center gap-3">
        {onToggleMenu && (
          <button
            type="button"
            onClick={onToggleMenu}
            aria-label="Toggle navigation menu"
            className="md:hidden flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global search */}
        <div className="hidden sm:flex items-center gap-2 border-b border-slate-200 pb-1 focus-within:border-indigo-500 transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search visitors, passes…"
            className="bg-transparent border-none outline-none font-sans text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 w-44 md:w-56 focus:outline-none"
          />
        </div>
      </div>

      {/* Right controls: Role + User Profile + Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {roleDisplay && (
          <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-indigo-50/80 text-indigo-700 border border-indigo-200/60">
            <Shield className="w-3 h-3 text-indigo-500" />
            {roleDisplay}
          </span>
        )}

        {/* User + logout */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-decoration-none group min-h-[38px] py-1"
            title="View Profile"
          >
            <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center font-sans font-bold text-xs text-slate-100 group-hover:bg-indigo-600 transition-colors shadow-xs">
              {userInitial}
            </div>
            <span className="font-sans text-[13px] font-medium text-slate-800 group-hover:text-indigo-600 transition-colors max-w-[100px] sm:max-w-[140px] truncate">
              {user?.fullName || user?.username || 'User'}
            </span>
          </Link>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

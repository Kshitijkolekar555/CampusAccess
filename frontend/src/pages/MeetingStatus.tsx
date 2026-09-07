import React from 'react';
import { VisitorMeetingStatus } from '../components/visitor/VisitorMeetingStatus';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export const MeetingStatus: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
            PICT
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-sm">CampusAccess</span>
        </div>
      </div>

      <VisitorMeetingStatus />
    </div>
  );
};

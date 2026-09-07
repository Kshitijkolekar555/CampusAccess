import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { meetingRequestsApi } from '../../api/meetingRequests';
import { VisitorMeetingRequest, MeetingRequestStatus } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ShieldCheck, UserCheck, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';

interface MeetingRequestMonitorProps {
  gateId?: number;
}

export const MeetingRequestMonitor: React.FC<MeetingRequestMonitorProps> = ({ gateId = 1 }) => {
  // Polls gate-specific meeting requests every 5 seconds
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['security-meeting-monitor', gateId],
    queryFn: () => meetingRequestsApi.getRequestsByGate(gateId, { page: 0, size: 25 }),
    refetchInterval: 5000,
  });

  const requestList = pageData?.content || [];

  const getStatusBadge = (status: MeetingRequestStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
            <CheckCircle className="w-3.5 h-3.5" />
            APPROVED — ALLOW ENTRY
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            REJECTED — DO NOT ALLOW
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Calendar className="w-3.5 h-3.5" />
            RESCHEDULED
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800">
            <Clock className="w-3.5 h-3.5" />
            PENDING FACULTY APPROVAL
          </span>
        );
    }
  };

  return (
    <Card className="p-6 mb-8 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Main Gate Faculty Meeting Monitor
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live status feed • Security can only monitor approvals; only faculty can approve entries.
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Gate #{gateId} • Auto-refreshing 5s
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Loading gate approvals...</div>
      ) : requestList.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          No faculty meeting requests logged at this gate today.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Visitor Name</th>
                <th className="py-2.5 px-3">Faculty to Meet</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Approved Venue / Action</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {requestList.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{req.visitorName}</div>
                    <div className="text-xs text-slate-400">{req.visitorMobile}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {req.facultyName || 'Faculty Member'}
                    </div>
                    <div className="text-xs text-slate-400">{req.department || 'Academic'}</div>
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="py-3 px-3">
                    {req.status === 'APPROVED' && req.latestResponse && (
                      <div className="text-xs">
                        <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {req.latestResponse.meetingLocation || 'Department Cabin'}
                        </div>
                        {req.latestResponse.notes && (
                          <div className="text-slate-500 italic mt-0.5">"{req.latestResponse.notes}"</div>
                        )}
                      </div>
                    )}
                    {req.status === 'REJECTED' && req.latestResponse && (
                      <div className="text-xs text-rose-600 dark:text-rose-400 italic">
                        Reason: {req.latestResponse.rejectionReason || 'Unavailable'}
                      </div>
                    )}
                    {req.status === 'RESCHEDULED' && req.latestResponse && (
                      <div className="text-xs text-amber-700 dark:text-amber-400">
                        Proposed: {req.latestResponse.suggestedDate} at {req.latestResponse.suggestedTime}
                      </div>
                    )}
                    {req.status === 'PENDING' && (
                      <span className="text-xs text-slate-400 italic">Awaiting response from faculty cabin...</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-xs text-slate-400 font-mono">
                    {new Date(req.requestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

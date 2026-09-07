import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { meetingRequestsApi } from '../../api/meetingRequests';
import { VisitorMeetingRequest, MeetingRequestStatus } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Search, MapPin, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export const VisitorMeetingStatus: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [searchMobile, setSearchMobile] = useState('');

  const { data: requests, isLoading, isError, refetch } = useQuery({
    queryKey: ['visitor-meeting-status', searchMobile],
    queryFn: () => (searchMobile ? meetingRequestsApi.lookupByMobile(searchMobile) : []),
    enabled: !!searchMobile,
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = mobile.trim();
    if (!/^[6-9][0-9]{9}$/.test(clean)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setSearchMobile(clean);
  };

  const getStatusDisplay = (status: MeetingRequestStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          title: 'Meeting Approved!',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
        };
      case 'REJECTED':
        return {
          title: 'Meeting Declined',
          color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          icon: <XCircle className="w-6 h-6 text-rose-600" />,
        };
      case 'RESCHEDULED':
        return {
          title: 'Meeting Rescheduled',
          color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: <Calendar className="w-6 h-6 text-amber-600" />,
        };
      case 'PENDING':
      default:
        return {
          title: 'Pending Faculty Approval',
          color: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
          icon: <Clock className="w-6 h-6 text-yellow-600 animate-spin" />,
        };
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          PICT Visitor Meeting Status Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Track real-time approval status for your faculty meeting request using your registered mobile number.
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6 mb-6 shadow-md border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            type="tel"
            maxLength={10}
            placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
            className="text-base tracking-wider"
          />
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
            <Search className="w-4 h-4" />
            Check Status
          </Button>
        </form>
      </Card>

      {/* Status Output */}
      {isLoading && (
        <div className="text-center py-10 text-slate-400">
          <Clock className="w-8 h-8 mx-auto animate-spin mb-2" />
          Checking meeting records...
        </div>
      )}

      {searchMobile && requests && requests.length === 0 && (
        <Card className="p-8 text-center border-dashed border-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No requests found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No meeting requests were found for mobile number {searchMobile}. Please check with the security guard at the gate.
          </p>
        </Card>
      )}

      {requests && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusConfig = getStatusDisplay(req.status);
            return (
              <Card
                key={req.id}
                className={`p-6 border shadow-sm transition-all ${statusConfig.color}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-sm">
                      {statusConfig.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{statusConfig.title}</h3>
                      <p className="text-xs opacity-80 mt-0.5">
                        Meeting with: <span className="font-semibold">{req.facultyName || 'Faculty Member'}</span> ({req.department || 'Academic Department'})
                      </p>
                      <p className="text-xs opacity-75">
                        Requested: {new Date(req.requestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} at {req.gateName || 'Main Gate'}
                      </p>
                    </div>
                  </div>

                  <Badge variant="default" className="font-bold uppercase text-xs">
                    {req.status}
                  </Badge>
                </div>

                {/* APPROVED DETAILS */}
                {req.status === 'APPROVED' && req.latestResponse && (
                  <div className="mt-5 p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-sm border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Meeting Location: {req.latestResponse.meetingLocation}</span>
                    </div>

                    {(req.latestResponse.building || req.latestResponse.roomNumber) && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Venue: {req.latestResponse.building} {req.latestResponse.floor && `• ${req.latestResponse.floor}`} {req.latestResponse.roomNumber && `• Room ${req.latestResponse.roomNumber}`}
                      </div>
                    )}

                    {req.latestResponse.notes && (
                      <div className="text-xs text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-slate-800 p-2.5 rounded-lg">
                        <span className="font-semibold">Instructions from Faculty: </span>
                        {req.latestResponse.notes}
                      </div>
                    )}

                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      ✓ Please show this screen to the security guard at the gate to enter.
                    </div>
                  </div>
                )}

                {/* REJECTED DETAILS */}
                {req.status === 'REJECTED' && req.latestResponse && (
                  <div className="mt-4 p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 text-xs">
                    <span className="font-semibold text-rose-700 dark:text-rose-300">Reason from Faculty: </span>
                    <span>{req.latestResponse.rejectionReason}</span>
                  </div>
                )}

                {/* RESCHEDULED DETAILS */}
                {req.status === 'RESCHEDULED' && req.latestResponse && (
                  <div className="mt-4 p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 text-xs space-y-2">
                    <div className="font-semibold text-amber-700 dark:text-amber-300">
                      Faculty Proposed Rescheduled Time:
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      📅 {req.latestResponse.suggestedDate} at ⏰ {req.latestResponse.suggestedTime}
                    </div>
                    {req.latestResponse.rescheduleReason && (
                      <div className="italic text-slate-600 dark:text-slate-400">
                        "{req.latestResponse.rescheduleReason}"
                      </div>
                    )}
                  </div>
                )}

                {/* PENDING DETAILS */}
                {req.status === 'PENDING' && (
                  <div className="mt-4 p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span>Your meeting request is currently with {req.facultyName || 'the faculty member'}. This page will update automatically once reviewed.</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

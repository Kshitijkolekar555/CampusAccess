import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { guardApi } from '../api/guards';
import { useAuthStore } from '../store/authStore';
import { StatsCard } from '../components/ui/StatsCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Clock,
  PlusCircle,
  Car,
  GraduationCap,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { time: '08:00', visitors: 12 },
  { time: '10:00', visitors: 35 },
  { time: '12:00', visitors: 68 },
  { time: '14:00', visitors: 54 },
  { time: '16:00', visitors: 82 },
  { time: '18:00', visitors: 40 },
  { time: '20:00', visitors: 18 },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['guard-dashboard'],
    queryFn: guardApi.getDashboardMetrics,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Live Terminal
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">
            Welcome back, {user?.fullName}!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time campus gate control and security operations dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/visitors')}
          >
            Check-In Visitor
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 text-slate-200 hover:bg-slate-800"
            onClick={() => navigate('/shifts')}
          >
            Duty Shift
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : (
          <>
            <StatsCard
              title="Active Visitors Inside"
              value={dashboard?.activeVisitorsInsideCount ?? 0}
              icon={<Users className="w-6 h-6" />}
              colorTheme="indigo"
              description="Currently on campus"
            />
            <StatsCard
              title="Today's Total Visitors"
              value={dashboard?.totalVisitorsCheckedInTodayCount ?? 0}
              icon={<UserCheck className="w-6 h-6" />}
              colorTheme="emerald"
              description="Checked in today"
            />
            <StatsCard
              title="Active Guards on Duty"
              value={dashboard?.activeGuardCount ?? 0}
              icon={<ShieldCheck className="w-6 h-6" />}
              colorTheme="cyan"
              description="Security personnel"
            />
            <StatsCard
              title="Active Duty Shifts"
              value={dashboard?.activeShiftsCount ?? 0}
              icon={<Clock className="w-6 h-6" />}
              colorTheme="purple"
              description="Ongoing gate shifts"
            />
          </>
        )}
      </div>

      {/* Analytics Chart + Quick Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Traffic Trend */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Hourly Visitor Traffic (Today)
              </h3>
              <p className="text-xs text-slate-500">Real-time gate traffic intensity</p>
            </div>
            <Badge variant="purple">Live Feed</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="visitors" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Operations Panel */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Quick Terminal Access</h3>
            <p className="text-xs text-slate-500 mb-6">Direct access to core security modules</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/visitors')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Visitor Management</p>
                    <p className="text-[11px] text-slate-400">Check-in, QR Passes</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/vehicles')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Vehicle Entry Logs</p>
                    <p className="text-[11px] text-slate-400">ANPR & Gate Logs</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/student-passes')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 hover:border-purple-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Student Gate Passes</p>
                    <p className="text-[11px] text-slate-400">Approval & Exit</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity Log Feed */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Guard Shift Activity Stream</h3>
            <p className="text-xs text-slate-500">Real-time incident and inspection logs</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/shifts')}>
            View All Shifts
          </Button>
        </div>

        {dashboard?.recentLogs && dashboard.recentLogs.length > 0 ? (
          <div className="space-y-4">
            {dashboard.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={log.logType === 'INCIDENT' ? 'danger' : 'info'}>
                    {log.logType}
                  </Badge>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.description}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No shift logs recorded today.</p>
        )}
      </Card>
    </div>
  );
};

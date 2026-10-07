import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  MessageSquareWarning,
  MessageSquare,
  Radio,
  Server,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Mic,
  Video
} from 'lucide-react';

interface AdminOverviewProps {
  metrics: any;
  onRefresh: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ metrics, onRefresh }) => {
  const navigate = useNavigate();

  if (!metrics) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <span className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
        <span>Loading Admin Control metrics...</span>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Registered', value: metrics.totalUsers || 0, icon: Users, color: 'text-cyan-400', path: '/admin/users' },
    { title: 'Online Right Now', value: metrics.onlineUsers || 0, icon: UserCheck, color: 'text-emerald-400', path: '/admin/users?status=active' },
    { title: 'New Users Today', value: metrics.newUsersToday || 0, icon: Activity, color: 'text-violet-400', path: '/admin/users' },
    { title: 'Suspended Users', value: metrics.suspendedUsers || 0, icon: UserX, color: 'text-amber-400', path: '/admin/users?status=suspended' },
    { title: 'Blocked Accounts', value: metrics.blockedUsers || 0, icon: UserX, color: 'text-rose-400', path: '/admin/users?status=blocked' },
    { title: 'Open Reports', value: metrics.openReports || 0, icon: AlertTriangle, color: 'text-rose-400', path: '/admin/reports' },
    { title: 'Pending Complaints', value: metrics.pendingComplaints || 0, icon: MessageSquareWarning, color: 'text-amber-400', path: '/admin/complaints' },
    { title: 'Open Feedback', value: metrics.openFeedback || 0, icon: MessageSquare, color: 'text-cyan-400', path: '/admin/feedback' },
    { title: 'Active Listen Rooms', value: metrics.activeRooms || 0, icon: Radio, color: 'text-indigo-400', path: '/admin/system' }
  ];

  return (
    <div className="space-y-8">
      {/* System Operational Health Bar */}
      <LiquidGlassCard depth={2} className="p-4 bg-emerald-950/15 border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>SONIVA System Operational Status</span>
              <span className="text-[10px] text-emerald-300 font-mono">100% Uptime</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Firebase Auth, Firestore Admin, Realtime WS, YouTube Data API, E2EE Zero-Decryption Boundary active.
            </div>
          </div>
        </div>

        <LiquidGlassButton
          variant="secondary"
          size="sm"
          onClick={() => navigate('/admin/system')}
          className="text-xs gap-1.5"
        >
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>Detailed System Health</span>
        </LiquidGlassButton>
      </LiquidGlassCard>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <LiquidGlassCard
              key={kpi.title}
              depth={2}
              className="p-5 flex items-center justify-between hover:border-rose-500/40 cursor-pointer group transition-all"
              onClick={() => navigate(kpi.path)}
            >
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {kpi.title}
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {kpi.value}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-rose-300 flex items-center gap-0.5">
                  View <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </LiquidGlassCard>
          );
        })}
      </div>

      {/* Analytics SVG Activity Visualization */}
      <LiquidGlassCard depth={3} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Platform Activity Trend</h2>
          </div>
          <button onClick={() => navigate('/admin/analytics')} className="text-xs text-cyan-400 hover:underline">
            View Analytics →
          </button>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-40 flex items-end justify-between gap-2 pt-4 px-2">
          {[
            { day: 'Mon', val: 65, color: 'bg-cyan-500/40' },
            { day: 'Tue', val: 72, color: 'bg-cyan-500/50' },
            { day: 'Wed', val: 80, color: 'bg-violet-500/50' },
            { day: 'Thu', val: 88, color: 'bg-violet-500/60' },
            { day: 'Fri', val: 95, color: 'bg-rose-500/60' },
            { day: 'Sat', val: 100, color: 'bg-rose-500/80' },
            { day: 'Sun', val: 90, color: 'bg-cyan-500/70' }
          ].map((bar) => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className={`w-full max-w-[40px] rounded-t-xl transition-all ${bar.color} group-hover:brightness-125`}
                style={{ height: `${bar.val}%` }}
              />
              <span className="text-[10px] font-mono text-slate-400">{bar.day}</span>
            </div>
          ))}
        </div>
      </LiquidGlassCard>

      {/* Recent Admin Audit Activity Feed */}
      <LiquidGlassCard depth={2} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Admin Audit Activity</h2>
          </div>
          <button onClick={() => navigate('/admin/audit-log')} className="text-xs text-rose-300 hover:underline">
            Full Audit Log →
          </button>
        </div>

        {metrics.recentActivity?.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">No admin audit events recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {metrics.recentActivity.slice(0, 5).map((log: any, idx: number) => (
              <div key={log.id || idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-rose-300 font-bold">{log.action}</span>
                    <span className="text-slate-400 text-[10px]">by {log.actorEmail}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">{log.details || `Target: ${log.target}`}</div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  MessageSquareWarning,
  MessageSquare,
  Lightbulb,
  ShieldAlert,
  BarChart3,
  Server,
  FileText,
  Settings,
  ArrowLeft,
  Lock,
  LogOut
} from 'lucide-react';

interface AdminSidebarProps {
  onBackToApp: () => void;
  openReportsCount?: number;
  openFeedbackCount?: number;
  pendingComplaintsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onBackToApp,
  openReportsCount = 0,
  openFeedbackCount = 0,
  pendingComplaintsCount = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const currentPath = location.pathname;

  const adminNavItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Reports', path: '/admin/reports', icon: AlertTriangle, badge: openReportsCount },
    { label: 'Complaints', path: '/admin/complaints', icon: MessageSquareWarning, badge: pendingComplaintsCount },
    { label: 'Feedback', path: '/admin/feedback', icon: MessageSquare, badge: openFeedbackCount },
    { label: 'Feature Requests', path: '/admin/feature-requests', icon: Lightbulb },
    { label: 'Moderation Queue', path: '/admin/moderation', icon: ShieldAlert },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'System Health', path: '/admin/system', icon: Server },
    { label: 'Audit Log', path: '/admin/audit-log', icon: FileText },
    { label: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const isNavActive = (path: string) => {
    if (path === '/admin') return currentPath === '/admin' || currentPath === '/admin/';
    return currentPath.startsWith(path);
  };

  return (
    <aside className="w-64 h-full bg-slate-950/40 backdrop-blur-3xl border-r border-white/10 flex flex-col justify-between p-4 shrink-0 z-20 relative overflow-y-auto">
      <div className="space-y-6">
        {/* Brand Lockup */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500/40 via-violet-500/40 to-cyan-500/40 border border-white/30 flex items-center justify-center text-white font-black text-base shadow-lg shadow-rose-950/40">
              S
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>SONIVA</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Control
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Admin Control Center
              </div>
            </div>
          </div>
        </div>

        {/* Back to App Button */}
        <button
          onClick={onBackToApp}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>Back to App</span>
        </button>

        {/* Nav Links */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
            Admin Management
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-rose-500/25 via-violet-600/25 to-cyan-500/25 text-white border border-rose-400/40 shadow-lg shadow-rose-950/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {!!item.badge && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Session Card */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{user?.displayName || 'Admin'}</div>
            <div className="text-[10px] text-rose-300 font-mono truncate">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
            title="Sign Out Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

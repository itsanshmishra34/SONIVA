import React from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { AuthLoadingScreen } from '../auth/AuthLoadingScreen';
import { ShieldAlert, KeyRound, Lock } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-6 bg-slate-950 text-slate-100 relative">
        <LiquidGlassCard depth={3} glow={true} className="max-w-md w-full p-8 text-center space-y-5 border-rose-500/30">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight uppercase">Admin Access Denied</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Super Administrator authorization is required to access the SONIVA Admin Dashboard.
            </p>
          </div>

          <LiquidGlassButton
            variant="primary"
            size="md"
            glow={true}
            onClick={() => navigate('/admin/login')}
            className="w-full gap-2 text-xs font-bold justify-center"
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign In with Admin Passkey</span>
          </LiquidGlassButton>
        </LiquidGlassCard>
      </div>
    );
  }

  const getPageTitle = (pathname: string): string => {
    if (pathname === '/admin' || pathname === '/admin/') return 'Overview & Control Center';
    if (pathname.startsWith('/admin/users')) return 'User Governance & Enforcement';
    if (pathname.startsWith('/admin/reports')) return 'Moderation & Safety Reports';
    if (pathname.startsWith('/admin/complaints')) return 'User Complaints & Disputes';
    if (pathname.startsWith('/admin/feedback')) return 'App Feedback & Satisfaction';
    if (pathname.startsWith('/admin/feature-requests')) return 'Feature Requests & Product Roadmap';
    if (pathname.startsWith('/admin/moderation')) return 'Moderation Enforcement Queue';
    if (pathname.startsWith('/admin/analytics')) return 'Platform Metrics & Analytics';
    if (pathname.startsWith('/admin/system')) return 'System Infrastructure Health';
    if (pathname.startsWith('/admin/audit-log') || pathname.startsWith('/admin/audit')) return 'Admin Security Audit Trail';
    if (pathname.startsWith('/admin/settings')) return 'Admin Control Settings';
    return 'Admin Control Center';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950/90 text-slate-100 relative">
      {/* Background Liquid Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.12),transparent_50%)]" />

      {/* Persistent Liquid Glass Admin Sidebar */}
      <AdminSidebar onBackToApp={() => navigate('/')} />

      {/* Main Admin Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Header Bar */}
        <div className="px-6 md:px-8 pt-6 pb-2">
          <AdminHeader title={getPageTitle(location.pathname)} />
        </div>

        {/* E2EE Security Boundary Banner */}
        <div className="px-6 md:px-8 py-2">
          <LiquidGlassCard depth={1} className="p-3 bg-emerald-950/20 border-emerald-500/25 flex items-center gap-3">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px] text-slate-300">
              <strong className="text-emerald-300 font-semibold">Cryptographic Boundary:</strong> Admin permissions operate on account governance only. E2EE user chats and private keys are never accessible to administrator APIs.
            </div>
          </LiquidGlassCard>
        </div>

        {/* Protected Outlet Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <React.Suspense
            fallback={
              <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                <span>Loading Admin Section...</span>
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

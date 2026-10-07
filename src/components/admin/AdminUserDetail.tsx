import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import {
  User as UserIcon,
  Shield,
  Clock,
  AlertTriangle,
  MessageSquare,
  Activity,
  ArrowLeft,
  UserX,
  Trash2,
  Lock,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export const AdminUserDetail: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();

  const [userData, setUserData] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [moderationHistory, setModerationHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'moderation'>('profile');

  // Modals
  const [actionType, setActionType] = useState<'warn' | 'suspend' | 'block' | 'delete' | 'role' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('24h');
  const [selectedRole, setSelectedRole] = useState('user');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (uid) fetchUserDetail();
  }, [uid]);

  const fetchUserDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${currentAdmin?.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setReports(data.reports || []);
        setWarnings(data.warnings || []);
        setModerationHistory(data.moderationHistory || []);
        if (data.user?.role) setSelectedRole(data.user.role);
      }
    } catch (e) {
      console.error('Fetch user detail error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionType || !uid) return;
    setIsExecuting(true);

    try {
      let url = '';
      let method = 'POST';
      let body: any = {};

      if (actionType === 'warn') {
        url = `/api/admin/users/${uid}/warn`;
        body = { reason: actionReason };
      } else if (actionType === 'suspend') {
        url = `/api/admin/users/${uid}/suspend`;
        body = { reason: actionReason, duration: actionDuration };
      } else if (actionType === 'block') {
        url = `/api/admin/users/${uid}/block`;
        body = { reason: actionReason };
      } else if (actionType === 'delete') {
        url = `/api/admin/users/${uid}`;
        method = 'DELETE';
        body = { reason: actionReason };
      } else if (actionType === 'role') {
        url = `/api/admin/users/${uid}/role`;
        body = { role: selectedRole };
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentAdmin?.id}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setActionType(null);
        setActionReason('');
        if (actionType === 'delete') {
          navigate('/admin/users');
        } else {
          fetchUserDetail();
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch (e: any) {
      alert(e?.message || 'Server action failed');
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <span className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
        <span>Loading user record for UID {uid}...</span>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-sm font-bold text-rose-300">User account not found.</div>
        <LiquidGlassButton variant="secondary" size="sm" onClick={() => navigate('/admin/users')}>
          Back to Users
        </LiquidGlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{userData.displayName}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                userData.status === 'suspended' ? 'bg-amber-500/20 text-amber-300' :
                userData.status === 'blocked' ? 'bg-rose-500/20 text-rose-300' :
                'bg-emerald-500/20 text-emerald-300'
              }`}>
                {userData.status || 'active'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              UID: {userData.id} · @{userData.username} · {userData.email}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActionType('warn')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
          >
            Issue Warning
          </button>

          <button
            onClick={() => setActionType('suspend')}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer"
          >
            Suspend User
          </button>

          {currentAdmin?.role === 'super_admin' && (
            <button
              onClick={() => setActionType('role')}
              className="px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-xs font-bold cursor-pointer"
            >
              Change Role
            </button>
          )}

          <button
            onClick={() => setActionType('delete')}
            className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs cursor-pointer"
            title="Delete Account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        {[
          { id: 'profile', label: 'User Profile' },
          { id: 'activity', label: 'Platform Activity' },
          { id: 'moderation', label: `Moderation (${reports.length} Reports, ${warnings.length} Warnings)` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-rose-500/25 text-white border border-rose-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LiquidGlassCard depth={2} className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider border-b border-white/10 pb-2">
              Identity Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Display Name:</span>
                <span className="font-bold text-white">{userData.displayName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono text-cyan-300">@{userData.username}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-200">{userData.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Firebase UID:</span>
                <span className="font-mono text-xs text-rose-300">{userData.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Gender & Birth Year:</span>
                <span className="text-slate-200">{userData.gender}, {userData.birthYear}</span>
              </div>
            </div>
          </LiquidGlassCard>

          <LiquidGlassCard depth={2} className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider border-b border-white/10 pb-2">
              Account Status & Authorization
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Current Role:</span>
                <span className="font-mono font-bold text-violet-300 uppercase">{userData.role || 'user'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Account Status:</span>
                <span className="font-bold text-emerald-300 uppercase">{userData.status || 'active'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Joined Date:</span>
                <span className="font-mono text-slate-300">{new Date(userData.createdAt || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Onboarding Completed:</span>
                <span className="text-emerald-400">{userData.onboardingCompleted ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </LiquidGlassCard>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <LiquidGlassCard depth={2} className="p-5 space-y-4">
          <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider border-b border-white/10 pb-2">
            Recent Session Activity
          </h3>
          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>· Registered on {new Date(userData.createdAt || Date.now()).toLocaleDateString()}</p>
            <p>· Active in encrypted private chats and music rooms</p>
            <p>· Preferred Music Vibe Interests: {(userData.musicInterests || []).join(', ')}</p>
          </div>
        </LiquidGlassCard>
      )}

      {/* Moderation Tab */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {/* Reports Against User */}
          <LiquidGlassCard depth={2} className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider border-b border-white/10 pb-2">
              Reports Filed Against User ({reports.length})
            </h3>
            {reports.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">No reports filed against this user.</div>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>Reason: {r.reason}</span>
                      <span className="text-[10px] text-amber-300 uppercase font-mono">{r.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{r.details || 'No additional details provided'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Reported on {new Date(r.createdAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </LiquidGlassCard>

          {/* Audit History */}
          <LiquidGlassCard depth={2} className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-white/10 pb-2">
              Moderation History ({moderationHistory.length})
            </h3>
            {moderationHistory.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">No prior moderation history.</div>
            ) : (
              <div className="space-y-2">
                {moderationHistory.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-rose-300 font-mono">{m.action}</div>
                      <div className="text-[11px] text-slate-300">{m.reason}</div>
                      <div className="text-[10px] text-slate-500">by {m.adminEmail}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(m.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </LiquidGlassCard>
        </div>
      )}

      {/* Action Modal */}
      {actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-2xl">
          <LiquidGlassCard depth={4} glow={true} className="max-w-md w-full p-6 space-y-5 border-rose-500/30">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white uppercase tracking-tight">
                {actionType === 'warn' && 'Warn User'}
                {actionType === 'suspend' && 'Suspend User'}
                {actionType === 'block' && 'Block User'}
                {actionType === 'delete' && 'Permanently Delete User Account'}
                {actionType === 'role' && 'Alter User Role'}
              </h3>
              <p className="text-xs text-slate-300">
                Executing action on <strong className="text-rose-300">{userData.displayName}</strong>
              </p>
            </div>

            {actionType === 'suspend' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</label>
                <select
                  value={actionDuration}
                  onChange={(e) => setActionDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl p-2 text-xs text-slate-100"
                >
                  <option value="1h">1 Hour</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="permanent">Permanent Suspension</option>
                </select>
              </div>
            )}

            {actionType === 'role' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl p-2 text-xs text-slate-100"
                >
                  <option value="user">User</option>
                  <option value="support">Support</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason / Admin Note</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter mandatory reason..."
                className="w-full bg-white/[0.05] border border-white/15 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-400 h-20"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <LiquidGlassButton
                variant="primary"
                size="md"
                glow={true}
                onClick={handleExecuteAction}
                className="flex-1 text-xs font-bold"
              >
                {isExecuting ? 'Executing...' : 'Confirm Action'}
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="secondary"
                size="md"
                onClick={() => setActionType(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </LiquidGlassButton>
            </div>
          </LiquidGlassCard>
        </div>
      )}
    </div>
  );
};

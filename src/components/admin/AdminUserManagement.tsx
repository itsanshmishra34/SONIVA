import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import {
  Search,
  Filter,
  Users,
  ShieldCheck,
  AlertTriangle,
  UserX,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  MoreHorizontal
} from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Selected action modal target
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [actionMode, setActionMode] = useState<'warn' | 'suspend' | 'block' | 'delete' | 'role' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('24h');
  const [newRole, setNewRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, roleFilter, page]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const url = `/api/admin/users?q=${encodeURIComponent(search)}&status=${statusFilter}&role=${roleFilter}&page=${page}&limit=15`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${currentAdmin?.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!targetUser || !actionMode) return;
    setIsSubmitting(true);

    try {
      let url = '';
      let method = 'POST';
      let body: any = {};

      if (actionMode === 'warn') {
        url = `/api/admin/users/${targetUser.id}/warn`;
        body = { reason: actionReason };
      } else if (actionMode === 'suspend') {
        url = `/api/admin/users/${targetUser.id}/suspend`;
        body = { reason: actionReason, duration: actionDuration };
      } else if (actionMode === 'block') {
        url = `/api/admin/users/${targetUser.id}/block`;
        body = { reason: actionReason };
      } else if (actionMode === 'delete') {
        url = `/api/admin/users/${targetUser.id}`;
        method = 'DELETE';
        body = { reason: actionReason };
      } else if (actionMode === 'role') {
        url = `/api/admin/users/${targetUser.id}/role`;
        body = { role: newRole };
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
        setTargetUser(null);
        setActionMode(null);
        setActionReason('');
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch (e: any) {
      alert(e?.message || 'Server action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, username or UID..."
            className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-rose-400"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-rose-400"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="support">Support</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <LiquidGlassCard depth={3} className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
            <span>Retrieving user accounts...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 space-y-2">
            <div>No accounts found matching search criteria.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/[0.04] text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5 pl-5">User Profile</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-3.5 pl-5">
                      <div
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                          {u.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-rose-300 transition-colors">
                            {u.displayName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">@{u.username} · {u.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-300">{u.email}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                        (u.role as string) === 'super_admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        (u.role as string) === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        (u.role as string) === 'co_owner' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' :
                        'bg-white/10 text-slate-300'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        (u.status as string) === 'suspended' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        (u.status as string) === 'banned' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400 font-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="View User Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => {
                            setTargetUser(u);
                            setActionMode('warn');
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-pointer"
                        >
                          Warn
                        </button>

                        <button
                          onClick={() => {
                            setTargetUser(u);
                            setActionMode('suspend');
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold cursor-pointer"
                        >
                          Suspend
                        </button>

                        <button
                          onClick={() => {
                            setTargetUser(u);
                            setActionMode('delete');
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{users.length}</strong> of <strong className="text-white">{totalCount}</strong> users
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Action Modal */}
      {targetUser && actionMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl">
          <LiquidGlassCard depth={4} glow={true} className="max-w-md w-full p-6 space-y-5 border-rose-500/30">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white uppercase tracking-tight">
                {actionMode === 'warn' && 'Warn User'}
                {actionMode === 'suspend' && 'Suspend User Account'}
                {actionMode === 'block' && 'Block User Account'}
                {actionMode === 'delete' && 'Permanently Delete User Account'}
                {actionMode === 'role' && 'Alter User Role'}
              </h3>
              <p className="text-xs text-slate-300">
                Target: <strong className="text-rose-300">{targetUser.displayName}</strong> ({targetUser.email})
              </p>
            </div>

            {actionMode === 'suspend' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suspension Duration</label>
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

            {actionMode === 'role' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assign Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
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
                placeholder="Enter mandatory reason for this moderation action..."
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
                {isSubmitting ? 'Executing...' : 'Confirm Action'}
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="secondary"
                size="md"
                onClick={() => {
                  setTargetUser(null);
                  setActionMode(null);
                }}
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

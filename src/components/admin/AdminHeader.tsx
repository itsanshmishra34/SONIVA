import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, ShieldCheck, Lock, Bell, RefreshCw, X, User as UserIcon, AlertTriangle, MessageSquare, FileText } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  onRefresh?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, onRefresh }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${user?.id}` }
      });
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (e) {
      console.error('Admin search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="space-y-4 pb-4 border-b border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Role Badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-white tracking-tight uppercase">{title}</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase font-mono">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
        </div>

        {/* Top Actions & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl justify-end">
          {/* Global Search Bar */}
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Global Admin Search (users, reports, logs...)"
              className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Global Search Results Dropdown */}
            {searchResults && (
              <div className="absolute left-0 right-0 top-11 z-50 p-4 rounded-2xl bg-slate-950/95 border border-white/20 shadow-2xl space-y-3 max-h-96 overflow-y-auto backdrop-blur-3xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] font-bold text-slate-400 uppercase">
                  <span>Search Results for "{searchQuery}"</span>
                  <button onClick={() => setSearchResults(null)} className="hover:text-white"><X className="w-3.5 h-3.5" /></button>
                </div>

                {/* Users */}
                {searchResults.users?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> Users ({searchResults.users.length})
                    </div>
                    {searchResults.users.slice(0, 3).map((u: any) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          navigate(`/admin/users/${u.id}`);
                          setSearchResults(null);
                        }}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{u.displayName}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-cyan-300">{u.status || 'active'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reports */}
                {searchResults.reports?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Reports ({searchResults.reports.length})
                    </div>
                    {searchResults.reports.slice(0, 3).map((r: any) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          navigate('/admin/reports');
                          setSearchResults(null);
                        }}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 cursor-pointer text-xs"
                      >
                        <div className="font-bold text-white">{r.reason}</div>
                        <div className="text-[10px] text-slate-400">Target: {r.targetId}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audit Logs */}
                {searchResults.auditLogs?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-cyan-300 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Audit Logs ({searchResults.auditLogs.length})
                    </div>
                    {searchResults.auditLogs.slice(0, 3).map((l: any) => (
                      <div key={l.id} className="p-2 rounded-xl bg-white/[0.04] text-[11px] text-slate-300">
                        <span className="font-mono text-rose-300 font-bold">{l.action}</span> - {l.details}
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.users?.length === 0 && searchResults.reports?.length === 0 && searchResults.auditLogs?.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-4">
                    No admin records matched "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

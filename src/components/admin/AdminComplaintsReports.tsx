import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { AlertTriangle, MessageSquareWarning, Check, X, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

interface AdminComplaintsReportsProps {
  mode: 'reports' | 'complaints';
}

export const AdminComplaintsReports: React.FC<AdminComplaintsReportsProps> = ({ mode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Selected item for resolution
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('resolved');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [mode]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const endpoint = mode === 'reports' ? '/api/admin/reports' : '/api/admin/complaints';
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${user?.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.reports || data.complaints || []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      const endpoint = mode === 'reports'
        ? `/api/admin/reports/${selectedItem.id}`
        : `/api/admin/complaints/${selectedItem.id}`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.id}`
        },
        body: JSON.stringify({
          status: newStatus,
          resolutionNotes: notes,
          adminResponse: notes
        })
      });

      if (res.ok) {
        setSelectedItem(null);
        setNotes('');
        fetchItems();
      }
    } catch (e) {
      console.error('Update error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return (item.status || 'pending').toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-2">
          {mode === 'reports' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          ) : (
            <MessageSquareWarning className="w-5 h-5 text-amber-400" />
          )}
          <h2 className="text-sm font-extrabold text-white tracking-tight uppercase">
            {mode === 'reports' ? 'Abuse & Safety Reports' : 'User Complaints Queue'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-rose-400"
          >
            <option value="all">All Items</option>
            <option value="pending">Pending / New</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected / Dismissed</option>
          </select>
        </div>
      </div>

      {/* Moderation Items */}
      <LiquidGlassCard depth={3} className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
            <span>Retrieving queue items...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No {mode} matching selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-white/[0.03] transition-colors flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{item.reason || item.category || 'General Issue'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                      item.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      item.status === 'under_review' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      item.status === 'rejected' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.status || 'pending'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.details || item.message || 'No additional details provided.'}
                  </p>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Reporter: {item.reporterId || 'Anonymous'} · Target: {item.targetId || 'N/A'} · Created {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>

                <LiquidGlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setNewStatus(item.status || 'resolved');
                    setNotes(item.resolutionNotes || item.adminResponse || '');
                  }}
                  className="text-xs font-semibold"
                >
                  Manage & Resolve
                </LiquidGlassButton>
              </div>
            ))}
          </div>
        )}
      </LiquidGlassCard>

      {/* Resolution Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-2xl">
          <LiquidGlassCard depth={4} glow={true} className="max-w-md w-full p-6 space-y-5 border-amber-500/30">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white uppercase tracking-tight">Resolve Item #{selectedItem.id}</h3>
              <p className="text-xs text-slate-300">{selectedItem.reason || selectedItem.category}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Update Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-slate-900 border border-white/20 rounded-xl p-2 text-xs text-slate-100"
              >
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected / Dismissed</option>
                <option value="escalated">Escalated to Super Admin</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolution Notes / Response</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter internal moderation notes or resolution response..."
                className="w-full bg-white/[0.05] border border-white/15 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 h-20"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <LiquidGlassButton
                variant="primary"
                size="md"
                glow={true}
                onClick={handleUpdateStatus}
                className="flex-1 text-xs font-bold"
              >
                {isSubmitting ? 'Saving...' : 'Save Resolution'}
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="secondary"
                size="md"
                onClick={() => setSelectedItem(null)}
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

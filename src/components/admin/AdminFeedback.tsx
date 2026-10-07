import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

export const AdminFeedback: React.FC = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${user?.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback || []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedback = async (id: string, updates: any) => {
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.id}`
        },
        body: JSON.stringify(updates)
      });
      fetchFeedback();
    } catch (e) {
      console.error('Update error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">User Feedback Management</h2>
      {isLoading ? (
        <div className="text-slate-400">Loading...</div>
      ) : feedback.length === 0 ? (
        <div className="text-slate-400">No user feedback found.</div>
      ) : (
        <div className="grid gap-4">
          {feedback.map(item => (
            <LiquidGlassCard key={item.id} depth={2} className="p-4">
              <div className="flex justify-between">
                <div className="font-bold text-white">{item.userDisplayName || 'User'}</div>
                <div className="text-xs text-slate-300">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-xs text-slate-300 mt-2">{item.message}</div>
              <div className="flex gap-2 mt-4 items-center">
                <select 
                  value={item.status || 'new'}
                  onChange={(e) => updateFeedback(item.id, { status: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-white text-xs p-1 rounded"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button 
                  onClick={() => updateFeedback(item.id, { status: 'resolved' })}
                  className="bg-emerald-600 text-white text-xs px-2 py-1 rounded hover:bg-emerald-700"
                >
                  Resolve
                </button>
              </div>
            </LiquidGlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

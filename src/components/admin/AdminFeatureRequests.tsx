import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

export const AdminFeatureRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/feature-requests', {
        headers: { Authorization: `Bearer ${user?.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequest = async (id: string, updates: any) => {
    try {
      await fetch(`/api/admin/feature-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.id}`
        },
        body: JSON.stringify(updates)
      });
      fetchRequests();
    } catch (e) {
      console.error('Update error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Feature Requests Management</h2>
      {isLoading ? (
        <div className="text-slate-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-slate-400">No feature requests found.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <LiquidGlassCard key={req.id} depth={2} className="p-4">
              <div className="font-bold text-white">{req.title}</div>
              <div className="text-xs text-slate-300">{req.description}</div>
              <div className="flex gap-2 mt-4 items-center">
                <select 
                  value={req.status || 'submitted'}
                  onChange={(e) => updateRequest(req.id, { status: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-white text-xs p-1 rounded"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="planned">Planned</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>
            </LiquidGlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import axios from 'axios';
import { Save, User, Mail, Phone, Trash2, Clock } from 'lucide-react';

export default function ListingInterestManager({ listing, interest, onUpdated }) {
  const [status, setStatus] = useState(interest.status);
  const [adminNotes, setAdminNotes] = useState(interest.admin_notes || '');
  const [loading, setLoading] = useState(false);

  const statuses = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'introduced', label: 'Introduced' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleUpdate = async () => {
    setLoading(true);
    try {
      if (status !== interest.status) {
        await axios.post(`/api/admin/listings/${listing.id}/interests/${interest.id}/status`, { status });
      }
      if (adminNotes !== interest.admin_notes) {
        await axios.post(`/api/admin/listings/${listing.id}/interests/${interest.id}/notes`, { admin_notes: adminNotes });
      }
      onUpdated();
    } catch (err) {
      alert("Failed to update interest.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this interest?")) return;
    try {
      await axios.delete(`/api/admin/listings/${listing.id}/interests/${interest.id}`);
      onUpdated();
    } catch (err) {
      alert("Failed to delete interest.");
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'new': return 'text-sky-400 bg-sky-500/10';
      case 'contacted': return 'text-amber-400 bg-amber-500/10';
      case 'in_progress': return 'text-purple-400 bg-purple-500/10';
      case 'introduced': return 'text-emerald-400 bg-emerald-500/10';
      case 'rejected': 
      case 'cancelled': return 'text-rose-400 bg-rose-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-navy-950 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h4 className="font-bold text-white flex items-center gap-2">
              {interest.submitter_name}
              {interest.user_id && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">Registered</span>}
            </h4>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {interest.submitter_contact}</span>
              {interest.submitter_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {interest.submitter_email}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(interest.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`text-xs font-bold rounded-lg px-2 py-1.5 border border-white/10 appearance-none outline-none ${getStatusColor(status)}`}
          >
            {statuses.map(s => (
              <option key={s.value} value={s.value} className="bg-navy-900 text-white">{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {interest.message && (
        <div className="bg-navy-900/50 rounded-lg p-3 border border-white/5">
          <p className="text-sm text-slate-300 italic">"{interest.message}"</p>
        </div>
      )}

      {/* Admin Notes & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/5">
        <input 
          type="text" 
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal admin notes..."
          className="flex-1 bg-navy-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
        />
        <div className="flex items-center gap-2 shrink-0">
          {(status !== interest.status || adminNotes !== (interest.admin_notes || '')) && (
            <button 
              onClick={handleUpdate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-600 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          )}
          <button 
            onClick={handleDelete}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            title="Delete Interest"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import axios from 'axios';
import { X, UserPlus, AlertCircle } from 'lucide-react';

export default function ListingConversionModal({ isOpen, listing, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!window.confirm(`Are you sure you want to convert ${listing.listing_code} into a permanent user account?`)) return;

    setLoading(true);
    setError(null);

    try {
      await axios.post(`/api/admin/listings/${listing.id}/convert`, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Conversion failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-navy-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            Convert to Account
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h3 className="text-sm font-bold text-blue-400 mb-1">About Conversion</h3>
            <p className="text-xs text-slate-300">
              Converting this listing will create a permanent RaabtaNow user account. 
              The new user will be able to log in using the email and password provided below.
            </p>
            <p className="text-xs text-slate-300 mt-2 font-semibold">
              Listing: {listing.listing_code} ({listing.full_name})
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="convert-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New User Email</label>
              <input 
                type="email" 
                required 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
              <input 
                type="text" 
                required
                minLength={8}
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none" 
                placeholder="At least 8 characters"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-white/10 bg-navy-800/50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="convert-form"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
          >
            {loading ? 'Converting...' : 'Convert to Account'}
          </button>
        </div>

      </div>
    </div>
  );
}

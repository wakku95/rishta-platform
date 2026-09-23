import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, AlertCircle, CheckCircle } from 'lucide-react';
import { submitListingInterest } from '../../api/listings';
import useAuth from '../../hooks/useAuth';

export default function ExpressInterestModal({ isOpen, onClose, listing }) {
  const { user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    submitter_name: '',
    submitter_contact: '',
    submitter_email: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
      // Pre-fill if logged in
      if (isAuthenticated && user) {
        setFormData({
          submitter_name: user.name || '',
          submitter_contact: user.phone || user.contact_number || '', // depending on how user model stores it
          submitter_email: user.email || '',
          message: ''
        });
      } else {
        setFormData({
          submitter_name: '',
          submitter_contact: '',
          submitter_email: '',
          message: ''
        });
      }
    }
  }, [isOpen, isAuthenticated, user]);

  if (!isOpen || !listing) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitListingInterest(listing.listing_code, formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to submit interest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-navy-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-500" />
            Express Interest
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Interest Submitted</h3>
              <p className="text-slate-400 text-sm">
                Thank you. Our team will review your interest and contact you at <strong>{formData.submitter_contact}</strong> if it's a suitable match.
              </p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-navy-800 border border-white/10 text-white font-bold rounded-xl hover:bg-navy-700 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-sm text-slate-300">
                  You are expressing interest in listing <strong className="text-amber-500">{listing.listing_code}</strong>. 
                  Please provide your contact details so our matchmaking team can reach out to you.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="interest-form" onSubmit={handleSubmit} className="space-y-4">
                
                {isAuthenticated && (
                  <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg font-semibold flex items-center gap-2 mb-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Using your RaabtaNow account details.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    name="submitter_name"
                    required 
                    value={formData.submitter_name} 
                    onChange={handleChange} 
                    disabled={isAuthenticated}
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none disabled:opacity-70" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Number (WhatsApp) <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    name="submitter_contact"
                    required
                    placeholder="+923XXXXXXXXX"
                    value={formData.submitter_contact} 
                    onChange={handleChange} 
                    disabled={isAuthenticated && !!user?.phone} // Disable if they have a phone, otherwise let them enter it
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none disabled:opacity-70" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    name="submitter_email"
                    value={formData.submitter_email} 
                    onChange={handleChange} 
                    disabled={isAuthenticated}
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none disabled:opacity-70" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Message (Optional)</label>
                  <textarea 
                    name="message"
                    rows="3"
                    placeholder="Any specific details you'd like our team to know..."
                    value={formData.message} 
                    onChange={handleChange} 
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" 
                  ></textarea>
                </div>
              </form>
            </>
          )}
        </div>

        {!success && (
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
              form="interest-form"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Interest'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

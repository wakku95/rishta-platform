import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, CheckCircle, XCircle, Phone, 
  MessageSquare, UserPlus, Clock, ShieldCheck 
} from 'lucide-react';
import ListingInterestManager from './ListingInterestManager';

export default function AssistedListingDetailView({ listing, onClose, onUpdated }) {
  const [otpPhone, setOtpPhone] = useState(listing.contact_number || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');

  const [interestsData, setInterestsData] = useState(null);

  const fetchInterests = useCallback(async () => {
    try {
      const res = await axios.get(`/api/admin/listings/${listing.id}/interests`);
      setInterestsData(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [listing.id]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const mutateInterests = fetchInterests;

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpMessage('');
    setOtpError('');
    try {
      const res = await axios.post(`/api/admin/listings/${listing.id}/otp/send`, {
        contact_number: otpPhone
      });
      setOtpMessage(res.data.message);
      onUpdated(); // Refresh parent list silently to get new otp state
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setOtpMessage('');
    setOtpError('');
    try {
      const res = await axios.post(`/api/admin/listings/${listing.id}/otp/verify`, {
        otp: otpCode
      });
      setOtpMessage(res.data.message);
      onUpdated(); 
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to verify OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <button 
          onClick={onClose}
          className="p-2 rounded-xl bg-navy-800/80 border border-white/5 text-slate-400 hover:text-white hover:bg-navy-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Listing Detail: <span className="text-amber-400">{listing.listing_code}</span>
          </h2>
          <p className="text-sm text-slate-400">{listing.full_name}</p>
        </div>
        <div className="ml-auto">
           {listing.listing_status === 'published' && <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500/20 text-emerald-400">Published</span>}
           {listing.listing_status === 'draft' && <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-400">Draft</span>}
           {listing.listing_status === 'converted' && <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-500/20 text-blue-400">Converted</span>}
           {listing.listing_status === 'unpublished' && <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-500/20 text-slate-400">Unpublished</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Contact & Verification */}
        <div className="space-y-6">
          <div className="bg-navy-800/50 rounded-2xl border border-white/5 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              Contact & OTP Verification
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-navy-950 rounded-xl border border-white/5">
                <div>
                  <div className="text-xs text-slate-400">Current Contact</div>
                  <div className="text-sm font-semibold text-white">{listing.contact_number}</div>
                </div>
                {listing.contact_number_verified_at ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-1 rounded">
                    <XCircle className="w-3.5 h-3.5" /> Unverified
                  </span>
                )}
              </div>

              {!listing.contact_number_verified_at && listing.listing_status !== 'converted' && (
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-slate-400">Send an OTP via SMS to verify this contact number.</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      placeholder="+923XXXXXXXXX"
                      className="flex-1 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                    />
                    <button 
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="px-3 py-2 bg-amber-500 text-slate-950 rounded-lg text-sm font-bold hover:bg-amber-600 disabled:opacity-50"
                    >
                      Send OTP
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="flex-1 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                    />
                    <button 
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || !otpCode}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-600 disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                  
                  {otpMessage && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded">{otpMessage}</div>}
                  {otpError && <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded">{otpError}</div>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-navy-800/50 rounded-2xl border border-white/5 p-5 space-y-4">
             <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Private Details
            </h3>
            <div>
              <div className="text-xs text-slate-400">Family Background</div>
              <p className="text-sm text-slate-200 mt-1">{listing.family_background || 'N/A'}</p>
            </div>
            <div>
              <div className="text-xs text-slate-400">Admin Notes</div>
              <p className="text-sm text-slate-200 mt-1">{listing.admin_notes || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interests */}
        <div className="lg:col-span-2">
          <div className="bg-navy-800/50 rounded-2xl border border-white/5 h-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-navy-900/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Submitted Interests
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {!interestsData ? (
                <div className="text-center py-10 text-slate-500">Loading interests...</div>
              ) : interestsData.data.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                  </div>
                  No interests submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {interestsData.data.map(interest => (
                    <ListingInterestManager 
                      key={interest.id} 
                      listing={listing}
                      interest={interest} 
                      onUpdated={() => mutateInterests()}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

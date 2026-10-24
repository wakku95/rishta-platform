import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, CheckCircle, XCircle, Phone, 
  MessageSquare, UserPlus, Clock, ShieldCheck, GraduationCap 
} from 'lucide-react';
import ListingInterestManager from './ListingInterestManager';

export default function AssistedListingDetailView({ listing, onClose, onUpdated }) {
  const [currentListing, setCurrentListing] = useState(listing);
  const [otpPhone, setOtpPhone] = useState(listing.contact_number || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');

  const [docLoading, setDocLoading] = useState(false);
  const [docMessage, setDocMessage] = useState('');
  const [docError, setDocError] = useState('');

  useEffect(() => {
    setCurrentListing(listing);
    setOtpPhone(listing.contact_number || '');
  }, [listing]);

  const handleToggleDocVerification = async (type, verified) => {
    setDocLoading(true);
    setDocMessage('');
    setDocError('');
    try {
      const res = await axios.post(`/api/admin/listings/${currentListing.id}/verification`, {
        type,
        verified,
      });
      setDocMessage(res.data.message);
      setCurrentListing(res.data.data);
      if (onUpdated) onUpdated();
    } catch (err) {
      setDocError(err.response?.data?.message || 'Failed to update verification status.');
    } finally {
      setDocLoading(false);
    }
  };

  const [interestsData, setInterestsData] = useState(null);
  const [interestFilter, setInterestFilter] = useState('all'); // 'all' | 'awaiting_reply'

  const fetchInterests = useCallback(async () => {
    try {
      const params = interestFilter === 'awaiting_reply' ? { awaiting_admin: 1 } : {};
      const res = await axios.get(`/api/admin/listings/${listing.id}/interests`, { params });
      setInterestsData(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [listing.id, interestFilter]);

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
                  <div className="text-sm font-semibold text-white">{currentListing.contact_number}</div>
                </div>
                {currentListing.contact_number_verified_at ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-1 rounded">
                    <XCircle className="w-3.5 h-3.5" /> Unverified
                  </span>
                )}
              </div>

              {!currentListing.contact_number_verified_at && currentListing.listing_status !== 'converted' && (
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

          {/* Document Verifications (CNIC & Education) */}
          <div className="bg-navy-800/50 rounded-2xl border border-white/5 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Document Verification (Badges)
              </span>
              {docLoading && (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
              )}
            </h3>

            {docMessage && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded">{docMessage}</div>}
            {docError && <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded">{docError}</div>}

            {/* CNIC / Identity */}
            <div className="p-3 bg-navy-950 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    CNIC / Identity Verification
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {currentListing.is_identity_verified ? (
                      <span className="text-emerald-400 font-medium">
                        ✓ Verified {currentListing.identity_verified_at ? `(${new Date(currentListing.identity_verified_at).toLocaleDateString()})` : ''}
                      </span>
                    ) : (
                      <span>Not submitted / Unverified</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={docLoading}
                  onClick={() => handleToggleDocVerification('identity', !currentListing.is_identity_verified)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition disabled:opacity-50 shrink-0 ${
                    currentListing.is_identity_verified
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-sm'
                  }`}
                >
                  {currentListing.is_identity_verified ? 'Remove' : 'Mark ID Submitted'}
                </button>
              </div>
            </div>

            {/* Education Degree */}
            <div className="p-3 bg-navy-950 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    Education Degree Verification
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {currentListing.is_education_verified ? (
                      <span className="text-purple-300 font-medium">
                        ✓ Verified {currentListing.education_verified_at ? `(${new Date(currentListing.education_verified_at).toLocaleDateString()})` : ''}
                      </span>
                    ) : (
                      <span>Not submitted / Unverified</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={docLoading}
                  onClick={() => handleToggleDocVerification('education', !currentListing.is_education_verified)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition disabled:opacity-50 shrink-0 ${
                    currentListing.is_education_verified
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                  }`}
                >
                  {currentListing.is_education_verified ? 'Remove' : 'Mark Edu Submitted'}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic leading-snug">
              Verified items display public badges ("ID Submitted", "Education Submitted") on search cards and detail pages.
            </p>
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
            <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-navy-900/50 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Submitted Interests
              </h3>
              <div className="flex items-center gap-1.5 bg-navy-950 p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setInterestFilter('all')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                    interestFilter === 'all' 
                      ? 'bg-navy-800 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setInterestFilter('awaiting_reply')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    interestFilter === 'awaiting_reply' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow' 
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  User Replied
                </button>
              </div>
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

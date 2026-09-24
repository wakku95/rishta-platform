import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicAssistedListing } from '../../api/listings';
import { ArrowLeft, User, MapPin, Briefcase, GraduationCap, Ruler, HeartHandshake, AlertCircle } from 'lucide-react';
import ExpressInterestModal from './ExpressInterestModal';

export default function AssistedListingDetailPage() {
  const { listingCode } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await getPublicAssistedListing(listingCode);
        setListing(res.data);
      } catch (err) {
        setError("Listing not found or is no longer available.");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [listingCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 pb-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
          <span className="text-slate-400 font-medium">Loading details...</span>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen pt-16 pb-20 max-w-3xl mx-auto px-4">
        <div className="bg-navy-800 border border-slate-750 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Listing Not Found</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link to="/search" className="text-amber-500 hover:text-amber-400 font-semibold underline">
            Return to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-20 bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Back Link */}
        <Link 
          to="/search" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>

        {/* Disclaimer */}
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-500 font-medium">
            <strong className="font-bold">Important:</strong> This is an assisted listing managed through RaabtaNow. Information provided by the profile owner may not have been independently verified by RaabtaNow. Please independently verify the person's identity and other important information during your first contact before sharing sensitive information, sending money, or proceeding further.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-navy-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
          
          <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-black px-4 py-1.5 uppercase tracking-wider rounded-bl-xl z-10 shadow-sm">
            Assisted Listing
          </div>

          {/* Header */}
          <div className="p-8 sm:p-10 bg-gradient-to-br from-navy-800 to-navy-900 border-b border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-2xl bg-navy-950 flex items-center justify-center border-2 border-white/10 shrink-0 shadow-xl shadow-black/40">
              <User className="w-10 h-10 text-slate-600" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight mb-2 font-serif">
                {listing.gender === 'male' ? 'Male' : 'Female'} ({listing.age} yrs)
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-semibold text-slate-300">
                <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10">Ref: {listing.listing_code}</span>
                <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 capitalize">{listing.marital_status?.replace('_', ' ')}</span>
                <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10">{listing.religion} {listing.sect ? `(${listing.sect})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-8 sm:p-10 space-y-10">
            
            {/* About */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-500" />
                About
              </h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                {listing.public_about}
              </p>
            </div>

            {/* Grid Stats */}
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-navy-950 border border-white/5 rounded-xl">
                  <MapPin className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-400">City</div>
                    <div className="font-semibold text-white">{listing.city}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-navy-950 border border-white/5 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-400">Education</div>
                    <div className="font-semibold text-white">{listing.education}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-navy-950 border border-white/5 rounded-xl">
                  <Briefcase className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-400">Profession</div>
                    <div className="font-semibold text-white">{listing.profession}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-navy-950 border border-white/5 rounded-xl">
                  <Ruler className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-400">Height</div>
                    <div className="font-semibold text-white">{listing.height} cm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Managed By */}
            <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 p-4 rounded-xl">
              <span className="font-semibold">Listing Managed By:</span> 
              <span className="text-white capitalize">{listing.managed_by}</span>
            </div>

          </div>

          {/* Bottom Action Bar */}
          <div className="p-6 sm:p-8 bg-navy-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-lg">Interested in this profile?</h4>
              <p className="text-sm text-slate-400">Submit your details and our team will connect you.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              Express Interest
            </button>
          </div>

        </div>

      </div>

      <ExpressInterestModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listing={listing}
      />
    </div>
  );
}

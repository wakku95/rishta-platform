import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import VerificationSection from '../../components/profile/VerificationSection';
import SEOHead from '../../components/seo/SEOHead';

export default function VerificationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <SEOHead title="Identity Verification — RaabtaNow" />

      {/* Header with back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-magenta-400" />
            <span>Identity & Trust Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit your government CNIC and live selfie to earn the Green Verified Trust Badge.
          </p>
        </div>
      </div>

      {/* Main Verification Section */}
      <VerificationSection />
    </div>
  );
}

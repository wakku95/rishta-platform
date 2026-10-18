import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, Lock, ArrowRight, UserCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { shareProposalNic } from '../../api/requests';

export default function CnicTrustModal({ isOpen, onClose, request, onSuccess }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen || !request) return null;

  const candidate = request.candidate_profile;

  const handleShareMyNic = async () => {
    setSharing(true);
    setError(null);
    try {
      const res = await shareProposalNic(request.request_code);
      setSuccessMsg('Your verified CNIC status has been shared with candidate.');
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share verification status.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CNIC Trust & Identity Verification / شناختی کارڈ تصدیق"
      size="md"
    >
      <div className="space-y-4">
        {/* Privacy Shield Notice */}
        <div className="p-3 bg-gradient-to-r from-navy-900 to-navy-850 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>NADRA Verification Security:</strong> To protect personal privacy, raw CNIC card numbers or photos are never shared. Instead, official verification clearance certified by platform administration is shared.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Candidate's CNIC Verification Status */}
        <div className="p-4 bg-navy-950/80 border border-slate-750 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
            Candidate #{candidate?.profile_code} Identity Status
          </span>

          {request.candidate_nic_shared || request.candidate_is_identity_verified ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Government CNIC Verified Candidate</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pl-7 list-disc">
                <li>Pakistani Citizen Identity officially authenticated.</li>
                <li>Candidate age & marital identity matched with profile.</li>
                <li>Clearance audited by Rishta Platform Moderation team.</li>
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>
                {request.nic_requested_by_me 
                  ? 'CNIC verification requested from candidate. Awaiting candidate confirmation.' 
                  : 'Candidate has not shared their CNIC verification status yet.'}
              </span>
            </div>
          )}
        </div>

        {/* My CNIC Sharing Section */}
        <div className="p-4 bg-navy-950/80 border border-slate-750 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
            Your CNIC Verification Status
          </span>

          {request.my_nic_shared ? (
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>You have confirmed and shared your verified CNIC status with the candidate.</span>
            </div>
          ) : request.i_am_identity_verified ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">
                Your profile is verified. Would you like to share your verified status with candidate #{candidate?.profile_code}?
              </p>
              <Button
                size="sm"
                variant="primary"
                icon={UserCheck}
                loading={sharing}
                onClick={handleShareMyNic}
                className="font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Share My Verified Status
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-amber-300/90 leading-relaxed">
                You have not yet verified your CNIC with our platform. Complete identity verification to earn candidate trust.
              </p>
              <Link to="/verification">
                <Button size="sm" variant="secondary" icon={ArrowRight} className="text-xs">
                  Upload CNIC for Verification
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

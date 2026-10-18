import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Heart, MessageSquare, AlertCircle, HelpCircle, User, Sparkles, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import useAuth from '../../hooks/useAuth';
import { acceptRequest } from '../../api/requests';
import IdentityVerificationGateModal from '../verification/IdentityVerificationGateModal';

export default function AcceptProposalModal({ isOpen, onClose, request, onSuccess }) {
  const { user } = useAuth();
  const [receiverAnswers, setReceiverAnswers] = useState(request?.receiver_answers || '');
  const [receiverIntro, setReceiverIntro] = useState(request?.receiver_intro || '');
  const [receiverQuestions, setReceiverQuestions] = useState(request?.receiver_questions || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGate, setShowGate] = useState(false);

  if (!isOpen || !request) return null;

  const candidate = request.candidate_profile;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await acceptRequest(request.request_code, {
        receiver_answers: receiverAnswers.trim() || null,
        receiver_intro: receiverIntro.trim() || null,
        receiver_questions: receiverQuestions.trim() || null,
      });

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      const errData = err.response?.data;
      const errCode = errData?.error_code || errData?.error;
      const isIdentityReq = errCode === 'IDENTITY_VERIFICATION_REQUIRED'
        || errData?.errors?.identity_verified === false
        || errData?.message?.toLowerCase().includes('identity verification')
        || errData?.message?.toLowerCase().includes('cnic');

      if (isIdentityReq) {
        setError(errData?.message || 'Identity verification (CNIC + Live Selfie) is required before accepting a Rishta request.');
        setShowGate(true);
      } else {
        setError(errData?.message || 'Failed to accept proposal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accept Proposal & Respond / رشتہ تجویز قبول اور جواب"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Candidate Target Banner */}
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-navy-900 border border-emerald-500/30 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-sm text-white block">
              Candidate #{candidate?.profile_code} ({candidate?.age} yrs • {candidate?.city})
            </span>
            <span className="text-slate-300">
              {candidate?.education} • {candidate?.profession}
            </span>
          </div>
        </div>

        {/* Admin Revision Note */}
        {request.admin_status === 'needs_revision' && request.admin_notes && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
            <span className="font-bold block uppercase text-[10px] text-amber-400">Admin Revision Request / درکار ترمیم:</span>
            <p className="leading-relaxed">{request.admin_notes}</p>
          </div>
        )}

        {/* Display Sender's Received Questions or Intro if available */}
        {(request.sender_intro || request.sender_questions) && (
          <div className="space-y-2 p-3 bg-navy-950/70 border border-slate-700/80 rounded-xl text-xs">
            <span className="font-bold text-magenta-400 uppercase tracking-wider text-[10px] block">
              Candidate's Message & Questions:
            </span>
            {request.sender_intro && (
              <div>
                <p className="text-[11px] text-slate-400 font-semibold mb-0.5">About Candidate & Family:</p>
                <p className="text-slate-200 bg-navy-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed italic">
                  "{request.sender_intro}"
                </p>
              </div>
            )}
            {request.sender_questions && (
              <div>
                <p className="text-[11px] text-cyan-400 font-semibold mb-0.5">Questions asked by Candidate:</p>
                <p className="text-slate-200 bg-navy-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed italic">
                  "{request.sender_questions}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Proactive Verification Notice if user is unverified */}
        {user && user.is_identity_verified === false && (
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Identity Verification (CNIC + Live Selfie) is required before accepting proposals.</span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowGate(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shrink-0"
            >
              Verify Now / تصدیق کریں
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            {(error.toLowerCase().includes('identity') || error.toLowerCase().includes('cnic')) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-500/20">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowGate(true)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-xs shadow-md"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  Verify CNIC & Live Selfie Now / شناختی کارڈ کی تصدیق کریں
                </Button>
                <Link
                  to="/profile"
                  target="_blank"
                  className="text-[11px] text-cyan-300 hover:underline"
                >
                  Go to Profile Verification Section
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Input 1: Answers to Candidate's questions */}
        {request.sender_questions && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Your answers to candidate's questions:</span>
              <span className="font-urdu font-normal text-slate-300 mr-auto text-[11px]">(امیدوار کے سوالات کے جوابات)</span>
            </label>
            <textarea
              rows={2}
              value={receiverAnswers}
              onChange={(e) => setReceiverAnswers(e.target.value)}
              maxLength={2500}
              placeholder="Provide answers to the questions asked above..."
              className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>
        )}

        {/* Input 2: Share about yourself */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-magenta-400" />
            <span>2. What would you like to share about yourself & family?</span>
            <span className="font-urdu font-normal text-slate-300 mr-auto text-[11px]">(اپنے اور فیملی کے بارے میں مزید)</span>
          </label>
          <textarea
            rows={2}
            value={receiverIntro}
            onChange={(e) => setReceiverIntro(e.target.value)}
            maxLength={2500}
            placeholder="Share details you want the candidate to know regarding your preferences or family..."
            className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500 leading-relaxed"
          />
        </div>

        {/* Input 3: Counter Questions */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. Questions for the candidate (Counter-Questions):</span>
            <span className="font-urdu font-normal text-slate-300 mr-auto text-[11px]">(امیدوار سے آپ کیا پوچھنا چاہتے ہیں؟)</span>
          </label>
          <textarea
            rows={2}
            value={receiverQuestions}
            onChange={(e) => setReceiverQuestions(e.target.value)}
            maxLength={2500}
            placeholder="Ask questions you want clarified before proceeding to photo or contact exchange..."
            className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel / منسوخ
          </Button>
          <Button
            type="submit"
            variant="success"
            size="sm"
            icon={CheckCircle}
            loading={loading}
            className="font-bold shadow-md shadow-emerald-500/20"
          >
            Confirm & Accept Proposal / قبول کریں
          </Button>
        </div>
      </form>
    </Modal>

    {showGate && (
      <IdentityVerificationGateModal
        isOpen={showGate}
        onClose={() => setShowGate(false)}
        actionType="accept"
        onVerified={() => {
          setShowGate(false);
          handleSubmit(new Event('submit'));
        }}
      />
    )}
    </>
  );
}

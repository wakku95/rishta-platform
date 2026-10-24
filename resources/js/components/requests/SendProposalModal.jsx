import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Heart, ShieldCheck, AlertCircle, Sparkles, HelpCircle, User } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import useAuth from '../../hooks/useAuth';
import { sendRishtaRequest } from '../../api/requests';
import IdentityVerificationGateModal from '../verification/IdentityVerificationGateModal';

export default function SendProposalModal({ isOpen, onClose, candidate, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const [senderIntro, setSenderIntro] = useState('');
  const [senderQuestions, setSenderQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGate, setShowGate] = useState(false);

  React.useEffect(() => {
    if (isOpen && user && !user.is_identity_verified && refreshUser) {
      refreshUser();
    }
  }, [isOpen]);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await sendRishtaRequest({
        profile_code: candidate.profile_code,
        sender_intro: senderIntro.trim() || null,
        sender_questions: senderQuestions.trim() || null,
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
        setError(errData?.message || 'Identity verification (CNIC + Live Selfie) is required before sending a Rishta request.');
        setShowGate(true);
      } else {
        setError(errData?.message || 'Failed to submit proposal. Please try again.');
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
      title="Send Formal Proposal / رشتہ تجویز بھیجیں"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Candidate Target Banner */}
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-magenta-950/40 via-purple-950/30 to-navy-900 border border-magenta-500/30 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-magenta-500/20 text-magenta-300 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-magenta-500/40" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-sm text-white block">
              Candidate #{candidate.profile_code} ({candidate.age} yrs • {candidate.city})
            </span>
            <span className="text-slate-300">
              {candidate.education} • {candidate.profession}
            </span>
          </div>
        </div>

        {/* Admin Moderation Notice */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Admin Review & Privacy Assurance / ایڈمن جائزہ اور پرائیویسی</span>
          </div>
          <p className="text-slate-300 leading-relaxed pl-5 text-[11px]">
            Your proposal details and questions will be reviewed by the RaabtaNow administration team before being delivered to ensure respectful communication and privacy.
          </p>
          <p className="text-amber-200/80 leading-normal pl-5 font-urdu text-right text-[11px]" dir="rtl">
            آپ کے سوالات اور تفصیلات ایڈمن کے جائزے کے بعد امیدوار کو پہنچائی جائیں گی تاکہ شائستگی اور پرائیویسی برقرار رہے۔
          </p>
        </div>

        {/* Proactive Verification Notice if user is unverified */}
        {user && user.is_identity_verified === false && (
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Identity Verification (CNIC + Live Selfie) is required to deliver proposals.</span>
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

        {/* Input 1: Tell about yourself */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-magenta-400" />
            <span>1. What would you like to share about yourself & family?</span>
            <span className="font-urdu font-normal text-slate-300 mr-auto text-[11px]">(اپنے اور فیملی کے بارے میں)</span>
          </label>
          <textarea
            rows={3}
            value={senderIntro}
            onChange={(e) => setSenderIntro(e.target.value)}
            maxLength={2500}
            placeholder="Share details about your education, job/profession, family background, lifestyle, or partner preferences..."
            className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500 leading-relaxed"
          />
          <div className="flex justify-between text-[10px] text-slate-500 px-1">
            <span>Optional but recommended to increase response rate</span>
            <span>{senderIntro.length}/2500</span>
          </div>
        </div>

        {/* Input 2: What do you want to know */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. What would you like to know from the candidate?</span>
            <span className="font-urdu font-normal text-slate-300 mr-auto text-[11px]">(امیدوار سے آپ کیا پوچھنا چاہتے ہیں؟)</span>
          </label>
          <textarea
            rows={3}
            value={senderQuestions}
            onChange={(e) => setSenderQuestions(e.target.value)}
            maxLength={2500}
            placeholder="Ask specific questions regarding career aspirations, city relocation, religious practice, family values..."
            className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
          />
          <div className="flex justify-between text-[10px] text-slate-500 px-1">
            <span>Specific, respectful questions receive faster replies</span>
            <span>{senderQuestions.length}/2500</span>
          </div>
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
            variant="primary"
            size="sm"
            icon={Send}
            loading={loading}
            className="font-bold shadow-md shadow-magenta-500/20"
          >
            Submit Proposal / تجویز بھیجیں
          </Button>
        </div>
      </form>
    </Modal>

    {showGate && (
      <IdentityVerificationGateModal
        isOpen={showGate}
        onClose={async () => {
          setShowGate(false);
          if (refreshUser) await refreshUser();
        }}
        actionType="send"
        onVerified={async () => {
          setShowGate(false);
          if (refreshUser) await refreshUser();
          handleSubmit(new Event('submit'));
        }}
      />
    )}
    </>
  );
}

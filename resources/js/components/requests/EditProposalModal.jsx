import React, { useState } from 'react';
import { Send, AlertCircle, HelpCircle, User, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { editProposal } from '../../api/requests';

export default function EditProposalModal({ isOpen, onClose, request, onSuccess }) {
  const [senderIntro, setSenderIntro] = useState(request?.sender_intro || '');
  const [senderQuestions, setSenderQuestions] = useState(request?.sender_questions || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !request) return null;

  const candidate = request.candidate_profile;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!senderIntro.trim()) {
      setError('Please provide an introductory message for the candidate.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await editProposal(request.request_code, {
        sender_intro: senderIntro.trim(),
        sender_questions: senderQuestions.trim() || null,
      });

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit & Resubmit Proposal / تجویز میں ترمیم کریں"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Candidate Target Banner */}
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-magenta-950/40 via-purple-950/30 to-navy-900 border border-magenta-500/30 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-magenta-500/20 text-magenta-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-magenta-400" />
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

        {/* Admin Revision Request Note */}
        {request.admin_notes && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
            <span className="font-bold block uppercase text-[10px] text-amber-400">Admin Revision Request / درکار ترمیم:</span>
            <p className="leading-relaxed">{request.admin_notes}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Intro */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-magenta-400" />
            <span>Your Introduction & Family Background *</span>
          </label>
          <textarea
            rows="4"
            required
            value={senderIntro}
            onChange={(e) => setSenderIntro(e.target.value)}
            placeholder="Introduce yourself and your family background with dignity..."
            className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500"
          />
        </div>

        {/* Questions */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Questions for the Candidate (Optional)</span>
          </label>
          <textarea
            rows="3"
            value={senderQuestions}
            onChange={(e) => setSenderQuestions(e.target.value)}
            placeholder="Ask any respectful questions regarding values, lifestyle, or family preferences..."
            className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={Send}
            loading={loading}
            className="font-bold"
          >
            Resubmit for Review
          </Button>
        </div>
      </form>
    </Modal>
  );
}

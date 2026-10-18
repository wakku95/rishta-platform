import React, { useState } from 'react';
import { MessageSquare, AlertCircle, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { replyRequest } from '../../api/requests';

export default function ReplyProposalModal({ isOpen, onClose, request, onSuccess }) {
  const [senderAnswers, setSenderAnswers] = useState(request?.sender_answers || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !request) return null;

  const candidate = request.candidate_profile;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!senderAnswers.trim()) {
      setError('Please provide your answers to the candidate\'s questions.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await replyRequest(request.request_code, {
        sender_answers: senderAnswers.trim(),
      });

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit your answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Answer Candidate's Questions / امیدوار کے سوالات کا جواب"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Candidate Target Banner */}
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-navy-900 border border-cyan-500/30 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
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

        {/* Display Candidate's Answers & Counter-Questions */}
        <div className="space-y-2.5 p-3.5 bg-navy-950/80 border border-slate-700/80 rounded-xl text-xs">
          <span className="font-bold text-cyan-400 uppercase tracking-wider text-[10px] block">
            Candidate's Response:
          </span>

          {request.receiver_intro && (
            <div className="bg-navy-900/90 p-2.5 rounded-lg border border-slate-750">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Candidate's Intro:</span>
              <p className="text-slate-200 mt-0.5 italic">"{request.receiver_intro}"</p>
            </div>
          )}

          {request.receiver_answers && (
            <div className="bg-navy-900/90 p-2.5 rounded-lg border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">Answers to your previous questions:</span>
              <p className="text-slate-200 mt-0.5 italic">"{request.receiver_answers}"</p>
            </div>
          )}

          {request.receiver_questions && (
            <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-bold block uppercase flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Candidate's Questions for You (Please answer below):
              </span>
              <p className="text-amber-100 mt-0.5 font-medium leading-relaxed">"{request.receiver_questions}"</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Sender's Answers Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Your Answers to Candidate's Questions *</span>
          </label>
          <textarea
            rows="4"
            value={senderAnswers}
            onChange={(e) => setSenderAnswers(e.target.value)}
            placeholder="Type your sincere and clear answers here (e.g. regarding family, lifestyle, expectations)..."
            className="w-full text-xs rounded-xl bg-navy-900 border border-slate-700 p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            maxLength={2500}
            required
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Admin will review your response before delivery to ensure decency.</span>
            <span>{senderAnswers.length} / 2500</span>
          </div>
        </div>

        {/* Moderation Assurance Banner */}
        <div className="p-2.5 bg-blue-950/30 border border-blue-500/20 rounded-xl text-[11px] text-blue-200">
          💡 <strong>Safe & Dignified Matchmaking:</strong> Once your answers are approved by our moderation team, both parties can proceed to verified photo or contact exchange.
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-750">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={loading}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Submit Answers for Review
          </Button>
        </div>
      </form>
    </Modal>
  );
}

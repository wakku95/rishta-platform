import React, { useState } from 'react';
import { MessageSquare, AlertCircle, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { replyAssistedInquiry } from '../../api/requests';

export default function AssistedReplyModal({ isOpen, onClose, inquiry, onSuccess }) {
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !inquiry) return null;

  const listing = inquiry.listing;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setError('Please write your reply message.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await replyAssistedInquiry(inquiry.id, replyText.trim());
      setReplyText('');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit your reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reply to Matchmaker / اسسٹنٹ کوآرڈینیٹر کو جواب دیں"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Listing Banner */}
        {listing && (
          <div className="p-3 bg-navy-950/70 rounded-xl border border-white/5 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white block">Assisted Listing #{listing.listing_code}</span>
              <span className="text-slate-400">
                {[listing.age ? `${listing.age} yrs` : null, listing.gender, listing.city].filter(Boolean).join(' • ')}
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-navy-900 border border-white/10 text-slate-300">
              Inquiry #{inquiry.id}
            </span>
          </div>
        )}

        {/* Admin Coordinator's Message */}
        {inquiry.admin_message && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-purple-300 uppercase text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Matchmaker Message / کوآرڈینیٹر کا پیغام:</span>
            </div>
            <p className="text-purple-100 italic leading-relaxed pl-5">
              "{inquiry.admin_message}"
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Reply input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            Your Response / آپ کا جواب:
          </label>
          <textarea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply to the matchmaker coordinator regarding this proposal..."
            className="w-full bg-navy-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            maxLength={2000}
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Only 1 response can be sent until admin replies again.</span>
            <span>{replyText.length} / 2000</span>
          </div>
        </div>

        {/* One message rule alert */}
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-200 leading-relaxed">
          💡 <strong>Turn-based Communication:</strong> You can submit one message now. Once submitted, your response will be locked for the coordinator to review and answer.
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-750">
          <Button
            type="button"
            variant="ghost"
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
            isLoading={loading}
            className="font-bold bg-cyan-600 hover:bg-cyan-500"
          >
            Send Reply / جواب ارسال کریں
          </Button>
        </div>
      </form>
    </Modal>
  );
}

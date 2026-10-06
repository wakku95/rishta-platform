import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Copy, Check, ExternalLink, 
  MessageCircle, Clock, AlertTriangle, RefreshCw, FileText
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function AdminVerificationLinkModal({ isOpen, onClose, candidate }) {
  const [docType, setDocType] = useState('cnic');
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    if (isOpen && candidate) {
      generateLink('cnic');
    } else {
      setLinkData(null);
      setError(null);
      setCopiedLink(false);
      setCopiedMsg(false);
      setDocType('cnic');
    }
  }, [isOpen, candidate]);

  const generateLink = async (selectedType = docType) => {
    if (!candidate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.generateVerificationLink({
        candidate_type: candidate.type || (candidate.source === 'assisted' ? 'assisted' : 'profile'),
        candidate_id: candidate.id,
        document_type: selectedType,
      });
      setLinkData(res);
    } catch (err) {
      console.error('Failed to generate verification link:', err);
      setError(err.response?.data?.message || 'Failed to generate verification link.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocTypeChange = (e) => {
    const newType = e.target.value;
    setDocType(newType);
    generateLink(newType);
  };

  const handleCopyLink = () => {
    if (!linkData?.url) return;
    navigator.clipboard.writeText(linkData.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    if (!linkData?.whatsapp_message) return;
    navigator.clipboard.writeText(linkData.whatsapp_message);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!linkData) return;
    let phone = (linkData.phone || candidate?.phone || candidate?.contact_number || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '92' + phone.substring(1);
    }
    const text = encodeURIComponent(linkData.whatsapp_message);
    const waUrl = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidate Verification Link"
      subtitle={`Generate a secure magic link for #${candidate?.code || ''} to upload documents without login.`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Document Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center justify-between">
            <span>Select Document to Request</span>
            <span className="text-[11px] text-cyan-400 font-normal">Candidate will be asked for this</span>
          </label>
          <select
            value={docType}
            onChange={handleDocTypeChange}
            disabled={loading}
            className="w-full text-xs px-3 py-2 bg-navy-950 border border-slate-750 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="cnic">🪪 CNIC / National Identity Card</option>
            <option value="salary_slip">💼 Salary Slip / Income Proof</option>
            <option value="degree">🎓 Educational Degree / Certificate</option>
            <option value="other">📄 Other Supporting Document</option>
          </select>
        </div>

        {loading ? (
          <div className="py-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-semibold">Generating link for this document...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Error Generating Link</span>
            </div>
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => generateLink(docType)} className="text-xs">
              Try Again
            </Button>
          </div>
        ) : linkData ? (
          <div className="space-y-4">
            {/* Candidate Summary */}
            <div className="p-3 rounded-xl bg-navy-800/80 border border-white/5 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">#{linkData.candidate_code}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-bold uppercase border border-cyan-500/30">
                    {linkData.document_type || docType}
                  </span>
                </div>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  {linkData.candidate_name || 'Candidate'}
                </span>
              </div>
              <div className="text-right text-[11px] text-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Valid for 7 days</span>
              </div>
            </div>

            {/* Direct Link Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white">
                Verification Link (No login required)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={linkData.url}
                  className="w-full text-xs font-mono bg-navy-950/80 border border-white/10 rounded-xl px-3 py-2 text-slate-300 select-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0 text-xs text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1">{copiedLink ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            {/* WhatsApp Ready Message Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white">
                WhatsApp Ready Invitation Message
              </label>
              <textarea
                readOnly
                rows={4}
                value={linkData.whatsapp_message}
                className="w-full text-xs bg-navy-950/80 border border-white/10 rounded-xl p-3 text-slate-300 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMessage}
                className="justify-center text-xs font-semibold"
              >
                {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copiedMsg ? 'Message Copied!' : 'Copy Message'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenWhatsApp}
                className="justify-center text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

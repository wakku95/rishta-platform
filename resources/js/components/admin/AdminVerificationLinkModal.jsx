import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Copy, Check, ExternalLink, 
  MessageCircle, Clock, AlertTriangle, RefreshCw, FileText,
  UploadCloud, Sparkles, Camera, Image as ImageIcon
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AdminPhotoWatermarkModal from './AdminPhotoWatermarkModal';

export default function AdminVerificationLinkModal({ isOpen, onClose, candidate }) {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'direct_upload'
  const [docType, setDocType] = useState('photo');
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Direct upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Watermark Studio Modal state
  const [watermarkModalData, setWatermarkModalData] = useState(null);

  useEffect(() => {
    if (isOpen && candidate) {
      setDocType('photo');
      setActiveTab('link');
      generateLink('photo');
      resetUploadState();
    } else {
      setLinkData(null);
      setError(null);
      setCopiedLink(false);
      setCopiedMsg(false);
      resetUploadState();
    }
  }, [isOpen, candidate]);

  const resetUploadState = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadNotes('');
    setUploading(false);
    setUploadSuccess(null);
    setUploadError(null);
  };

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
    if (activeTab === 'link') {
      generateLink(newType);
    }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }
      setUploadFile(file);
      setUploadError(null);
      if (file.type.startsWith('image/')) {
        setUploadPreview(URL.createObjectURL(file));
      } else {
        setUploadPreview(null);
      }
    }
  };

  const handleDirectUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !candidate) {
      setUploadError('Please choose a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('candidate_type', candidate.type || (candidate.source === 'assisted' ? 'assisted' : 'profile'));
    formData.append('candidate_id', candidate.id);
    formData.append('document_type', docType);
    formData.append('file', uploadFile);
    if (uploadNotes.trim()) {
      formData.append('notes', uploadNotes.trim());
    }

    try {
      const res = await adminApi.directUploadVerificationDoc(formData);
      setUploadSuccess(res);
    } catch (err) {
      console.error('Failed to directly upload file:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Candidate Photo & Document Verification"
        subtitle={`Request verification magic link or directly attach document for #${candidate?.code || candidate?.profile_code || candidate?.listing_code || ''}.`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-navy-950 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'link'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔗 Send Magic Link</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('direct_upload')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'direct_upload'
                  ? 'bg-magenta-500/20 text-magenta-300 border border-magenta-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📥 Direct Upload (WhatsApp)</span>
            </button>
          </div>

          {/* Document Type Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span>Document / Requirement Type</span>
              <span className="text-[11px] text-cyan-400 font-normal">Select document type</span>
            </label>
            <select
              value={docType}
              onChange={handleDocTypeChange}
              disabled={loading || uploading}
              className="w-full text-xs px-3 py-2 bg-navy-950 border border-slate-750 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="photo">📸 Candidate Photo / Tasveer (Private)</option>
              <option value="cnic">🪪 CNIC / National Identity Card</option>
              <option value="salary_slip">💼 Salary Slip / Income Proof</option>
              <option value="degree">🎓 Educational Degree / Certificate</option>
              <option value="other">📄 Other Supporting Document</option>
            </select>
          </div>

          {/* TAB 1: MAGIC LINK MODE */}
          {activeTab === 'link' && (
            <>
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
                        {linkData.candidate_name || candidate?.name || 'Candidate'}
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
            </>
          )}

          {/* TAB 2: DIRECT ADMIN UPLOAD MODE */}
          {activeTab === 'direct_upload' && (
            <div className="space-y-4">
              {uploadSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Document / Photo Uploaded Successfully!</h4>
                    <p className="text-xs text-emerald-300 mt-1">
                      File saved in private storage and approved automatically.
                    </p>
                  </div>

                  {docType === 'photo' && uploadPreview && (
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setWatermarkModalData({
                          isOpen: true,
                          photoBlobUrl: uploadPreview,
                          candidateCode: candidate?.code || candidate?.profile_code || candidate?.listing_code || 'Candidate',
                          candidateName: candidate?.name || 'Candidate',
                        })}
                        className="w-full justify-center bg-gradient-to-r from-magenta-500 to-purple-600 hover:from-magenta-400 text-white font-bold text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Open Watermark Studio (Export Protected)
                      </Button>
                    </div>
                  )}

                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetUploadState}
                      className="w-full text-xs text-slate-400 hover:text-white"
                    >
                      Upload Another Document
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDirectUploadSubmit} className="space-y-4">
                  {uploadError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* File Upload Box */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white">
                      Choose Received File / Photo <span className="text-rose-400">*</span>
                    </label>

                    <label className="border-2 border-dashed border-white/15 hover:border-magenta-500/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-navy-900/60 hover:bg-navy-900/90 group">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {uploadPreview ? (
                        <div className="space-y-2 text-center">
                          <img 
                            src={uploadPreview} 
                            alt="Preview" 
                            className="max-h-40 rounded-lg mx-auto object-cover border border-white/10"
                          />
                          <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected: {uploadFile?.name} (Click to change)
                          </p>
                        </div>
                      ) : (
                        <div className="text-center space-y-1 py-3">
                          <Camera className="w-8 h-8 text-slate-500 group-hover:text-magenta-400 transition mx-auto" />
                          <p className="text-xs font-semibold text-slate-300">
                            {uploadFile ? uploadFile.name : 'Click to select photo / document received from customer'}
                          </p>
                          <p className="text-[10px] text-slate-500">JPG, PNG, WebP or PDF up to 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Internal Admin Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder="e.g. Received via WhatsApp from candidate's mother"
                      className="w-full text-xs rounded-xl bg-navy-950 border border-slate-750 text-white px-3 py-2 focus:border-magenta-500 focus:outline-none"
                    />
                  </div>

                  {/* Submit CTA */}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={uploading || !uploadFile}
                    className="w-full justify-center py-2.5 bg-gradient-to-r from-magenta-500 to-purple-600 hover:from-magenta-400 text-white font-bold text-xs shadow-lg shadow-magenta-500/20"
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading & Verifying...' : 'Upload & Approve Directly'}
                  </Button>
                </form>
              )}
            </div>
          )}

        </div>
      </Modal>

      {/* Watermark Studio Modal */}
      {watermarkModalData && (
        <AdminPhotoWatermarkModal
          isOpen={watermarkModalData.isOpen}
          onClose={() => setWatermarkModalData(null)}
          photoBlobUrl={watermarkModalData.photoBlobUrl}
          candidateCode={watermarkModalData.candidateCode}
          candidateName={watermarkModalData.candidateName}
        />
      )}
    </>
  );
}

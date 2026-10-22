import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, 
  Upload, FileText, AlertTriangle, X, RefreshCw, Eye
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import { verificationApi } from '../../api/verification';
import LiveSelfieCamera from '../verification/LiveSelfieCamera';

export default function VerificationSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [eduFile, setEduFile] = useState(null);
  const [eduLabel, setEduLabel] = useState('');
  const [formError, setFormError] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await verificationApi.getStatus();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verification status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!selfieFile) {
      setFormError('Live selfie or face photo is required. Please take a live photo or upload your photo above.');
      return;
    }
    if (!frontFile || !backFile) {
      setFormError('Please select both front and back CNIC document files.');
      return;
    }

    const formData = new FormData();
    formData.append('front', frontFile);
    formData.append('back', backFile);
    formData.append('live_selfie', selfieFile, selfieFile.name || 'live_selfie.jpg');

    setSubmitting(true);
    try {
      const res = await verificationApi.submitIdentity(formData);
      setSuccess(res.message);
      setIdentityModalOpen(false);
      setFrontFile(null);
      setBackFile(null);
      setSelfieFile(null);
      fetchStatus();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to upload identity documents.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!eduFile) {
      setFormError('Please select your degree or transcript document file.');
      return;
    }

    const formData = new FormData();
    formData.append('document', eduFile);
    if (eduLabel) {
      formData.append('label', eduLabel);
    }

    setSubmitting(true);
    try {
      const res = await verificationApi.submitEducation(formData);
      setSuccess(res.message);
      setEducationModalOpen(false);
      setEduFile(null);
      setEduLabel('');
      fetchStatus();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to upload education document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this pending verification request?')) return;
    try {
      const res = await verificationApi.withdraw(id);
      setSuccess(res.message);
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to withdraw.');
    }
  };

  if (loading && !data) {
    return (
      <Card className="p-6 bg-navy-800 border border-slate-750 shadow-md">
        <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-magenta-500" />
          <span>Loading verification status...</span>
        </div>
      </Card>
    );
  }

  const identity = data?.identity;
  const education = data?.education;

  const renderStatusBadge = (item) => {
    if (!item) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          Not Submitted
        </span>
      );
    }
    if (item.status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
        </span>
      );
    }
    if (item.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" /> Pending Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
        <AlertTriangle className="w-3.5 h-3.5" /> Rejected
      </span>
    );
  };

  return (
    <Card className="p-6 sm:p-8 bg-navy-800 border border-slate-750 shadow-md space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-750">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-magenta-500/15 border border-magenta-500/30 flex items-center justify-center text-magenta-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-extrabold text-white">
              Trust & Verification Badges
            </h2>
            <p className="text-xs text-slate-400">Optional credentials to elevate candidate trust and credibility</p>
          </div>
        </div>
      </div>

      {success && (
        <Alert variant="success" title="Success" className="border border-emerald-500/40">
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Notice" className="border border-rose-500/40">
          {error}
        </Alert>
      )}

      {/* Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identity Verification Card */}
        <div className="p-5 rounded-2xl bg-navy-850 border border-slate-750 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Identity (CNIC / NIC)</span>
              {renderStatusBadge(identity)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Confirm your identity with a secure CNIC submission. Documents are private and never shared publicly.
            </p>

            {identity?.status === 'rejected' && identity?.rejection_reason && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <strong>Reason:</strong> {identity.rejection_reason}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            {identity?.status === 'approved' ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                ✓ ID Submitted
              </span>
            ) : identity?.status === 'pending' ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-amber-300 font-medium">Under admin review</span>
                <button
                  type="button"
                  onClick={() => handleWithdraw(identity.id)}
                  className="text-xs text-slate-400 hover:text-rose-400 underline"
                >
                  Withdraw
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                icon={Upload}
                onClick={() => {
                  setFormError('');
                  setIdentityModalOpen(true);
                }}
              >
                {identity?.status === 'rejected' ? 'Re-submit CNIC' : 'Submit CNIC'}
              </Button>
            )}
          </div>
        </div>

        {/* Education Verification Card */}
        <div className="p-5 rounded-2xl bg-navy-855 border border-slate-750 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Education Credential</span>
              {renderStatusBadge(education)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Confirm your educational qualifications with a degree or transcript certificate.
            </p>

            {education?.status === 'rejected' && education?.rejection_reason && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <strong>Reason:</strong> {education.rejection_reason}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            {education?.status === 'approved' ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                ✓ Education Submitted
              </span>
            ) : education?.status === 'pending' ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-amber-300 font-medium">Under admin review</span>
                <button
                  type="button"
                  onClick={() => handleWithdraw(education.id)}
                  className="text-xs text-slate-400 hover:text-rose-400 underline"
                >
                  Withdraw
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                icon={Upload}
                onClick={() => {
                  setFormError('');
                  setEducationModalOpen(true);
                }}
              >
                {education?.status === 'rejected' ? 'Re-submit Degree' : 'Submit Degree'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Identity Submission Modal */}
      <Modal
        isOpen={identityModalOpen}
        onClose={() => setIdentityModalOpen(false)}
        maxWidth="max-w-2xl"
        title={
          <div className="flex items-center gap-2 text-white font-bold">
            <ShieldCheck className="w-5 h-5 text-magenta-400 shrink-0" />
            <span>Identity Verification: CNIC & Face Photo</span>
          </div>
        }
      >
        <form onSubmit={handleIdentitySubmit} className="space-y-4">
          {formError && (
            <Alert variant="danger" title="Notice" className="text-xs">
              {formError}
            </Alert>
          )}

          {/* Step 1: Live Selfie / Face Photo */}
          <div className="p-3 bg-navy-950/70 border border-slate-750 rounded-xl space-y-2">
            <LiveSelfieCamera
              onCapture={(blob) => setSelfieFile(blob)}
              onClear={() => setSelfieFile(null)}
            />
          </div>

          {/* Step 2: CNIC Front & Back */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Front */}
            <div className="p-3 bg-navy-950/70 border border-slate-750 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CNIC Front Side *</span>
                </span>
                {frontFile && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Attached
                  </span>
                )}
              </label>

              {frontFile ? (
                <div className="flex items-center justify-between p-2.5 bg-navy-900 border border-slate-700 rounded-lg text-xs text-cyan-300">
                  <span className="truncate max-w-[170px] text-xs">{frontFile.name}</span>
                  <button type="button" onClick={() => setFrontFile(null)} className="text-rose-400 hover:text-rose-300 p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg cursor-pointer bg-navy-900/40 hover:bg-navy-900/80 transition text-center">
                  <Upload className="w-4 h-4 text-slate-400 mb-1" />
                  <span className="text-[11px] font-medium text-slate-300">Select Front File</span>
                  <span className="text-[9px] text-slate-500">JPG, PNG, PDF (Max 5MB)</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => setFrontFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Back */}
            <div className="p-3 bg-navy-950/70 border border-slate-750 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CNIC Back Side *</span>
                </span>
                {backFile && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Attached
                  </span>
                )}
              </label>

              {backFile ? (
                <div className="flex items-center justify-between p-2.5 bg-navy-900 border border-slate-700 rounded-lg text-xs text-cyan-300">
                  <span className="truncate max-w-[170px] text-xs">{backFile.name}</span>
                  <button type="button" onClick={() => setBackFile(null)} className="text-rose-400 hover:text-rose-300 p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg cursor-pointer bg-navy-900/40 hover:bg-navy-900/80 transition text-center">
                  <Upload className="w-4 h-4 text-slate-400 mb-1" />
                  <span className="text-[11px] font-medium text-slate-300">Select Back File</span>
                  <span className="text-[9px] text-slate-500">JPG, PNG, PDF (Max 5MB)</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => setBackFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            🔒 Stored in private encrypted storage. Never exposed on public profile or discovery results.
          </p>

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" type="button" onClick={() => setIdentityModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              icon={ShieldCheck}
              loading={submitting}
              disabled={!frontFile || !backFile || !selfieFile}
              className="font-bold bg-gradient-to-r from-magenta-600 to-pink-600 hover:from-magenta-500 hover:to-pink-500 shadow-md shadow-magenta-500/20"
            >
              Upload & Submit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Education Submission Modal */}
      <Modal
        isOpen={educationModalOpen}
        onClose={() => setEducationModalOpen(false)}
        maxWidth="max-w-lg"
        title="Upload Education Document"
      >
        <form onSubmit={handleEducationSubmit} className="space-y-4">
          {formError && (
            <Alert variant="danger" title="Notice" className="text-xs">
              {formError}
            </Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Document Description / Degree Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. BS Computer Science Degree / Transcript"
              value={eduLabel}
              onChange={(e) => setEduLabel(e.target.value)}
              className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Degree / Certificate Document (Image or PDF, max 5MB) *
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => setEduFile(e.target.files[0] || null)}
              className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-800 file:text-magenta-400 hover:file:bg-navy-750 border border-slate-700 rounded-xl p-2 bg-navy-850"
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            🔒 Stored securely in private directory. Only verified badges appear on public profile.
          </p>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" type="button" onClick={() => setEducationModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" loading={submitting}>
              Upload & Submit
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

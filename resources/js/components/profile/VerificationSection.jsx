import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, 
  Upload, FileText, AlertTriangle, X, RefreshCw, Eye
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { verificationApi } from '../../api/verification';

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
    if (!frontFile || !backFile) {
      setFormError('Please select both front and back CNIC document files.');
      return;
    }

    const formData = new FormData();
    formData.append('front', frontFile);
    formData.append('back', backFile);

    setSubmitting(true);
    try {
      const res = await verificationApi.submitIdentity(formData);
      setSuccess(res.message);
      setIdentityModalOpen(false);
      setFrontFile(null);
      setBackFile(null);
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
                ✓ Identity Verified
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
                ✓ Education Verified
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
      {identityModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
          <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white">Upload CNIC Documents</h3>
              <button onClick={() => setIdentityModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <Alert variant="danger" title="Notice" className="text-xs">
                {formError}
              </Alert>
            )}

            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CNIC Front Side (Image or PDF, max 5MB) *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => setFrontFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-800 file:text-magenta-400 hover:file:bg-navy-750 border border-slate-700 rounded-xl p-2 bg-navy-850"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CNIC Back Side (Image or PDF, max 5MB) *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => setBackFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-800 file:text-magenta-400 hover:file:bg-navy-750 border border-slate-700 rounded-xl p-2 bg-navy-850"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                🔒 Stored in private encrypted storage. Never exposed on public profile or discovery results.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button size="sm" variant="ghost" onClick={() => setIdentityModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" isLoading={submitting}>
                  Upload & Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Education Submission Modal */}
      {educationModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
          <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white">Upload Education Document</h3>
              <button onClick={() => setEducationModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <Alert variant="danger" title="Notice" className="text-xs">
                {formError}
              </Alert>
            )}

            <form onSubmit={handleEducationSubmit} className="space-y-4">
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

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button size="sm" variant="ghost" onClick={() => setEducationModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" isLoading={submitting}>
                  Upload & Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}

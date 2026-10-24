import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, AlertCircle, CheckCircle2, Clock, FileText, Camera, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LiveSelfieCamera from './LiveSelfieCamera';
import { verificationApi } from '../../api/verification';
import useAuth from '../../hooks/useAuth';

export default function IdentityVerificationGateModal({
  isOpen,
  onClose,
  actionType = 'send', // 'send' | 'accept'
  onVerified,
}) {
  const { refreshUser } = useAuth();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [verificationData, setVerificationData] = useState(null);

  // Form states
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const data = await verificationApi.getStatus();
      setVerificationData(data);
      if (data?.identity?.status === 'approved' || data?.summary?.identity_verified) {
        if (refreshUser) refreshUser();
        if (onVerified) onVerified();
      }
    } catch (err) {
      console.error('Failed to load verification status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleFrontChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontFile(file);
    setFrontPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const handleBackChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackFile(file);
    setBackPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!frontFile || !backFile) {
      setError('Please provide both Front and Back of your CNIC.');
      return;
    }
    if (!selfieBlob) {
      setError('Please capture your live selfie to complete verification.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('front', frontFile);
    formData.append('back', backFile);
    formData.append('live_selfie', selfieBlob, 'live_selfie.jpg');

    try {
      await verificationApi.submitIdentity(formData);
      setSuccess(true);
      await loadStatus();
      if (onVerified) {
        onVerified();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit documents. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const identityRecord = verificationData?.identity;
  const isPending = identityRecord?.status === 'pending';
  const isRejected = identityRecord?.status === 'rejected';
  const isApproved = identityRecord?.status === 'approved' || verificationData?.summary?.identity_verified;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>Identity Verification Required / شناختی کارڈ تصدیق</span>
        </div>
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Purpose Banner */}
        <div className="p-3.5 bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-cyan-500/30 rounded-2xl text-xs text-slate-300">
          <p className="font-semibold text-cyan-300 mb-1">
            {actionType === 'accept'
              ? 'پروپوزل قبول کرنے سے پہلے تصدیق لازمی ہے:'
              : 'پروپوزل بھیجنے سے پہلے تصدیق لازمی ہے:'}
          </p>
          <p className="leading-relaxed text-slate-400">
            پلیٹ فارم پر سنجیدہ اور اصلی خاندانوں کے تحفظ کے لیے ہر ممبر کا نادرا شناختی کارڈ (فرنٹ و بیک) اور لائیو سیلفی تصدیق ہونا لازمی ہے۔
            آپ کی دستاویزات صرف ایڈمن کی جانچ کے لیے ہیں اور محفوظ رکھی جاتی ہیں۔
          </p>
        </div>

        {loadingStatus ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span>Checking verification status...</span>
          </div>
        ) : isApproved ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-300">Identity Verified / آپ کی شناخت تصدیق شدہ ہے!</h4>
            <p className="text-xs text-slate-300">
              آپ کا شناختی کارڈ ایڈمن سے منظور شدہ ہے۔ اب آپ بلا رکاوٹ پروپوزل بھیج اور قبول کر سکتے ہیں۔
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (refreshUser) await refreshUser();
                if (onVerified) onVerified();
                onClose();
              }}
              className="mt-3"
            >
              Proceed / آگے بڑھیں
            </Button>
          </div>
        ) : isPending || success ? (
          <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-3">
            <Clock className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
            <h4 className="text-sm font-bold text-amber-300">
              Documents Under Review / دستاویزات زیر جائزہ ہیں
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              آپ کا شناختی کارڈ اور لائیو تصویر ایڈمن کو تصدیق کے لیے موصول ہو چکی ہے۔
              عام طور پر چند گھنٹوں میں تصدیق مکمل ہو جاتی ہے، جس کے بعد آپ فوری طور پر پروپوزل بھیج اور قبول کر سکیں گے۔
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Got it / ٹھیک ہے
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRejected && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Previous Submission Declined:</span>
                </div>
                <p className="pl-5 text-slate-300">{identityRecord?.rejection_reason || 'Please provide clearer photos.'}</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* CNIC Upload Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* CNIC Front */}
              <div className="p-3.5 bg-navy-950/60 border border-slate-750 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CNIC Front / شناختی کارڈ فرنٹ</span>
                  <span className="text-rose-400">*</span>
                </label>
                {frontPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-navy-900">
                    <img src={frontPreview} alt="Front preview" className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setFrontFile(null); setFrontPreview(null); }}
                      className="absolute top-1 right-1 p-1 bg-navy-950/80 hover:bg-rose-600 rounded-full text-slate-300 hover:text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : frontFile ? (
                  <div className="flex items-center justify-between p-2.5 bg-navy-900 border border-slate-700 rounded-lg text-xs text-cyan-300">
                    <span className="truncate max-w-[150px]">{frontFile.name}</span>
                    <button type="button" onClick={() => setFrontFile(null)} className="text-rose-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg cursor-pointer bg-navy-900/40 hover:bg-navy-900/80 transition text-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[11px] font-medium text-slate-300">Upload Front</span>
                    <span className="text-[9px] text-slate-500">JPG, PNG, PDF (Max 5MB)</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleFrontChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* CNIC Back */}
              <div className="p-3.5 bg-navy-950/60 border border-slate-750 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CNIC Back / شناختی کارڈ بیک</span>
                  <span className="text-rose-400">*</span>
                </label>
                {backPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-navy-900">
                    <img src={backPreview} alt="Back preview" className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setBackFile(null); setBackPreview(null); }}
                      className="absolute top-1 right-1 p-1 bg-navy-950/80 hover:bg-rose-600 rounded-full text-slate-300 hover:text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : backFile ? (
                  <div className="flex items-center justify-between p-2.5 bg-navy-900 border border-slate-700 rounded-lg text-xs text-cyan-300">
                    <span className="truncate max-w-[150px]">{backFile.name}</span>
                    <button type="button" onClick={() => setBackFile(null)} className="text-rose-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg cursor-pointer bg-navy-900/40 hover:bg-navy-900/80 transition text-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[11px] font-medium text-slate-300">Upload Back</span>
                    <span className="text-[9px] text-slate-500">JPG, PNG, PDF (Max 5MB)</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleBackChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Live Selfie Camera Section */}
            <div className="p-3.5 bg-navy-950/60 border border-slate-750 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-magenta-400" />
                  <span>Live Selfie Photo / لائیو سیلفی تصویر</span>
                  <span className="text-rose-400">*</span>
                </span>
                {selfieBlob && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Captured
                  </span>
                )}
              </label>

              <LiveSelfieCamera
                onCapture={(blob) => setSelfieBlob(blob)}
                onClear={() => setSelfieBlob(null)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={ShieldCheck}
                loading={submitting}
                disabled={!frontFile || !backFile || !selfieBlob}
                className="font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20"
              >
                Submit Verification / تصدیق کروائیں
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

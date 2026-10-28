import React, { useState, useEffect } from 'react';
import { Camera, Eye, Upload, ShieldCheck, AlertCircle, X, CheckCircle2, Lock, Clock, CreditCard, Sparkles, Copy, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import {
  uploadProposalPhoto,
  initiatePhotoPayment,
  submitManualPhotoProof,
  getMyProposalPhotoBlob,
  requestVerification,
} from '../../api/requests';
import SecurePhotoViewerModal from './SecurePhotoViewerModal';
import { useAuth } from '../../contexts/AuthContext';

export default function PhotoExchangeModal({ isOpen, onClose, request, onSuccess }) {
  const { user } = useAuth();

  // Photo upload states (for candidate uploading)
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // My uploaded photo preview
  const [myPhotoBlobUrl, setMyPhotoBlobUrl] = useState(null);
  const [loadingMyPhoto, setLoadingMyPhoto] = useState(false);

  // Payment states (for requester unlocking)
  const [paymentMode, setPaymentMode] = useState(false);
  const [tid, setTid] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Secure viewer state
  const [viewerOpen, setViewerOpen] = useState(false);

  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedTill, setCopiedTill] = useState(false);
  const [requestingPhoto, setRequestingPhoto] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleCopyIban = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleCopyTill = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  const handleRequestCandidatePhoto = async () => {
    setRequestingPhoto(true);
    setError(null);
    try {
      await requestVerification(request.request_code, 'photo');
      setSuccessMsg('Photo exchange requested! The candidate has been requested to share a photo.');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request photo from candidate.');
    } finally {
      setRequestingPhoto(false);
    }
  };

  useEffect(() => {
    if (isOpen && request?.my_photo_shared) {
      loadMyPhoto();
    }
    return () => {
      if (myPhotoBlobUrl) {
        URL.revokeObjectURL(myPhotoBlobUrl);
      }
    };
  }, [isOpen, request]);

  const loadMyPhoto = async () => {
    setLoadingMyPhoto(true);
    try {
      const blob = await getMyProposalPhotoBlob(request.request_code);
      const url = URL.createObjectURL(blob);
      setMyPhotoBlobUrl(url);
    } catch (err) {
      console.warn('Could not load own uploaded photo preview:', err);
    } finally {
      setLoadingMyPhoto(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('Photo size must be less than 5MB.');
      return;
    }

    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a photo to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await uploadProposalPhoto(request.request_code, formData);
      setSuccessMsg('Your photo has been uploaded and submitted for administrator quality review. Once approved, the candidate will be prompted to unlock it.');
      setFile(null);
      setPreview(null);
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleReceiptChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setReceiptFile(selected);
    setReceiptPreview(selected.type.startsWith('image/') ? URL.createObjectURL(selected) : null);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!tid.trim() || !receiptFile) {
      setError('Please provide Transaction Reference (TID) and upload payment receipt.');
      return;
    }

    setSubmittingPayment(true);
    setError(null);

    const formData = new FormData();
    formData.append('transaction_reference', tid.trim());
    formData.append('receipt', receiptFile);

    try {
      await submitManualPhotoProof(request.request_code, formData);
      setSuccessMsg('Payment proof submitted successfully! Administrator will verify it shortly to unlock the photo.');
      setPaymentMode(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment proof.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (!isOpen || !request) return null;

  const candidate = request.candidate_profile;
  const candidateModerationStatus = request.photo_moderation_status || 'none';
  const myModerationStatus = request.my_photo_moderation_status || 'none';
  const isPaid = request.photo_paid;
  const isPaymentPending = request.photo_payment_pending;
  const photoFee = request.photo_fee || 300;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>Private Photo Exchange / باہمی تصویر کا تبادلہ</span>
          </div>
        }
        size="lg"
      >
        <div className="space-y-5">
          {/* Privacy Assurance Banner */}
          <div className="p-3 bg-gradient-to-r from-navy-900 to-navy-850 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>100% Privacy & Admin Moderation:</strong> تمام تصاویر پہلے ایڈمن سے منظور ہوتی ہیں اور دیکھنے والے کے شناختی واٹر مارک کے ساتھ کھلتی ہیں۔ فیس (Rs. 300) صرف اس صورت میں ادا کرنی ہوگی جب ایڈمن تصویر منظور کرے۔
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 1: Candidate's Photo Card */}
            <div className="p-4 bg-navy-950/70 border border-slate-750 rounded-2xl flex flex-col items-center justify-between text-center min-h-[260px]">
              <div className="w-full">
                <span className="text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wide">
                  Candidate #{candidate?.profile_code} Photo
                </span>

                {request.candidate_photo_shared ? (
                  // Candidate has uploaded a photo
                  candidateModerationStatus === 'pending_review' ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex flex-col items-center gap-2 my-4">
                      <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
                      <span className="font-bold">Under Admin Quality Review</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        امیدوار نے تصویر اپلوڈ کر دی ہے اور وہ ایڈمن کے جائزے کے مرحلے میں ہے۔ ایڈمن کے منظور کرنے پر آپ کو اطلاع ملے گی تاکہ آپ کے پیسے ضائع نہ ہوں۔
                      </p>
                    </div>
                  ) : candidateModerationStatus === 'approved' ? (
                    // Admin has approved
                    isPaid ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex flex-col items-center gap-3 my-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        <span className="font-bold">Verified Photo Ready to View</span>
                        <p className="text-[11px] text-slate-300">
                          تصویر ایڈمن سے تصدیق شدہ ہے۔ اپنے فون اور پروفائل واٹر مارک کے ساتھ دیکھنے کے لیے نیچے کلک کریں۔
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Eye}
                          onClick={() => setViewerOpen(true)}
                          className="w-full sm:w-auto font-bold bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md mt-1 justify-center"
                        >
                          Hold to View Photo / محفوظ تصویر دیکھیں
                        </Button>
                      </div>
                    ) : isPaymentPending ? (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex flex-col items-center gap-2 my-4">
                        <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
                        <span className="font-bold">Payment Proof Pending Verification</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          آپ کی ادائیگی کا ثبوت موصول ہو چکا ہے۔ ایڈمن کی تصدیق کے بعد فوری طور پر تصویر دیکھنے کا آپشن انلاک ہو جائے گا۔
                        </p>
                      </div>
                    ) : paymentMode ? (
                      // Manual Payment Form with Official Askari Bank Details
                      <form onSubmit={handleSubmitProof} className="space-y-3 text-left my-2 w-full">
                        <div className="p-3 bg-navy-900 border border-slate-700 rounded-xl text-xs space-y-2.5">
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                            <span className="text-slate-400">Photo Viewing Fee:</span>
                            <span className="font-bold text-amber-400 text-xs">Rs. {photoFee}.00 PKR</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                            <span className="text-slate-400">Account Title:</span>
                            <span className="font-bold text-white tracking-wide">RAABTA NOW</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                            <span className="text-slate-400">Bank Name:</span>
                            <span className="font-semibold text-white text-right">Askari Bank Limited</span>
                          </div>

                          {/* Account Number Row */}
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Account Number:</span>
                              <span className="font-mono font-bold text-amber-400 text-xs select-all">04910200000674</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyTill('04910200000674')}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-navy-800 hover:bg-navy-700 text-amber-300 border border-amber-600/50 flex items-center gap-1 shrink-0"
                            >
                              {copiedTill ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedTill ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>

                          {/* IBAN Row */}
                          <div className="space-y-1 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-400 text-[10px]">IBAN (Any Bank / Raast):</span>
                              <button
                                type="button"
                                onClick={() => handleCopyIban('PK05ASCM0004910200000674')}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-navy-800 hover:bg-navy-700 text-cyan-300 border border-cyan-700/50 flex items-center gap-1 shrink-0"
                              >
                                {copiedIban ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedIban ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <span className="font-mono font-bold text-[11px] text-cyan-300 block select-all break-all">
                              PK05ASCM0004910200000674
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                            Transaction Reference / TID *
                          </label>
                          <input
                            type="text"
                            value={tid}
                            onChange={(e) => setTid(e.target.value)}
                            placeholder="e.g. 10987654321"
                            className="w-full px-3 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-xs text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                            Payment Screenshot / Receipt *
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleReceiptChange}
                            className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-cyan-600 file:text-white"
                            required
                          />
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1 w-full">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentMode(false)}
                            className="w-full sm:w-auto justify-center"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            loading={submittingPayment}
                            className="flex-1 font-bold bg-cyan-600 hover:bg-cyan-500 justify-center w-full sm:w-auto"
                          >
                            Submit Proof
                          </Button>
                        </div>
                      </form>
                    ) : (
                      // Approved but not paid
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs flex flex-col items-center gap-3 my-2">
                        <Sparkles className="w-8 h-8 text-cyan-400" />
                        <span className="font-bold">Photo Approved by Administration!</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          امیدوار کی تصویر کا معیار ایڈمن کی طرف سے چیک اور منظور ہو چکا ہے۔ دیکھنے کے لیے Rs. {photoFee} فیس ادا کریں۔
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CreditCard}
                          onClick={() => setPaymentMode(true)}
                          className="w-full sm:w-auto font-bold bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md justify-center"
                        >
                          Pay Rs. {photoFee} to Unlock Photo
                        </Button>
                      </div>
                    )
                  ) : (
                    // Photo was rejected by admin
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex flex-col items-center gap-2 my-4">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      <span className="font-bold">Candidate Photo Awaiting Revision</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        امیدوار کی اپلوڈ کردہ تصویر معیار پر پوری نہیں اتری، اور امیدوار سے واضح تصویر دوبارہ مانگی گئی ہے۔ آپ کا کوئی روپیہ چارج نہیں ہوا ہے۔
                      </p>
                    </div>
                  )
                ) : (
                  // Candidate hasn't uploaded yet
                  <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
                    <Lock className="w-10 h-10 text-slate-500" />
                    <p className="text-xs max-w-[220px] text-slate-300">
                      {request.photo_requested_by_me
                        ? 'آپ تصویر مانگ چکے ہیں۔ امیدوار کے اپلوڈ کرنے کا انتظار ہے۔'
                        : 'امیدوار نے ابھی تک تصویر اپلوڈ نہیں کی۔ آپ درخواست بھیج سکتے ہیں۔'}
                    </p>
                    {!request.photo_requested_by_me && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Camera}
                        loading={requestingPhoto}
                        onClick={handleRequestCandidatePhoto}
                        className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold mt-1 justify-center"
                      >
                        Request Photo / تصویر کی درخواست کریں
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: My Photo Upload Card */}
            <div className="p-4 bg-navy-950/70 border border-slate-750 rounded-2xl flex flex-col items-center justify-between text-center min-h-[260px]">
              <div className="w-full">
                <span className="text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wide">
                  Your Uploaded Photo / آپ کی تصویر
                </span>

                {request.photo_requested_by_candidate && !request.my_photo_shared && (
                  <div className="p-2.5 bg-gradient-to-r from-magenta-500/15 to-purple-500/15 border border-magenta-500/40 rounded-xl text-xs text-magenta-300 mb-3 flex items-center gap-2 text-left">
                    <Sparkles className="w-4 h-4 text-magenta-400 shrink-0" />
                    <span className="leading-snug">امیدوار نے آپ سے تصویر اپلوڈ کرنے کی درخواست کی ہے۔</span>
                  </div>
                )}

                {request.my_photo_shared ? (
                  <div className="space-y-3 my-2">
                    {myModerationStatus === 'pending_review' ? (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex flex-col items-center gap-1.5">
                        <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
                        <span className="font-bold">Awaiting Admin Quality Audit</span>
                        <p className="text-[10px] text-slate-300">
                          ایڈمن کے جائزے کے بعد ہی یہ تصویر فریق ثانی کو واٹر مارک کے ساتھ دکھائی جائے گی۔
                        </p>
                      </div>
                    ) : myModerationStatus === 'approved' ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex flex-col items-center gap-1.5">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <span className="font-bold">Photo Approved by Admin!</span>
                        <p className="text-[10px] text-slate-300">
                          آپ کی تصویر تصدیق شدہ ہے اور فریق ثانی صرف فیس ادا کرنے کے بعد ہی واٹر مارک کے ساتھ دیکھ سکے گا۔
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex flex-col items-center gap-1.5">
                        <AlertCircle className="w-6 h-6 text-rose-400" />
                        <span className="font-bold">Photo Needs Re-upload</span>
                        <p className="text-[10px] text-rose-200">
                          {request.my_photo_rejection_notes || request.photo_rejection_notes || 'Please upload a clear, direct facial photo.'}
                        </p>
                      </div>
                    )}

                    {myPhotoBlobUrl && (
                      <div className="relative group inline-block rounded-xl overflow-hidden border border-slate-700 shadow-md">
                        <img src={myPhotoBlobUrl} alt="My uploaded photo" className="w-24 h-28 object-cover rounded-xl" />
                      </div>
                    )}
                  </div>
                ) : preview ? (
                  <div className="flex flex-col items-center gap-2 my-2">
                    <img src={preview} alt="Preview" className="w-28 h-32 object-cover rounded-xl border border-slate-700 shadow" />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="text-[11px] text-rose-400 hover:underline inline-flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Change Photo
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-magenta-500/50 rounded-xl cursor-pointer transition-colors my-2">
                    <Camera className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-white">Choose a clear photo</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or WEBP (Max 5MB)</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>

              {!request.my_photo_shared && preview && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Upload}
                  loading={uploading}
                  onClick={handleUpload}
                  className="w-full mt-2 font-bold bg-gradient-to-r from-magenta-500 to-purple-600 justify-center"
                >
                  Upload for Admin Review
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto justify-center">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full-screen Hold-to-View Modal */}
      {viewerOpen && (
        <SecurePhotoViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          requestCode={request.request_code}
          candidateCode={candidate?.profile_code}
          viewerProfileCode={user?.profile?.profile_code || user?.name}
          viewerPhone={user?.phone || user?.email}
          watermarkLevel={request?.photo_watermark_level || 'medium'}
          customWatermarkText={request?.photo_watermark_text}
        />
      )}
    </>
  );
}

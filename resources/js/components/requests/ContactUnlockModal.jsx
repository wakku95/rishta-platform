import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  CreditCard,
  Phone,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Send,
  MessageSquare,
  QrCode,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Maximize2,
  ZoomIn,
  Download,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import LoadingState from '../ui/LoadingState';
import {
  getUnlockStatus,
  initiatePayment,
  verifyPayment,
  sendUnlockOtp,
  verifyUnlockOtp,
  getUnlockedContact,
  submitManualPaymentProof,
} from '../../api/requests';

export default function ContactUnlockModal({
  isOpen,
  onClose,
  requestCode,
  candidateProfile,
  onUnlocked,
}) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Payment state
  const [paying, setPaying] = useState(false);
  const [paymentTab, setPaymentTab] = useState('jazzcash'); // 'jazzcash' | 'safepay'
  const [manualTid, setManualTid] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedTill, setCopiedTill] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  // Phone & OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState('input_phone'); // 'input_phone' | 'input_otp'
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Unlocked Contact state
  const [contactData, setContactData] = useState(null);
  const [fetchingContact, setFetchingContact] = useState(false);

  // Poll / Countdown interval
  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  useEffect(() => {
    if (isOpen && requestCode) {
      loadStatus();
    } else {
      // Reset state when modal closes
      setStatus(null);
      setError(null);
      setFeedback(null);
      setPhoneNumber('');
      setOtpCode('');
      setOtpStep('input_phone');
      setContactData(null);
      setManualTid('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setPaymentTab('jazzcash');
    }
  }, [isOpen, requestCode]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUnlockStatus(requestCode);
      const data = res.data;
      setStatus(data);

      if (data.cooldown_remaining > 0) {
        setCooldown(data.cooldown_remaining);
        setOtpStep('input_otp');
      }

      if (data.my_phone) {
        setPhoneNumber(data.my_phone);
      }

      if (data.is_unlocked) {
        loadContact();
      }
    } catch (err) {
      console.error('Failed to load unlock status:', err);
      setError(err.response?.data?.message || 'Failed to retrieve unlock status.');
    } finally {
      setLoading(false);
    }
  };

  const loadContact = async () => {
    setFetchingContact(true);
    try {
      const res = await getUnlockedContact(requestCode);
      setContactData(res.data);
    } catch (err) {
      console.error('Failed to load unlocked contact:', err);
      setError(err.response?.data?.message || 'Failed to fetch contact details.');
    } finally {
      setFetchingContact(false);
    }
  };

  const handleInitiateAndVerifyPayment = async () => {
    setPaying(true);
    setError(null);
    setFeedback(null);
    try {
      // 1. Initiate payment attempt
      const initRes = await initiatePayment(requestCode);
      const paymentUuid = initRes.data?.payment_uuid;
      const gateway = initRes.data?.gateway;
      const redirectUrl = initRes.data?.redirect_url;

      if (!paymentUuid) {
        throw new Error('Payment initialization failed.');
      }

      // If gateway provides a hosted checkout redirect URL (Safepay)
      if (gateway === 'safepay' && redirectUrl) {
        setFeedback({
          type: 'info',
          message: 'Connecting to Safepay secure checkout...',
        });
        window.location.href = redirectUrl;
        return;
      }

      // 2. Simulated gateway verification (Fake gateway)
      const verifyRes = await verifyPayment(paymentUuid, {
        status: 'PAID',
        transaction_reference: initRes.data?.transaction_reference,
      });

      setFeedback({
        type: 'success',
        message: 'Payment of Rs. 2500 PKR verified successfully! You can now verify your mobile phone.',
      });

      // Reload status
      await loadStatus();
    } catch (err) {
      console.error('Payment failure:', err);
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleCopyTill = (text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedTill(true);
      setTimeout(() => setCopiedTill(false), 2000);
    }
  };

  const handleCopyIban = (text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Receipt file size must be less than 5MB.');
      return;
    }

    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmitManualProof = async (e) => {
    e?.preventDefault();
    setError(null);
    setFeedback(null);

    const cleanTid = manualTid.trim();
    if (!/^[A-Za-z0-9\-_]{6,35}$/.test(cleanTid)) {
      setError('Please enter a valid Transaction Reference / TID (6 to 35 characters).');
      return;
    }

    if (!receiptFile) {
      setError('Please upload your payment screenshot or receipt.');
      return;
    }

    setSubmittingProof(true);
    try {
      const formData = new FormData();
      formData.append('transaction_reference', cleanTid);
      formData.append('receipt', receiptFile);

      await submitManualPaymentProof(requestCode, formData);
      setFeedback({
        type: 'success',
        message: 'Payment proof submitted successfully! It is now pending admin verification.',
      });
      setManualTid('');
      setReceiptFile(null);
      setReceiptPreview(null);
      await loadStatus();
    } catch (err) {
      console.error('Failed to submit manual payment proof:', err);
      setError(err.response?.data?.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!phoneNumber) return;
    setSendingOtp(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await sendUnlockOtp(requestCode, phoneNumber);
      setFeedback({
        type: 'success',
        message: 'A 6-digit verification code has been sent via SMS.',
      });
      setCooldown(res.data?.cooldown_seconds || 60);
      setOtpStep('input_otp');
    } catch (err) {
      console.error('Failed to send OTP:', err);
      setError(err.response?.data?.message || 'Failed to send SMS OTP. Please check the phone number.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otpCode || otpCode.length !== 6) return;
    setVerifyingOtp(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await verifyUnlockOtp(requestCode, otpCode);
      setFeedback({
        type: 'success',
        message: res.message || 'Phone number successfully verified!',
      });

      // Refresh status and load contact if unlocked
      const statusRes = await getUnlockStatus(requestCode);
      setStatus(statusRes.data);

      if (statusRes.data?.is_unlocked) {
        await loadContact();
        if (onUnlocked) onUnlocked();
      }
    } catch (err) {
      console.error('Failed to verify OTP:', err);
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const isSender = status?.my_role === 'sender';

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        status?.is_unlocked
          ? 'Mutual Contact Details Unlocked / باہمی رابطہ نمبرز'
          : 'Unlock Verified Contact Details / رابطہ نمبرز انلاک کریں'
      }
      subtitle={`Connection Request #${requestCode}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 py-1">
        {feedback && (
          <Alert
            variant={feedback.type === 'error' ? 'danger' : 'success'}
            dismissible
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="py-12">
            <LoadingState text="Loading connection verification status..." />
          </div>
        ) : status?.is_unlocked && contactData ? (
          /* =========================================================================
             STAGE 3: MUTUAL UNLOCK COMPLETE (DISPLAY CONTACT DETAILS)
             ========================================================================= */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Mutual Verification Complete!</span>
                  <span className="text-xs font-normal text-emerald-700 dark:text-emerald-300">/ باہمی تصدیق مکمل!</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-emerald-300">
                  Both candidate profiles have completed phone verification. Direct contact information is unlocked below.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-emerald-400 font-urdu" dir="rtl">
                  دونوں امیدواروں کی فون تصدیق مکمل ہو گئی ہے۔ براہِ راست رابطہ معلومات نیچے فراہم کر دی گئی ہیں۔
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-navy-850 border border-slate-200 dark:border-slate-750 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-750/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Candidate Contact / امیدوار کا رابطہ</span>
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">{contactData.name}</h3>
                </div>
                <Badge variant="success" size="sm" className="font-bold text-xs">
                  Verified Contact / تصدیق شدہ
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" /> Mobile / WhatsApp:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{contactData.phone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" /> Direct WhatsApp:
                  </span>
                  <a
                    href={contactData.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors shadow-sm"
                  >
                    <span>Open WhatsApp Chat / واٹس ایپ کھولیں</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Registered Email:</span>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{contactData.email}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1">
              <p className="text-xs text-slate-700 dark:text-slate-300 font-urdu" dir="rtl">
                براہِ کرم باہمی عزت، احترام، شائستگی اور سنجیدہ رشتے کی پاکیزہ نیت کے ساتھ بات چیت کریں۔
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                Please communicate with mutual respect, modesty, and genuine matrimonial intent.
              </p>
            </div>
          </div>
        ) : (
          /* =========================================================================
             STAGE 1 & 2: PAYMENT & PHONE VERIFICATION PROGRESS
             ========================================================================= */
          <div className="space-y-5">
            {/* Stepper Header */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 min-w-0 ${
                  status?.is_paid
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-navy-750 border-magenta-500/40 text-magenta-700 dark:text-magenta-300'
                }`}
              >
                {status?.is_paid ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <CreditCard className="w-4 h-4 text-magenta-500 shrink-0" />
                )}
                <div className="truncate text-left leading-tight">
                  <div className="font-bold truncate">1. Unlock Fee (Rs. 2500)</div>
                  <div className="text-[10px] opacity-75 font-normal font-urdu" dir="rtl">فیس ادائیگی</div>
                </div>
              </div>

              <div
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 min-w-0 ${
                  status?.my_verified
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-navy-850 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400'
                }`}
              >
                {status?.my_verified ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <div className="truncate text-left leading-tight">
                  <div className="font-bold truncate">2. SMS OTP Verification</div>
                  <div className="text-[10px] opacity-75 font-normal font-urdu" dir="rtl">موبائل تصدیق</div>
                </div>
              </div>
            </div>

            {/* STEP 1: PAYMENT (Sender Pays, Receiver Waits) */}
            {!status?.is_paid && (
              <div className="p-3.5 sm:p-5 bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-magenta-500/15 border border-magenta-500/30 text-magenta-500 dark:text-magenta-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    {isSender ? (
                      <>
                        <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>Contact Unlock Fee Required</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ رابطہ انلاک فیس درکار ہے</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          A fee of <strong className="text-slate-900 dark:text-white">Rs. 2500 PKR</strong> is required to unlock direct contact numbers and initiate two-way phone SMS verification.
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-urdu leading-relaxed" dir="rtl">
                          براہِ راست رابطہ نمبرز حاصل کرنے اور باہمی فون SMS تصدیق شروع کرنے کے لیے 2,500 روپے فیس درکار ہے۔
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>Waiting for Sender's Payment</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ بھیجنے والے کی ادائیگی کا انتظار</span>
                        </h4>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                          <p className="font-semibold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span><strong>No Fee For You:</strong> You do not need to pay anything.</span>
                          </p>
                          <p className="font-urdu text-[11px] text-emerald-700 dark:text-emerald-400" dir="rtl">
                            آپ (ریسیور) کو کوئی فیس ادا نہیں کرنی، فیس ادا کرنے کی ذمہ داری پروپوزل بھیجنے والے (Sender) کی ہے۔
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {isSender ? (
                  <div className="pt-2 space-y-4">
                    {/* CASE A: PENDING ADMIN VERIFICATION */}
                    {status?.pending_payment ? (
                      <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-3">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-sm text-white">Payment Proof Submitted</h5>
                              <Badge variant="warning" size="sm">Pending Verification</Badge>
                            </div>
                            <p className="text-xs text-amber-200/90 leading-relaxed">
                              Your JazzCash payment proof has been received and is currently pending admin verification.
                              Payments are typically reviewed within a few hours during business hours.
                            </p>
                          </div>
                        </div>

                        <div className="bg-navy-900/80 p-3 rounded-lg border border-amber-500/20 text-xs space-y-1.5 font-mono">
                          <div className="flex justify-between text-slate-300">
                            <span>JazzCash TID:</span>
                            <span className="font-bold text-white">{status.pending_payment.transaction_reference}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Unlock Fee Amount:</span>
                            <span className="font-bold text-amber-300">
                              Rs. {status.pending_payment.amount ? Number(status.pending_payment.amount).toFixed(0) : '2500'} PKR
                            </span>
                          </div>
                          {status.pending_payment.created_at && (
                            <div className="flex justify-between text-slate-400 text-[11px]">
                              <span>Submitted:</span>
                              <span>{new Date(status.pending_payment.created_at).toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <span className="text-[11px] text-slate-400 italic">
                            Once approved, Step 2 (Phone OTP) will unlock automatically.
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={RefreshCw}
                            onClick={loadStatus}
                            isLoading={loading}
                            className="self-end sm:self-auto shrink-0"
                          >
                            Check Status
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* CASE B: PAYMENT SUBMISSION REQUIRED OR RE-SUBMISSION */
                      <div className="space-y-4">
                        {status?.rejected_payment && (
                          <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-200">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-white block font-semibold mb-0.5">Previous Payment Proof Rejected:</strong>
                              <p>{status.rejected_payment.admin_notes || 'Transaction reference could not be verified. Please re-check and submit valid proof.'}</p>
                            </div>
                          </div>
                        )}

                        {/* Payment Method Selector Tabs */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                            Select Payment Method
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Bank Transfer Option (Active) */}
                            <button
                              type="button"
                              onClick={() => setPaymentTab('jazzcash')}
                              className={`p-2.5 sm:p-3 rounded-xl border text-left transition flex items-center gap-2 sm:gap-2.5 min-w-0 ${
                                paymentTab === 'jazzcash'
                                  ? 'bg-magenta-500/15 border-magenta-500 text-white shadow-sm'
                                  : 'bg-navy-800 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-bold leading-tight truncate">Bank / Raast Transfer</div>
                                <span className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold block truncate">
                                  <span className="sm:inline hidden">Active & Recommended</span>
                                  <span className="sm:hidden inline">Active</span>
                                </span>
                              </div>
                            </button>

                            {/* Safepay Card Option (Disabled / Coming Soon) */}
                            <div
                              className="p-2.5 sm:p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100/70 dark:bg-navy-900/60 text-slate-500 cursor-not-allowed opacity-75 flex items-center gap-2 sm:gap-2.5 min-w-0 select-none relative overflow-hidden"
                              title="Online card payments will be enabled upon completion of banking merchant onboarding."
                            >
                              <CreditCard className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight truncate">Card / Safepay</div>
                                <span className="text-[9px] text-slate-500 font-medium block truncate">Coming Soon</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Active Tab: Official Askari Bank Details & Submission Form */}
                        {paymentTab === 'jazzcash' && (
                          <div className="p-3 sm:p-4 bg-navy-900/70 border border-slate-750 rounded-xl space-y-4">
                            {/* Account Details Section */}
                            <div className="space-y-3 pb-3 border-b border-slate-800">
                              {/* Payment Particulars Box */}
                              <div className="w-full bg-navy-950/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                                  <span className="text-slate-400 font-medium">Exact Amount:</span>
                                  <span className="font-extrabold text-amber-600 dark:text-amber-300 text-sm">Rs. 2500.00 PKR</span>
                                </div>

                                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                                  <span className="text-slate-400 font-medium">Account Title:</span>
                                  <span className="font-bold text-white tracking-wide">RAABTA NOW</span>
                                </div>

                                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                                  <span className="text-slate-400 font-medium">Bank Name:</span>
                                  <span className="font-semibold text-white text-right">Askari Bank Limited</span>
                                </div>

                                {/* Account Number Row with Copy */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800/80">
                                  <span className="text-slate-400 font-medium">Account Number:</span>
                                  <div className="flex items-center justify-between sm:justify-end gap-2">
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm tracking-wider select-all">
                                      04910200000674
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyTill('04910200000674')}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                                        copiedTill
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                          : 'bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-600'
                                      }`}
                                      title="Copy Account Number"
                                    >
                                      {copiedTill ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* IBAN Row with Copy */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
                                  <span className="text-slate-400 font-medium">IBAN (Any Bank / Raast):</span>
                                  <div className="flex items-center justify-between sm:justify-end gap-2">
                                    <span className="font-mono font-bold text-cyan-400 text-xs sm:text-sm tracking-wider select-all break-all">
                                      PK05ASCM0004910200000674
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyIban('PK05ASCM0004910200000674')}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                                        copiedIban
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                          : 'bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-600'
                                      }`}
                                      title="Copy IBAN Number"
                                    >
                                      {copiedIban ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-navy-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed space-y-1">
                                  <p>
                                    💡 <strong className="text-white">How to Pay:</strong> Send Rs. 2500 from any banking or wallet app (Askari Bank, HBL, Meezan, JazzCash, Easypaisa, SadaPay, NayaPay, or Raast) to the <strong>Askari Bank Limited</strong> Account Number or IBAN above.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Proof Submission Form */}
                            <form onSubmit={handleSubmitManualProof} className="space-y-3 pt-1">
                              <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">
                                  Transaction ID / Reference Number (TID) *
                                </label>
                                <input
                                  type="text"
                                  value={manualTid}
                                  onChange={(e) => setManualTid(e.target.value.replace(/[^A-Za-z0-9\-_]/g, '').slice(0, 35))}
                                  placeholder="Enter Transaction ID (e.g. from JazzCash, Bank, SadaPay, or Raast)"
                                  className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-magenta-500 transition"
                                  required
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  Found on your payment receipt, SMS confirmation, or banking app transaction history.
                                </span>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">
                                  Payment Screenshot / Receipt Proof *
                                </label>
                                <div className="flex items-center gap-3">
                                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 border border-dashed border-slate-400/80 dark:border-slate-700 hover:border-magenta-500/60 bg-slate-100/80 dark:bg-navy-950/60 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:text-white transition overflow-hidden">
                                    <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[190px] sm:max-w-xs">{receiptFile ? receiptFile.name : 'Upload Screenshot (JPG, PNG, PDF max 5MB)'}</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,application/pdf"
                                      onChange={handleFileChange}
                                      className="hidden"
                                    />
                                  </label>
                                  {receiptPreview && (
                                    <img
                                      src={receiptPreview}
                                      alt="Preview"
                                      className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                                    />
                                  )}
                                </div>
                              </div>

                              <Button
                                type="submit"
                                variant="primary"
                                className="w-full font-bold shadow-md mt-2"
                                isLoading={submittingProof}
                                icon={CheckCircle}
                              >
                                Submit Payment Proof for Verification
                              </Button>

                              <p className="text-[11px] text-slate-400 text-center italic">
                                Pending admin verification. Payments are typically reviewed within a few hours during business hours.
                              </p>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {status?.pending_payment ? (
                      /* Sender has submitted proof and it is pending approval */
                      <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 space-y-3">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                                Payment Proof Submitted by Sender
                              </h5>
                              <Badge variant="warning" size="sm">Verification in Progress</Badge>
                            </div>
                            <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                              The sender has submitted their JazzCash / Bank payment receipt. Our admin team is currently verifying it. Once verified, Step 2 (Phone SMS Verification) will open automatically.
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-urdu leading-relaxed" dir="rtl">
                              بھیجنے والے نے فیس کی رسید جمع کروا دی ہے اور ایڈمن کی تصدیق جاری ہے۔ تصدیق مکمل ہوتے ہی آپ کو فون ویریفیکیشن کا آپشن مل جائے گا۔
                            </p>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-500/20">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            Has admin verified yet?
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={RefreshCw}
                            onClick={loadStatus}
                            isLoading={loading}
                            className="shrink-0 font-semibold text-xs"
                          >
                            Check Status / ریفریش کریں
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Sender has not paid yet */
                      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-100/70 dark:bg-navy-800/80 space-y-3">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1.5 flex-1">
                            <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                              <span>Next Steps / اگلا مرحلہ کیا ہوگا؟</span>
                            </h5>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              The request sender is responsible for the Rs. 2500 unlock fee. Once they complete payment and it is verified, you will be invited to enter your Pakistani mobile number for a quick 6-digit SMS verification.
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-urdu leading-relaxed" dir="rtl">
                              رابطہ انلاک فیس ادا کرنے کی ذمہ داری بھیجنے والے کی ہے۔ جیسے ہی وہ فیس ادا کریں گے، آپ کو اپنا موبائل نمبر درج کرنے کا کہا جائے گا جس پر SMS کے ذریعے 6 ہندسوں کا تصدیقی کوڈ موصول ہو گا۔
                            </p>
                          </div>
                        </div>

                        {/* Step by Step Flow for Receiver */}
                        <div className="bg-white/80 dark:bg-navy-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                            How contact unlock works / رابطہ کھلنے کا طریقہ کار:
                          </div>
                          <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-magenta-500/20 text-magenta-500 dark:text-magenta-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                              <span><strong>Sender Pays Fee:</strong> پروپوزل بھیجنے والا 2,500 روپے فیس ادا کرے گا۔</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-500 dark:text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                              <span><strong>Mutual SMS OTP:</strong> دونوں فریقین اپنے اپنے موبائل پر SMS کوڈ سے تصدیق کریں گے۔</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                              <span><strong>Contact Unlocked:</strong> دونوں کو ایک دوسرے کا موبائل اور واٹس ایپ نمبر مل جائے گا۔</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            Has sender completed payment?
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={RefreshCw}
                            onClick={loadStatus}
                            isLoading={loading}
                            className="shrink-0 font-semibold text-xs"
                          >
                            Refresh Status / دوبارہ چیک کریں
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SMS OTP VERIFICATION (Only active after payment is paid) */}
            {status?.is_paid && (
              <div className="p-3.5 sm:p-5 bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>Mutual Mobile Phone Verification</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ باہمی موبائل فون تصدیق</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Enter your Pakistani mobile number to receive a 6-digit SMS verification code.
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-urdu" dir="rtl">
                      اپنا پاکستانی موبائل نمبر درج کریں تاکہ آپ کو 6 ہندسوں کا SMS تصدیقی کوڈ موصول ہو سکے۔
                    </p>
                  </div>
                  {status?.my_verified && (
                    <Badge variant="success" size="sm" className="font-bold text-xs shrink-0">
                      Phone Verified / تصدیق شدہ
                    </Badge>
                  )}
                </div>

                {status?.my_verified ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        Your phone number (<strong className="text-slate-900 dark:text-white">{status.my_phone}</strong>) is verified!
                        <span className="block text-[11px] text-emerald-700 dark:text-emerald-400 font-urdu" dir="rtl">
                          آپ کا موبائل نمبر تصدیق ہو چکا ہے!
                        </span>
                      </div>
                    </div>

                    {!status.other_verified && (
                      <div className="p-3.5 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-slate-750 rounded-xl space-y-2">
                        <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              Waiting for the other candidate to complete phone verification.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                              You will receive an email and notification as soon as they verify.
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-urdu mt-1" dir="rtl">
                              دوسرے امیدوار کی فون تصدیق کا انتظار ہے۔ جیسے ہی وہ بھی کوڈ درج کریں گے، رابطہ نمبرز خودکار طریقے سے ظاہر ہو جائیں گے۔
                            </p>
                          </div>
                        </div>
                        <div className="pt-1 flex justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={RefreshCw}
                            onClick={loadStatus}
                            isLoading={loading}
                            className="font-semibold text-xs"
                          >
                            Check Status / ریفریش کریں
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {otpStep === 'input_phone' ? (
                      <form onSubmit={handleSendOtp} className="space-y-3">
                        <Input
                          label="Mobile Phone Number / موبائل فون نمبر"
                          placeholder="03001234567 or +923001234567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={sendingOtp}
                          helperText="A 6-digit code will be sent to this number via SMS. / اس نمبر پر 6 ہندسوں کا SMS کوڈ آئے گا۔"
                          required
                        />

                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full font-bold shadow-md"
                          loading={sendingOtp}
                          icon={Send}
                        >
                          Send 6-Digit SMS Code / تصدیقی کوڈ بھیجیں
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-300">
                              Enter 6-Digit Code / 6 ہندسوں کا کوڈ
                            </span>
                            <button
                              type="button"
                              onClick={() => setOtpStep('input_phone')}
                              className="text-magenta-600 dark:text-magenta-400 hover:underline font-semibold cursor-pointer text-[11px]"
                            >
                              Change Number ({phoneNumber}) / نمبر بدلیں
                            </button>
                          </div>
                          <Input
                            placeholder="6-digit OTP (e.g. 123456)"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            disabled={verifyingOtp}
                            className="font-mono text-center tracking-widest text-lg font-bold"
                            required
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={cooldown > 0 || sendingOtp}
                            onClick={handleSendOtp}
                            className="text-xs font-semibold"
                          >
                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend SMS / دوبارہ بھیجیں'}
                          </Button>

                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="font-bold shadow-md"
                            loading={verifyingOtp}
                            disabled={otpCode.length !== 6}
                            icon={CheckCircle}
                          >
                            Verify & Unlock / تصدیق کریں
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  </>
  );
}

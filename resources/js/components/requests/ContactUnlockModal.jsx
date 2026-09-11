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
        message: 'Payment of Rs. 300 PKR verified successfully! You can now verify your mobile phone.',
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        status?.is_unlocked
          ? 'Mutual Contact Details Unlocked'
          : 'Unlock Verified Contact Details'
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
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Mutual Verification Complete!</h4>
                <p className="text-xs text-emerald-300">
                  Both candidate profiles have completed phone verification. Direct contact information is unlocked below.
                </p>
              </div>
            </div>

            <div className="bg-navy-850 border border-slate-750 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-750/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Contact</span>
                  <h3 className="font-serif text-lg font-bold text-white">{contactData.name}</h3>
                </div>
                <Badge variant="success" size="sm" className="font-bold text-xs">
                  Verified Contact
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" /> Mobile / WhatsApp:
                  </span>
                  <span className="font-mono font-bold text-white">{contactData.phone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" /> Direct WhatsApp:
                  </span>
                  <a
                    href={contactData.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl hover:bg-emerald-500/25 transition-colors"
                  >
                    <span>Open WhatsApp Chat</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Registered Email:</span>
                  <span className="font-mono text-xs font-semibold text-slate-300">{contactData.email}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center">
              Please communicate with mutual respect, modesty, and genuine matrimonial intent.
            </p>
          </div>
        ) : (
          /* =========================================================================
             STAGE 1 & 2: PAYMENT & PHONE VERIFICATION PROGRESS
             ========================================================================= */
          <div className="space-y-5">
            {/* Stepper Header */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  status?.is_paid
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-navy-750 border-magenta-500/40 text-magenta-300'
                }`}
              >
                {status?.is_paid ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <CreditCard className="w-4 h-4 text-magenta-400 shrink-0" />
                )}
                <span>1. Unlock Fee (Rs. 300)</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  status?.my_verified
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-navy-850 border-slate-750 text-slate-400'
                }`}
              >
                {status?.my_verified ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>2. SMS OTP Verification</span>
              </div>
            </div>

            {/* STEP 1: PAYMENT (Sender Pays, Receiver Waits) */}
            {!status?.is_paid && (
              <div className="p-5 bg-navy-850 border border-slate-750 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-magenta-500/15 border border-magenta-500/30 text-magenta-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-white">
                      Contact Unlock Fee Required
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      A nominal fee of <strong className="text-white">Rs. 300 PKR</strong> is required to unlock direct contact numbers
                      and initiate two-way phone SMS verification.
                    </p>
                  </div>
                </div>

                {isSender ? (
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between text-xs bg-navy-800 p-3 rounded-xl border border-slate-700">
                      <span className="text-slate-400 font-semibold">Initiator (You):</span>
                      <span className="font-extrabold text-amber-300 text-sm">Rs. 300.00 PKR</span>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full font-bold shadow-md"
                      loading={paying}
                      onClick={handleInitiateAndVerifyPayment}
                      icon={CreditCard}
                    >
                      Pay Rs. 300 & Unlock Phone Verification
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-navy-800 border border-slate-700 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      The request sender is responsible for the unlock fee. Once they complete payment, you will be invited to verify your mobile phone.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SMS OTP VERIFICATION (Only active after payment is paid) */}
            {status?.is_paid && (
              <div className="p-5 bg-navy-850 border border-slate-750 rounded-2xl space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-serif font-bold text-base text-white">
                      Mutual Mobile Phone Verification
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter your Pakistani mobile number to receive a 6-digit SMS verification code.
                    </p>
                  </div>
                  {status?.my_verified && (
                    <Badge variant="success" size="sm" className="font-bold text-xs shrink-0">
                      Your Phone Verified
                    </Badge>
                  )}
                </div>

                {status?.my_verified ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        Your phone number (<strong className="text-white">{status.my_phone}</strong>) is verified!
                      </div>
                    </div>

                    {!status.other_verified && (
                      <div className="p-3 bg-navy-800 border border-slate-750 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Waiting for the other candidate to complete their phone verification. You will receive an email confirmation once both are verified.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {otpStep === 'input_phone' ? (
                      <form onSubmit={handleSendOtp} className="space-y-3">
                        <Input
                          label="Mobile Phone Number"
                          placeholder="03001234567 or +923001234567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={sendingOtp}
                          helperText="A 6-digit code will be sent to this number via SMS."
                          required
                        />

                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full font-bold"
                          loading={sendingOtp}
                          icon={Send}
                        >
                          Send 6-Digit SMS Code
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-300">Enter 6-Digit Code</span>
                            <button
                              type="button"
                              onClick={() => setOtpStep('input_phone')}
                              className="text-magenta-400 hover:underline font-semibold cursor-pointer"
                            >
                              Change Number ({phoneNumber})
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
                            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend SMS Code'}
                          </Button>

                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="font-bold"
                            loading={verifyingOtp}
                            disabled={otpCode.length !== 6}
                            icon={CheckCircle}
                          >
                            Verify OTP
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
  );
}

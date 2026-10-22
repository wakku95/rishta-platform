import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, HeartHandshake, AlertCircle, CheckCircle, Lock, UserPlus, LogIn, FileText, ShieldCheck, Clock } from 'lucide-react';
import { submitListingInterest } from '../../api/listings';
import useAuth from '../../hooks/useAuth';

export default function ExpressInterestModal({ isOpen, onClose, listing }) {
  const { user, authenticated, hasProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    submitter_name: '',
    submitter_contact: '',
    submitter_email: '',
    family_details: '',
    questions: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
      // Pre-fill if logged in
      if (authenticated && user) {
        setFormData({
          submitter_name: user.name || '',
          submitter_contact: user.phone || user.contact_number || '',
          submitter_email: user.email || '',
          family_details: '',
          questions: '',
        });
      } else {
        setFormData({
          submitter_name: '',
          submitter_contact: '',
          submitter_email: '',
          family_details: '',
          questions: '',
        });
      }
    }
  }, [isOpen, authenticated, user]);

  if (!isOpen || !listing) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parts = [];
    if (formData.family_details?.trim()) {
      parts.push(`[Family Info / تعارف]:\n${formData.family_details.trim()}`);
    }
    if (formData.questions?.trim()) {
      parts.push(`[Questions for Candidate / سوالات]:\n${formData.questions.trim()}`);
    }
    const combinedMessage = parts.join('\n\n');

    try {
      await submitListingInterest(listing.listing_code, {
        submitter_name: formData.submitter_name,
        submitter_contact: formData.submitter_contact,
        submitter_email: formData.submitter_email,
        message: combinedMessage,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to submit interest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
        
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-navy-800/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-500" />
              Express Interest / اظہارِ دلچسپی
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Assisted Matchmaking Inquiry • Listing #{listing.listing_code}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Interest Submitted / درخواست موصول ہوگئی</h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                Thank you! Our personal matchmaker will review your profile and contact you directly at <strong>{formData.submitter_contact}</strong> to facilitate the match.
              </p>
              <p className="text-xs text-amber-300 mt-2 font-urdu" dir="rtl">
                شکریہ! ہمارا رشتہ ایجنٹ آپ کی تفصیلات دیکھ کر آپ کے فراہم کردہ نمبر پر براہِ راست رابطہ کرے گا۔
              </p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-navy-800 border border-white/10 text-white font-bold rounded-xl hover:bg-navy-700 transition"
              >
                Close / بند کریں
              </button>
            </div>
          ) : !authenticated ? (
            <div className="text-center py-6 px-2 space-y-4">
              <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  Account Required / اکاؤنٹ ضروری ہے
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  To ensure candidate safety and serious matrimonial inquiries, please sign in or register your free account to express interest in <strong>#{listing.listing_code}</strong>.
                </p>
                <p className="text-xs text-amber-300/90 leading-relaxed font-urdu" dir="rtl">
                  امیدوار کے تحفظ اور سنجیدہ رشتوں کو یقینی بنانے کے لیے، اظہارِ دلچسپی سے قبل لاگ ان یا مفت اکاؤنٹ بنانا ضروری ہے۔
                </p>
              </div>

              <div className="p-3.5 bg-navy-800/80 border border-white/5 rounded-xl text-left text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Why is an Account Required?</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your registered profile biodata (age, education, city, profession) will be securely presented by our matchmaker to the candidate's family for mutual review.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-750 border border-slate-750 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-slate-400" />
                  <span>Log In to Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/register?redirect=${encodeURIComponent(location.pathname)}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Free Profile</span>
                </button>
              </div>
            </div>
          ) : !hasProfile ? (
            <div className="text-center py-6 px-2 space-y-4">
              <div className="w-14 h-14 bg-magenta-500/15 border border-magenta-500/30 rounded-2xl flex items-center justify-center mx-auto text-magenta-400">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  Create Your Matrimonial Profile First
                </h3>
                <h4 className="text-sm font-urdu text-amber-300 font-bold" dir="rtl">
                  پہلے اپنا رشتہ پروفائل بنائیں
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  You are signed in as <strong>{user?.name}</strong>, but you haven't created your matrimonial biodata profile yet. Please complete your basic profile so the candidate family can review your suitability.
                </p>
                <p className="text-xs text-amber-300/90 leading-relaxed font-urdu" dir="rtl">
                  آپ لاگ ان ہیں لیکن آپ کا رشتہ بائیوڈیٹا نہیں بنا ہوا۔ پہلے اپنا پروفائل بنائیں تاکہ فیملی آپ کی تفصیلات دیکھ سکے۔
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-magenta-500 to-purple-600 hover:from-magenta-600 hover:to-purple-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-magenta-500/20 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Create My Biodata Profile Now</span>
                </button>
              </div>
            </div>
          ) : !user?.is_identity_verified ? (
            <div className="text-center py-6 px-2 space-y-4">
              <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  CNIC & Live Selfie Verification Required
                </h3>
                <h4 className="text-sm font-urdu text-amber-300 font-bold" dir="rtl">
                  شناختی کارڈ اور لائیو تصویر کی تصدیق ضروری ہے
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  To safeguard candidate family dignity and prevent non-serious inquiries, our personal matchmakers only introduce candidates whose government CNIC and live selfie are manually verified.
                </p>
                <p className="text-xs text-amber-300/90 leading-relaxed font-urdu" dir="rtl">
                  خاندانی وقار اور غیر سنجیدہ افراد کے سدِباب کے لیے اسسٹڈ رشتوں میں صرف تصدیق شدہ (Verified) اُمیدواروں کی درخواستیں ہی آگے بڑھائی جاتی ہیں۔
                </p>
              </div>

              {user?.identity_verification_status === 'pending' ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left text-xs text-amber-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <Clock className="w-4 h-4" />
                    <span>Audit Pending / تصدیق زیرِ غور ہے</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Your CNIC and Live Selfie have been submitted and are currently in the admin audit queue. Once approved, you can express interest immediately.
                  </p>
                </div>
              ) : user?.identity_verification_status === 'rejected' ? (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-left text-xs text-rose-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-300">
                    <AlertCircle className="w-4 h-4" />
                    <span>Verification Rejected / دوبارہ جمع کروائیں</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Your previous identity submission was not approved. Please re-submit a clear live photo and CNIC.
                  </p>
                </div>
              ) : null}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/verification')}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {user?.identity_verification_status === 'pending'
                      ? 'Check Verification Status'
                      : user?.identity_verification_status === 'rejected'
                      ? 'Re-submit Identity Verification'
                      : 'Verify My Identity Now (شناختی تصدیق کروائیں)'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Notice Banner & Fee Policy */}
              <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2.5 text-xs">
                <div className="text-slate-200 leading-relaxed">
                  You are inquiring about listing <strong className="text-amber-400">{listing.listing_code}</strong>. Our personal matchmaker will review your verified profile and contact both families directly.
                </div>
                <div className="text-amber-300/90 leading-relaxed font-urdu text-right" dir="rtl">
                  آپ لسٹنگ <strong className="text-amber-300">{listing.listing_code}</strong> کے لیے رابطہ کر رہے ہیں۔ ہمارا رشتہ ایجنٹ دونوں فریقین سے باضابطہ رابطہ کر کے بات آگے بڑھائے گا۔
                </div>
                <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
                  <div className="flex items-start gap-1.5 font-semibold text-amber-300">
                    <span>💰</span>
                    <span>Service Fee Notice / فیس کا نوٹ:</span>
                  </div>
                  <p className="text-slate-300 leading-normal pl-4">
                    Personal matchmaking facilitation fee applies for this service and will be coordinated directly by our agent after discussing mutual compatibility.
                  </p>
                  <p className="text-amber-200/80 leading-normal pl-4 font-urdu text-right" dir="rtl">
                    اس پرسنل میچ میکنگ سروس کی فیس رشتہ ایجنٹ دونوں خاندانوں سے براہ راست طے اور وصول کرے گا۔
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="interest-form" onSubmit={handleSubmit} className="space-y-4">
                
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-xl font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Using your registered profile (<strong>{user?.name}</strong>)</span>
                  </div>
                  {user?.profile?.profile_code && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-900 border border-emerald-500/30 text-emerald-300">
                      #{user.profile.profile_code}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name / پورا نام <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="submitter_name"
                    required 
                    placeholder="Enter your full name"
                    value={formData.submitter_name} 
                    onChange={handleChange} 
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone Number / رابطہ نمبر <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="submitter_contact"
                    required 
                    placeholder="+923XXXXXXXXX"
                    value={formData.submitter_contact} 
                    onChange={handleChange} 
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none font-mono" 
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Our agent will contact you directly on this phone number.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (Optional) / ای میل ایڈریس
                  </label>
                  <input 
                    type="email" 
                    name="submitter_email"
                    placeholder="name@example.com"
                    value={formData.submitter_email} 
                    onChange={handleChange} 
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    About Yourself & Family / اپنے اور فیملی کے بارے میں مزید تفصیلات
                  </label>
                  <textarea 
                    name="family_details"
                    rows="2"
                    placeholder="e.g. Education, Profession, City, Caste, Family background..."
                    value={formData.family_details} 
                    onChange={handleChange} 
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" 
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    What would you like to know from the candidate? / امیدوار سے آپ کیا پوچھنا چاہتے ہیں؟
                  </label>
                  <textarea 
                    name="questions"
                    rows="2"
                    placeholder="Specific questions or preferences you want our matchmaker to ask the other family..."
                    value={formData.questions} 
                    onChange={handleChange} 
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" 
                  ></textarea>
                </div>
              </form>
            </>
          )}
        </div>

        {!success && authenticated && hasProfile && (
          <div className="shrink-0 p-4 border-t border-white/10 bg-navy-800/50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Coordinated via Matchmaker
            </span>
            <div className="flex items-center gap-3 ml-auto">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
              >
                Cancel / منسوخ
              </button>
              <button 
                type="submit"
                form="interest-form"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition disabled:opacity-50 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                {loading ? 'Submitting...' : 'Submit Inquiry / انکوائری بھیجیں'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

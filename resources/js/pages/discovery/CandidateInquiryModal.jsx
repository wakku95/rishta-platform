import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { submitProfileInquiry } from '../../api/discovery';
import useAuth from '../../hooks/useAuth';

export default function CandidateInquiryModal({ isOpen, onClose, candidate }) {
  const { user, isAuthenticated } = useAuth();

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
      if (isAuthenticated && user) {
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
  }, [isOpen, isAuthenticated, user]);

  if (!isOpen || !candidate) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitProfileInquiry(candidate.profile_code, {
        submitter_name: formData.submitter_name,
        submitter_contact: formData.submitter_contact,
        submitter_email: formData.submitter_email || null,
        family_details: formData.family_details || null,
        questions: formData.questions || null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-navy-800/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-500" />
              Inquire via Matchmaker / رشتہ ایجنٹ کے ذریعے رابطہ
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct Agent Inquiry • Candidate #{candidate.profile_code}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Inquiry Received / درخواست موصول ہوگئی
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                Thank you! Our matchmaker agent will review your details, coordinate with the candidate's family, and contact you directly on WhatsApp at <strong>{formData.submitter_contact}</strong>.
              </p>
              <p className="text-xs text-amber-300 mt-2 font-urdu" dir="rtl">
                شکریہ! ہمارا رشتہ ایجنٹ آپ کی تفصیلات دیکھ کر دونوں فریقین سے واٹس ایپ پر رابطہ کرے گا۔
              </p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-navy-800 border border-white/10 text-white font-bold rounded-xl hover:bg-navy-700 transition"
              >
                Close / بند کریں
              </button>
            </div>
          ) : (
            <>
              {/* Informative Notice & Fee Banner */}
              <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-start gap-2 text-slate-200 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    This inquiry is handled directly by our <strong>RaabtaNow Matchmaker Agent</strong>. No automated request is sent to the candidate; our agent will discuss compatibility and mediate between both families on WhatsApp.
                  </div>
                </div>
                <div className="text-amber-300/90 leading-relaxed font-urdu text-right" dir="rtl">
                  یہ انکوائری ہمارے رشتہ ایجنٹ کے ذریعے ہینڈل کی جائے گی۔ امیدوار کو براہ راست آٹومیٹک ریکویسٹ نہیں جائے گی، بلکہ ہمارا نمائندہ واٹس ایپ پر دونوں فریقین سے رابطہ کرے گا۔
                </div>
                <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
                  <div className="flex items-start gap-1.5 font-semibold text-amber-300">
                    <span>💰</span>
                    <span>Service Fee Notice / فیس کا نوٹ:</span>
                  </div>
                  <p className="text-slate-300 leading-normal pl-4">
                    Personal matchmaking facilitation fee applies for this service and will be coordinated directly by our agent on WhatsApp after discussing mutual compatibility.
                  </p>
                  <p className="text-amber-200/80 leading-normal pl-4 font-urdu text-right" dir="rtl">
                    اس پرسنل میچ میکنگ سروس کی فیس رشتہ ایجنٹ واٹس ایپ پر براہ راست طے اور وصول کرے گا۔
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="candidate-inquiry-form" onSubmit={handleSubmit} className="space-y-4">
                
                {isAuthenticated && (
                  <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Using your RaabtaNow verified account info.
                  </div>
                )}

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
                    disabled={isAuthenticated}
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none disabled:opacity-70" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp Contact Number / واٹس ایپ نمبر <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="submitter_contact"
                    required
                    placeholder="+923XXXXXXXXX"
                    value={formData.submitter_contact} 
                    onChange={handleChange} 
                    disabled={isAuthenticated && !!user?.phone}
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none disabled:opacity-70 font-mono" 
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Our agent will contact you on this number via WhatsApp.
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
                    disabled={isAuthenticated}
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none disabled:opacity-70" 
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
                    placeholder="Specific questions or preferences you want our matchmaker to ask the candidate family..."
                    value={formData.questions} 
                    onChange={handleChange} 
                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" 
                  ></textarea>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="shrink-0 p-4 border-t border-white/10 bg-navy-800/50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Assisted Matchmaking
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
                form="candidate-inquiry-form"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition disabled:opacity-50 shadow-md shadow-amber-500/20"
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

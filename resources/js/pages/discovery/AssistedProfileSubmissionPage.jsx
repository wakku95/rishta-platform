import React, { useState, useEffect } from 'react';
import { getProfileOptions } from '../../api/profile';
import axios from 'axios';
import { CheckCircle2, Shield, EyeOff, Globe, Send, ArrowRight, ArrowLeft } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';
import Badge from '../../components/ui/Badge';

export default function AssistedProfileSubmissionPage() {
  const [step, setStep] = useState(1);
  const [options, setOptions] = useState(null);
  
  const [formData, setFormData] = useState({
    submitter_name: '',
    submitter_contact: '',
    public_biodata: {
      gender: '',
      date_of_birth: '',
      marital_status: '',
      city: '',
      religion: '',
      sect: '',
      education: '',
      profession: '',
      height: '',
      managed_by: '',
      public_about: ''
    },
    terms_accepted: false,
    social_publication_consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getProfileOptions().then(res => setOptions(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('public_biodata.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        public_biodata: {
          ...prev.public_biodata,
          [key]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/assisted-submissions', formData);
      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "An error occurred during submission.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-8 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-white">Submission Received</h1>
          <h2 className="font-urdu text-3xl font-bold text-emerald-400" dir="rtl">آپ کی درخواست موصول ہوگئی ہے</h2>
          
          <div className="p-6 bg-navy-800 border border-slate-700 rounded-2xl text-left space-y-4">
            <p className="text-slate-300">
              Thank you. Your Assisted Profile request has been submitted successfully.<br/><br/>
              Our team will review the information and approve or reject the request.<br/>
              Your profile will not be published until it has been reviewed and approved.
            </p>
            <div className="h-px bg-slate-700 my-4" />
            <p className="text-slate-300 font-urdu text-lg text-right" dir="rtl">
              شکریہ۔ آپ کی Assisted Profile کی درخواست کامیابی سے جمع ہوگئی ہے۔<br/><br/>
              ہماری ٹیم آپ کی فراہم کردہ معلومات کا جائزہ لے گی اور درخواست کو approve یا reject کرے گی۔<br/>
              جائزہ اور منظوری سے پہلے آپ کا profile public طور پر publish نہیں کیا جائے گا۔
            </p>
          </div>

          <div className="mt-12 text-left">
            <h3 className="font-bold text-white mb-2">This is how your profile may look on Facebook/Instagram</h3>
            <h4 className="font-urdu text-lg text-slate-400 mb-4" dir="rtl">Facebook/Instagram پر آپ کا پروفائل اس طرح نظر آ سکتا ہے</h4>
            <p className="text-xs text-amber-500 mb-6 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              This is a preview only. Your profile will not be published until it is reviewed and approved.<br/>
              یہ صرف preview ہے۔ آپ کے پروفائل کو review اور approve ہونے سے پہلے public طور پر publish نہیں کیا جائے گا۔
            </p>

            {/* Non-published preview card */}
            <div className="bg-navy-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl max-w-md mx-auto">
              <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 text-center">
                <Badge variant="navy" className="bg-slate-950/50 text-white border-0">Assisted Matrimonial Profile</Badge>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500">Gender / Marital</span>
                    <strong className="text-slate-200 capitalize">{formData.public_biodata.gender || '---'} • {formData.public_biodata.marital_status || '---'}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">City</span>
                    <strong className="text-slate-200 capitalize">{formData.public_biodata.city || '---'}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Religion / Sect</span>
                    <strong className="text-slate-200 capitalize">{formData.public_biodata.religion || '---'} {formData.public_biodata.sect ? `(${formData.public_biodata.sect})` : ''}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Education</span>
                    <strong className="text-slate-200 capitalize">{formData.public_biodata.education || '---'}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Profession</span>
                    <strong className="text-slate-200 capitalize">{formData.public_biodata.profession || '---'}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Height</span>
                    <strong className="text-slate-200">{formData.public_biodata.height || '---'} cm</strong>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <span className="block text-xs text-slate-500 mb-1">About</span>
                  <p className="text-sm text-slate-300 italic">"{formData.public_biodata.public_about || '...'}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-20 px-4 sm:px-6">
      <SEOHead title="Submit Assisted Profile | RaabtaNow" description="Submit your matrimonial profile for admin assistance." />
      
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="gold">Assisted Services</Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">Create Your Assisted Profile</h1>
          <h2 className="font-urdu text-3xl font-bold text-amber-500" dir="rtl">اپنا Assisted Profile بنائیں</h2>
          
          <div className="max-w-2xl mx-auto text-sm text-slate-400 space-y-2">
            <p>Provide your basic information. Our team will review your submission and create your assisted profile after approval.</p>
            <p className="font-urdu text-lg" dir="rtl">اپنی بنیادی معلومات فراہم کریں۔ ہماری ٹیم آپ کی معلومات کا جائزہ لے گی اور منظوری کے بعد آپ کا Assisted Profile بنائے گی۔</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-8">
            
            {/* Private Section */}
            <div className="bg-navy-900 border border-rose-500/30 rounded-2xl overflow-hidden">
              <div className="bg-rose-500/10 p-4 border-b border-rose-500/20 flex gap-3 items-center">
                <EyeOff className="w-6 h-6 text-rose-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-lg">🔒 Private Information — Never Public</h3>
                  <h4 className="font-urdu text-rose-400 font-bold" dir="rtl">نجی معلومات — عوامی طور پر ظاہر نہیں کی جائیں گی</h4>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-sm text-slate-400">
                  This information is only collected so RaabtaNow can contact you and manage your request. It will NOT be displayed on your RaabtaNow public profile or Facebook/Instagram listing.
                </p>
                <p className="font-urdu text-slate-400 text-base text-right" dir="rtl">
                  یہ معلومات صرف RaabtaNow کی ٹیم سے رابطے اور آپ کی درخواست کو manage کرنے کے لیے لی جاتی ہیں۔ یہ معلومات آپ کے public profile یا Facebook/Instagram پر ظاہر نہیں کی جائیں گی۔
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name <span className="text-rose-500">*</span></label>
                    <input type="text" name="submitter_name" required value={formData.submitter_name} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Number (WhatsApp) <span className="text-rose-500">*</span></label>
                    <input type="text" name="submitter_contact" placeholder="03XXXXXXXXX" required value={formData.submitter_contact} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Public Biodata Section */}
            <div className="bg-navy-900 border border-emerald-500/30 rounded-2xl overflow-hidden">
              <div className="bg-emerald-500/10 p-4 border-b border-emerald-500/20 flex gap-3 items-center">
                <Globe className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-lg">🌐 Public Biodata</h3>
                  <h4 className="font-urdu text-emerald-400 font-bold" dir="rtl">عوامی پروفائل کی معلومات</h4>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-sm text-slate-400">
                  The information in this section may appear on your RaabtaNow assisted profile. If you separately consent to social media publication, the approved basic information may also be used in your Facebook/Instagram matrimonial listing.
                </p>
                <p className="font-urdu text-slate-400 text-base text-right" dir="rtl">
                  اس حصے کی معلومات آپ کے RaabtaNow assisted profile پر ظاہر ہو سکتی ہیں۔ اگر آپ Facebook/Instagram پر publication کی الگ اجازت دیتے ہیں تو منظور شدہ بنیادی معلومات وہاں بھی matrimonial listing کے طور پر استعمال کی جا سکتی ہیں۔
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gender <span className="text-emerald-500">*</span></label>
                    <select name="public_biodata.gender" required value={formData.public_biodata.gender} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">Select Gender</option>
                      {options?.genders?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth <span className="text-emerald-500">*</span></label>
                    <input type="date" name="public_biodata.date_of_birth" required value={formData.public_biodata.date_of_birth} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Marital Status <span className="text-emerald-500">*</span></label>
                    <select name="public_biodata.marital_status" required value={formData.public_biodata.marital_status} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">Select Marital Status</option>
                      {options?.marital_statuses?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">City <span className="text-emerald-500">*</span></label>
                    <select name="public_biodata.city" required value={formData.public_biodata.city} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">Select City</option>
                      {options?.cities?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Religion <span className="text-emerald-500">*</span></label>
                    <select name="public_biodata.religion" required value={formData.public_biodata.religion} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">Select Religion</option>
                      {options?.religions?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sect</label>
                    <select name="public_biodata.sect" value={formData.public_biodata.sect} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">Select Sect (Optional unless Islam)</option>
                      {options?.sects?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Education <span className="text-emerald-500">*</span></label>
                    <select name="public_biodata.education" required value={formData.public_biodata.education} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">Select Education</option>
                      {options?.educations?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Profession <span className="text-emerald-500">*</span></label>
                    <select name="public_biodata.profession" required value={formData.public_biodata.profession} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">Select Profession</option>
                      {options?.professions?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Height (cm) <span className="text-emerald-500">*</span></label>
                    <input type="number" name="public_biodata.height" required min="120" max="250" value={formData.public_biodata.height} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Managed By <span className="text-emerald-500">*</span></label>
                    <select name="public_biodata.managed_by" required value={formData.public_biodata.managed_by} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">Select Managed By</option>
                      {options?.managed_by?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Public About</label>
                    <textarea name="public_biodata.public_about" rows="4" placeholder="Briefly describe the candidate..." value={formData.public_biodata.public_about} onChange={handleChange} className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition">
                Continue to Review <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-navy-900 border border-amber-500/30 rounded-2xl overflow-hidden p-6 text-center space-y-4">
              <h3 className="font-bold text-white text-xl">Review Your Information</h3>
              <h4 className="font-urdu text-amber-500 text-xl font-bold" dir="rtl">اپنی معلومات کا جائزہ لیں</h4>
            </div>

            <div className="bg-navy-800 border border-slate-700 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-rose-400">Private — Not Public</h4>
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-900/50 p-4 rounded-xl">
                <div>
                  <span className="block text-xs text-slate-500">Full Name</span>
                  <strong className="text-white">{formData.submitter_name}</strong>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Contact Number</span>
                  <strong className="text-white">{formData.submitter_contact}</strong>
                </div>
              </div>

              <h4 className="font-bold text-emerald-400 mt-6">Public Profile</h4>
              <div className="bg-slate-900/50 p-4 rounded-xl text-sm">
                <p className="text-xs text-amber-500 mb-4 border-l-2 border-amber-500 pl-3">
                  This is how your basic profile information may appear publicly on RaabtaNow and, if you have given social-media consent, on Facebook/Instagram.<br/>
                  <span className="font-urdu block mt-1" dir="rtl">آپ کی بنیادی پروفائل معلومات RaabtaNow پر عوامی طور پر اور، اگر آپ نے اجازت دی ہے، تو Facebook/Instagram پر اس طرح ظاہر ہو سکتی ہیں۔</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-xs text-slate-500">Gender</span>
                    <strong className="text-white capitalize">{formData.public_biodata.gender}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">DOB</span>
                    <strong className="text-white">{formData.public_biodata.date_of_birth}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Marital Status</span>
                    <strong className="text-white capitalize">{formData.public_biodata.marital_status}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">City</span>
                    <strong className="text-white capitalize">{formData.public_biodata.city}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Religion</span>
                    <strong className="text-white capitalize">{formData.public_biodata.religion}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Sect</span>
                    <strong className="text-white capitalize">{formData.public_biodata.sect || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Education</span>
                    <strong className="text-white capitalize">{formData.public_biodata.education}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Profession</span>
                    <strong className="text-white capitalize">{formData.public_biodata.profession}</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Height</span>
                    <strong className="text-white">{formData.public_biodata.height} cm</strong>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Managed By</span>
                    <strong className="text-white capitalize">{formData.public_biodata.managed_by}</strong>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="block text-xs text-slate-500">Public About</span>
                  <p className="text-white">"{formData.public_biodata.public_about}"</p>
                </div>
              </div>
            </div>

            {/* Social Consent (Optional) */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
              <h3 className="font-bold text-blue-400 mb-1">📱 Facebook & Instagram Publication Consent (Optional)</h3>
              <h4 className="font-urdu text-blue-400 font-bold mb-4" dir="rtl">Facebook اور Instagram پر پروفائل کی اشاعت کی اجازت</h4>
              <p className="text-sm text-slate-300 mb-2">
                If you agree, RaabtaNow may use the approved public/basic information from your assisted profile to create a matrimonial post/listing on RaabtaNow's official Facebook and Instagram pages. Your private name, phone number and private information will not be published.
              </p>
              <p className="font-urdu text-base text-slate-300 mb-6 text-right" dir="rtl">
                اگر آپ اجازت دیتے ہیں تو RaabtaNow آپ کے assisted profile کی منظور شدہ بنیادی/عوامی معلومات استعمال کرتے ہوئے اپنے official Facebook اور Instagram pages پر matrimonial post/listing شائع کر سکتا ہے۔ آپ کا نجی نام، فون نمبر اور نجی معلومات public نہیں کی جائیں گی۔
              </p>
              <label className="flex items-start gap-3 cursor-pointer bg-blue-950/50 p-4 rounded-xl border border-blue-900 hover:bg-blue-900/40 transition">
                <input type="checkbox" name="social_publication_consent" checked={formData.social_publication_consent} onChange={handleChange} className="mt-1 w-5 h-5 accent-blue-500" />
                <div>
                  <span className="block text-sm text-white font-medium">I give RaabtaNow permission to publish my approved public profile information on its official Facebook and Instagram pages for matrimonial/matchmaking purposes.</span>
                  <span className="block font-urdu text-sm text-slate-300 mt-1" dir="rtl">میں RaabtaNow کو اجازت دیتا/دیتی ہوں کہ وہ میری منظور شدہ عوامی پروفائل معلومات کو matrimonial/matchmaking مقصد کے لیے اپنے official Facebook اور Instagram pages پر شائع کرے۔</span>
                </div>
              </label>
            </div>

            {/* Terms Consent (Required) */}
            <div className="bg-navy-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-1">Terms & Conditions / شرائط و ضوابط</h3>
              <ul className="text-xs text-slate-400 list-disc pl-5 space-y-2 mb-6">
                <li>The customer confirms that the information they provide is accurate to the best of their knowledge.</li>
                <li>RaabtaNow is a matrimonial/matchmaking platform and does not guarantee a successful match or marriage.</li>
                <li>RaabtaNow does not independently verify every piece of information provided by users/assisted-profile customers unless a separate verification service is explicitly stated.</li>
                <li>Users should independently verify identity, family information, education, marital status and other important information before proceeding with a proposal or relationship.</li>
                <li>RaabtaNow is not responsible for false or misleading information supplied by a customer or third party.</li>
                <li>Private contact information will not be displayed publicly as part of the assisted profile.</li>
                <li>The customer understands what information will be public. Social-media publication requires a separate explicit consent.</li>
                <li>RaabtaNow may reject or remove submissions that violate its rules or contain inappropriate, misleading or prohibited content.</li>
              </ul>
              <label className="flex items-start gap-3 cursor-pointer bg-navy-900 p-4 rounded-xl border border-slate-700 hover:bg-navy-750 transition">
                <input type="checkbox" name="terms_accepted" required checked={formData.terms_accepted} onChange={handleChange} className="mt-1 w-5 h-5 accent-amber-500" />
                <div>
                  <span className="block text-sm text-white font-medium">I have read and agree to the Terms & Conditions. <span className="text-rose-500">*</span></span>
                  <span className="block font-urdu text-sm text-slate-300 mt-1" dir="rtl">میں نے شرائط و ضوابط پڑھ لیے ہیں اور ان سے اتفاق کرتا/کرتی ہوں۔</span>
                </div>
              </label>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button type="button" onClick={handlePrevStep} className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white transition font-medium">
                <ArrowLeft className="w-5 h-5" /> Back to Edit
              </button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Profile Request'} <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

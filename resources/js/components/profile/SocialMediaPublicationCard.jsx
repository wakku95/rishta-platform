import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Share2, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, XCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

export default function SocialMediaPublicationCard({ profile, isActive }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [latestRequest, setLatestRequest] = useState(null);
  
  const [formData, setFormData] = useState({
    platforms: [],
    consent_given: false
  });

  const fetchLatestRequest = async () => {
    try {
      const res = await axios.get('/api/social-media-publication-requests/latest');
      setLatestRequest(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestRequest();
  }, []);

  const handlePlatformChange = (platform) => {
    setFormData(prev => {
      const platforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms };
    });
  };

  const handleSubmit = async () => {
    if (formData.platforms.length === 0) {
      alert();
      return;
    }
    if (!formData.consent_given) {
      alert();
      return;
    }
    
    setSubmitLoading(true);
    try {
      const res = await axios.post('/api/social-media-publication-requests', {
        requested_platforms: formData.platforms,
        consent_given: formData.consent_given
      });
      alert();
      setModalOpen(false);
      fetchLatestRequest();
    } catch (err) {
      alert();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!latestRequest) return;
    if (!window.confirm('Are you sure you want to request removal of your profile from social media?')) return;
    
    setSubmitLoading(true);
    try {
      const res = await axios.post(`/api/social-media-publication-requests/${latestRequest.id}/remove`);
      alert();
      fetchLatestRequest();
    } catch (err) {
      alert();
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <Card className="p-6 bg-navy-800 border-slate-750 shadow-md animate-pulse h-32" />;
  }

  const hasActiveRequest = latestRequest && ['pending', 'approved', 'published', 'removal_requested'].includes(latestRequest.status);

  return (
    <>
      <Card className="p-6 bg-navy-800 border border-slate-750 shadow-md space-y-4 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 pb-2 border-b border-slate-750">
          <Share2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-serif font-extrabold text-white">Social Media Promotion</h2>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300 font-normal leading-relaxed">
            Voluntarily request to display your profile on RaabtaNow's official Facebook and Instagram pages to reach more people.
          </p>

          {!isActive ? (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 mb-1 inline-block mr-1" />
              Your profile needs to be active before you can request Facebook or Instagram publication.
            </div>
          ) : hasActiveRequest ? (
            <div className="bg-navy-900 border border-slate-700 p-3 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase">Status</span>
                <Badge variant={
                  latestRequest.status === 'published' ? 'success' :
                  latestRequest.status === 'removal_requested' ? 'danger' : 'warning'
                }>{latestRequest.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-xs text-slate-300">
                {latestRequest.status === 'pending' && 'Your request is waiting for admin review.'}
                {latestRequest.status === 'approved' && 'Your request has been approved and is ready for publication.'}
                {latestRequest.status === 'published' && 'Your approved profile has been published on the selected platform(s).'}
                {latestRequest.status === 'removal_requested' && 'Your request to remove the social-media publication has been received.'}
              </p>
              
              {(latestRequest.status === 'published' || latestRequest.status === 'approved' || latestRequest.status === 'pending') && (
                <button onClick={handleRemove} disabled={submitLoading} className="text-rose-400 hover:text-rose-300 text-xs font-bold underline mt-2">
                  Request Removal
                </button>
              )}
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="w-full font-bold bg-blue-600 hover:bg-blue-500 text-white border-blue-500">
              Promote My Profile <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Promote Profile on Social Media"
        subtitle="Review what information will be published."
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitLoading || !formData.consent_given || formData.platforms.length === 0} className="bg-blue-600 hover:bg-blue-500 text-white">
              {submitLoading ? 'Submitting...' : 'Submit Publication Request'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-sm">
          {/* Info Section */}
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-4">
            <div>
              <h4 className="font-bold text-emerald-400 flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4" /> What may be published</h4>
              <p className="text-xs text-slate-300 mb-2">Only the public information shown in the preview below may be shared.</p>
              <div className="bg-navy-800 p-4 rounded-lg border border-slate-700">
                <span className="font-mono text-xs uppercase tracking-wider text-blue-300 font-bold mb-2 block">RaabtaNow Profile: {profile?.profile_code}</span>
                <p className="text-white font-bold">{profile?.gender} | {profile?.age} years old | {profile?.city}</p>
                <p className="text-slate-300 mt-1">{profile?.education} | {profile?.profession}</p>
                <p className="text-slate-300">{profile?.marital_status?.replace('_', ' ')}</p>
                <p className="text-slate-300">Height: {profile?.height_formatted}</p>
                {profile?.religion && <p className="text-slate-300">{profile.religion}{profile.sect ? ` (${profile.sect})` : ''}</p>}
                {profile?.about && <p className="text-slate-300 mt-2 italic">"{profile.about}"</p>}
                <p className="text-blue-300 mt-4 font-bold">Interested? Contact RaabtaNow for further details.</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h4 className="font-bold text-rose-400 flex items-center gap-2 mb-2"><XCircle className="w-4 h-4" /> What will NOT be published</h4>
              <p className="text-xs text-slate-300">Your phone number, WhatsApp number, email, address and other private information will not be published.</p>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <h4 className="font-bold text-white">Where would you like your profile to be displayed?</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-navy-800 p-3 rounded-lg border border-slate-700 hover:bg-navy-700 transition flex-1">
                <input type="checkbox" checked={formData.platforms.includes('facebook')} onChange={() => handlePlatformChange('facebook')} className="w-4 h-4 accent-blue-500" />
                
                <span className="text-white font-medium">Facebook</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-navy-800 p-3 rounded-lg border border-slate-700 hover:bg-navy-700 transition flex-1">
                <input type="checkbox" checked={formData.platforms.includes('instagram')} onChange={() => handlePlatformChange('instagram')} className="w-4 h-4 accent-pink-500" />
                
                <span className="text-white font-medium">Instagram</span>
              </label>
            </div>
          </div>

          {/* Consent */}
          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.consent_given} onChange={(e) => setFormData(prev => ({ ...prev, consent_given: e.target.checked }))} className="mt-1 w-5 h-5 accent-blue-500 shrink-0" />
              <div>
                <span className="block text-sm text-white font-medium">
                  I voluntarily request RaabtaNow to display the public information from my profile on RaabtaNow's official Facebook and/or Instagram pages. I understand that only the information shown in the preview will be considered for publication and that my private contact information will not be published.
                </span>
                <span className="block font-urdu text-sm text-slate-300 mt-2" dir="rtl">
                  میں اپنی رضامندی سے RaabtaNow سے درخواست کرتا/کرتی ہوں کہ میرے پروفائل کی عوامی معلومات RaabtaNow کے آفیشل Facebook اور/یا Instagram صفحات پر دکھائی جا سکتی ہیں۔ میں سمجھتا/سمجھتی ہوں کہ صرف وہی معلومات اشاعت کے لیے استعمال کی جائیں گی جو preview میں دکھائی گئی ہیں اور میری نجی رابطے کی معلومات شائع نہیں کی جائیں گی۔
                </span>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
}

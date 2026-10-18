import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { User, Mail, Phone, Clock, CheckCircle2, AlertTriangle, Sparkles, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';
import VerificationSection from '../../components/profile/VerificationSection';

export default function DashboardPage() {
  const { user, emailVerified, logout, updateUserPhone } = useAuth();

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');

  const handleSavePhone = async (e) => {
    e.preventDefault();
    setPhoneSaving(true);
    setPhoneError('');
    setPhoneSuccess('');
    try {
      await updateUserPhone(phoneInput);
      setPhoneSuccess('Phone number saved successfully.');
      setTimeout(() => {
        setIsPhoneModalOpen(false);
        setPhoneSuccess('');
      }, 1000);
    } catch (err) {
      setPhoneError(err.response?.data?.errors?.phone?.[0] || err.response?.data?.message || 'Failed to update phone number.');
    } finally {
      setPhoneSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <SEOHead
        title="Dashboard | RaabtaNow"
        isIndexable={false}
      />
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-850 via-navy-800 to-navy-850 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-750 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-magenta-500/15 border border-magenta-500/30 text-xs font-semibold text-magenta-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Matrimonial Session Active</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Assalam-o-Alaikum, {user?.name || 'User'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Welcome to RaabtaNow. Your account is secure and private. Manage your profile, partner preferences, and rishta proposals from here.
          </p>
        </div>
      </div>

      {/* Verification Action Banner if not verified */}
      {!emailVerified && (
        <Alert
          variant="warning"
          title="Action Required: Email Verification Pending"
          className="border border-amber-500/40 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <p className="text-sm text-amber-200 leading-relaxed font-medium">
              Your registered email (<strong>{user?.email}</strong>) has not been verified yet. Unverified accounts cannot exchange contact details or unlock matrimonial inquiries.
            </p>
            <Link to="/verify-email" className="shrink-0">
              <Button size="md" variant="gold" icon={ArrowRight} iconPosition="right" className="font-bold shadow-sm">
                Verify Email Now
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Old User Reminder: Add Phone Number */}
      {!user?.phone && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-navy-850 to-navy-800 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white">Add WhatsApp / Contact Number</h4>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Admin Only • Confidential
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enable RaabtaNow support team to assist you faster with proposal inquiries. Never displayed publicly to other candidates.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setPhoneInput(user?.phone || '');
              setPhoneError('');
              setPhoneSuccess('');
              setIsPhoneModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold whitespace-nowrap shrink-0 shadow-md"
          >
            + Add Number Now
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Account Details Card */}
        <Card className="lg:col-span-2 p-6 sm:p-8 bg-navy-800 border border-slate-750 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-750/80">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Your Account Profile</h2>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Core authentication and identity credentials</p>
            </div>
            <Badge variant={user?.status === 'active' ? 'success' : 'danger'} size="md" className="font-bold">
              {user?.status === 'active' ? 'Account Active' : 'Account Suspended'}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-850 border border-slate-750">
              <div className="w-11 h-11 rounded-xl bg-magenta-500/15 border border-magenta-500/30 flex items-center justify-center text-magenta-400 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Full Name</p>
                <p className="text-base font-bold text-white truncate">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-850 border border-slate-750">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p className="text-base font-bold text-white truncate">{user?.email}</p>
                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-850 border border-slate-750">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    WhatsApp / Contact Number <span className="text-[10px] text-emerald-400 lowercase font-normal">(confidential)</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneInput(user?.phone || '');
                      setPhoneError('');
                      setPhoneSuccess('');
                      setIsPhoneModalOpen(true);
                    }}
                    className="text-xs text-magenta-400 hover:text-magenta-300 font-semibold underline cursor-pointer"
                  >
                    {user?.phone ? 'Edit Number' : '+ Add Number'}
                  </button>
                </div>
                <p className="text-base font-bold text-white truncate font-mono mt-0.5">
                  {user?.phone ? (
                    <span className="text-emerald-300 font-mono">📞 {user.phone}</span>
                  ) : (
                    <span className="text-slate-500 text-sm font-normal italic">Not provided yet</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-850 border border-slate-750">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registration Date</p>
                <p className="text-base font-bold text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Recently Registered'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-750/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-400">Sign out securely when finished:</span>
            <Button
              variant="secondary"
              size="md"
              icon={LogOut}
              onClick={logout}
              className="w-full sm:w-auto font-semibold"
            >
              Log Out of Account
            </Button>
          </div>
        </Card>

        {/* Matrimonial Profile Card */}
        <div className="space-y-6">

          {/* Phase 2: Matrimonial Profile Card */}
          <Card className="p-6 bg-navy-800 border border-slate-750 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-white font-serif font-extrabold text-lg">
              <Sparkles className="w-5 h-5 text-magenta-400" />
              <h3 className="text-white font-bold">Matrimonial Biodata</h3>
            </div>
            <p className="text-xs text-slate-300 font-normal leading-relaxed">
              Create and manage your private matrimonial profile, partner preferences, and discovery status.
            </p>
            <Link to="/profile" className="block pt-1">
              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                className="w-full font-bold shadow-sm"
              >
                Go to My Profile
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Trust & Verification Badges Section */}
      <VerificationSection />

      {/* Update Phone Modal */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Phone className="w-5 h-5 text-emerald-400" />
                <span>{user?.phone ? 'Update Contact Number' : 'Add WhatsApp / Phone'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg bg-navy-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/25 rounded-xl text-xs text-emerald-200 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 inline mr-1.5 -mt-0.5" />
              <strong>Confidential:</strong> Your phone number is strictly visible to the RaabtaNow support team to assist you. It is never shown to prospective candidates.
            </div>

            {phoneSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold">
                ✓ {phoneSuccess}
              </div>
            )}

            {phoneError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold">
                {phoneError}
              </div>
            )}

            <form onSubmit={handleSavePhone} className="space-y-4">
              <Input
                label="Mobile / WhatsApp Number"
                name="phone"
                type="tel"
                placeholder="e.g. 03001234567 or +923001234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                autoFocus
                required
                helperText="Pakistan mobile format (7 to 25 digits with optional country code)."
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPhoneModalOpen(false)}
                  disabled={phoneSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={phoneSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Number
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

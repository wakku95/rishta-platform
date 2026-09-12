import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { User, Mail, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Sparkles, LogOut, ArrowRight, KeyRound } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';
import VerificationSection from '../../components/profile/VerificationSection';

export default function DashboardPage() {
  const { user, emailVerified, logout } = useAuth();

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
            Your matrimonial session is active and secure. First-party HttpOnly cookies protect your privacy with zero client-side credential exposure.
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

        {/* Security & Next Phase Preview Cards */}
        <div className="space-y-6">
          <Card className="p-6 bg-navy-800 border border-slate-750 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400 font-bold text-base">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <span>Security & Privacy Active</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your authentication session is strictly managed by Laravel Sanctum SPA cookies. No tokens exist in JavaScript memory or browser storage.
            </p>
            <div className="p-3.5 rounded-xl bg-navy-850 border border-slate-750 text-xs font-semibold text-slate-300 space-y-2">
              <p className="flex items-center gap-2">✓ <span className="text-emerald-400">HttpOnly Session Cookie</span></p>
              <p className="flex items-center gap-2">✓ <span className="text-emerald-400">Zero localStorage Tokens</span></p>
              <p className="flex items-center gap-2">✓ <span className="text-emerald-400">Rate-Limited API Endpoints</span></p>
            </div>
          </Card>

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
    </div>
  );
}

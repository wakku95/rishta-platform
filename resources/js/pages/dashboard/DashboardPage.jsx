import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { User, Mail, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Sparkles, LogOut, ArrowRight, KeyRound } from 'lucide-react';

export default function DashboardPage() {
  const { user, emailVerified, logout } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-burgundy-900 to-burgundy-800 rounded-3xl p-6 sm:p-8 text-white shadow-md border-2 border-burgundy-950 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-burgundy-700/80 border border-burgundy-600 text-xs font-bold text-gold-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 Authentication Active</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Assalam-o-Alaikum, {user?.name || 'User'}
          </h1>
          <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-medium">
            Your matrimonial session is active and secure. First-party HttpOnly cookies protect your privacy with zero client-side credential exposure.
          </p>
        </div>
      </div>

      {/* Verification Action Banner if not verified */}
      {!emailVerified && (
        <Alert
          variant="warning"
          title="Action Required: Email Verification Pending"
          className="border-2 border-amber-300 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <p className="text-sm text-amber-950 leading-relaxed font-medium">
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
        <Card className="lg:col-span-2 p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-5 border-b-2 border-stone-100">
            <div>
              <h2 className="text-xl font-bold text-burgundy-900">Your Account Profile</h2>
              <p className="text-xs font-medium text-stone-500 mt-0.5">Core authentication and identity credentials</p>
            </div>
            <Badge variant={user?.status === 'active' ? 'success' : 'danger'} size="md" className="font-bold">
              {user?.status === 'active' ? 'Account Active' : 'Account Suspended'}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border-2 border-stone-200">
              <div className="w-11 h-11 rounded-xl bg-burgundy-100 border border-burgundy-200 flex items-center justify-center text-burgundy-800 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Registered Full Name</p>
                <p className="text-base font-bold text-charcoal-900 truncate">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border-2 border-stone-200">
              <div className="w-11 h-11 rounded-xl bg-burgundy-100 border border-burgundy-200 flex items-center justify-center text-burgundy-800 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Email Address</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p className="text-base font-bold text-charcoal-900 truncate">{user?.email}</p>
                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border-2 border-stone-200">
              <div className="w-11 h-11 rounded-xl bg-burgundy-100 border border-burgundy-200 flex items-center justify-center text-burgundy-800 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Registration Date</p>
                <p className="text-base font-bold text-charcoal-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Recently Registered'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t-2 border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-medium text-stone-500">Sign out securely when finished testing:</span>
            <Button
              variant="secondary"
              size="md"
              icon={LogOut}
              onClick={logout}
              className="w-full sm:w-auto font-bold border-2"
            >
              Log Out of Account
            </Button>
          </div>
        </Card>

        {/* Security & Next Phase Preview Cards */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border-2 border-stone-300 shadow-md space-y-4">
            <div className="flex items-center gap-3 text-emerald-800 font-bold text-base">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>Security & Privacy Active</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Your authentication session is strictly managed by Laravel Sanctum SPA cookies. No tokens exist in JavaScript memory or browser storage.
            </p>
            <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-xs font-semibold text-emerald-950 space-y-2">
              <p className="flex items-center gap-2">✓ <span>HttpOnly Session Cookie</span></p>
              <p className="flex items-center gap-2">✓ <span>Zero localStorage Tokens</span></p>
              <p className="flex items-center gap-2">✓ <span>Rate-Limited API Endpoints</span></p>
            </div>
          </Card>

          <Card className="p-6 bg-burgundy-50/70 border-2 border-burgundy-200 shadow-sm space-y-2">
            <h3 className="text-base font-bold text-burgundy-900">
              Phase 2: Matrimonial Profile
            </h3>
            <p className="text-xs text-burgundy-800 leading-relaxed">
              In Phase 2, candidates will create their dignified biodata including sect, city, education, profession, family background, and partner preferences.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

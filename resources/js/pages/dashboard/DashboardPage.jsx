import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { User, Mail, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Sparkles, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user, emailVerified, logout } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-burgundy-900 to-burgundy-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burgundy-700/60 border border-burgundy-600/60 text-xs font-medium text-gold-300 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 Authentication Active</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Assalam-o-Alaikum, {user?.name || 'User'}
          </h1>
          <p className="mt-2 text-sm text-cream-200 leading-relaxed">
            Welcome to your private matrimonial account. Your identity is secured with first-party HttpOnly cookies and zero client-side credential exposure.
          </p>
        </div>
      </div>

      {/* Verification Warning if not verified */}
      {!emailVerified && (
        <Alert
          variant="warning"
          title="Email Verification Required"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
            <span>
              Your email address (<strong>{user?.email}</strong>) has not been verified yet. Please verify it to activate full matrimonial discovery.
            </span>
            <Link to="/verify-email" className="shrink-0">
              <Button size="sm" variant="gold">
                Verify Now
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Details Card */}
        <Card className="md:col-span-2 p-6 sm:p-7 bg-white border border-cream-300">
          <div className="flex items-center justify-between pb-5 border-b border-cream-200">
            <div>
              <h2 className="text-lg font-bold text-burgundy-900">Account Information</h2>
              <p className="text-xs text-charcoal-500">Your core identity details</p>
            </div>
            <Badge variant={user?.status === 'active' ? 'success' : 'danger'}>
              {user?.status === 'active' ? 'Active' : 'Suspended'}
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-cream-50 border border-cream-200">
              <div className="w-10 h-10 rounded-lg bg-burgundy-100 flex items-center justify-center text-burgundy-800 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal-500">Registered Name</p>
                <p className="text-sm font-semibold text-charcoal-900 truncate">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-cream-50 border border-cream-200">
              <div className="w-10 h-10 rounded-lg bg-burgundy-100 flex items-center justify-center text-burgundy-800 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal-500">Email Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-charcoal-900 truncate">{user?.email}</p>
                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertTriangle className="w-3 h-3" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-cream-50 border border-cream-200">
              <div className="w-10 h-10 rounded-lg bg-burgundy-100 flex items-center justify-center text-burgundy-800 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal-500">Member Since</p>
                <p className="text-sm font-semibold text-charcoal-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Recently'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-cream-200 flex items-center justify-between">
            <span className="text-xs text-charcoal-500">Ready to sign out?</span>
            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              onClick={logout}
            >
              Log Out
            </Button>
          </div>
        </Card>

        {/* Security & Next Phase Preview Card */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-cream-300">
            <div className="flex items-center gap-2.5 mb-3 text-emerald-800 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Privacy & Security Guard</span>
            </div>
            <p className="text-xs text-charcoal-600 leading-relaxed mb-4">
              Your session is safeguarded with Laravel Sanctum first-party HttpOnly cookies and CSRF validation. No authentication tokens are accessible to browser scripts.
            </p>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
              <p>✓ HttpOnly Session Cookie</p>
              <p>✓ No localStorage Bearer Tokens</p>
              <p>✓ Rate-Limited Auth Endpoints</p>
            </div>
          </Card>

          <Card className="p-6 bg-burgundy-50/60 border border-burgundy-200">
            <h3 className="text-sm font-bold text-burgundy-900 mb-1.5">
              Coming in Phase 2
            </h3>
            <p className="text-xs text-burgundy-800 leading-relaxed">
              Matrimonial profile creation (education, sect, caste, city, height) and respectful search discovery will be unlocked in Phase 2.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

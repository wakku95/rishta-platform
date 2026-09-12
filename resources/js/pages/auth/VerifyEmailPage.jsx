import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { MailCheck, CheckCircle2, RefreshCw, Send, LogOut, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, emailVerified, resendVerification, refreshUser, logout } = useAuth();
  const [searchParams] = useSearchParams();

  const isVerifiedFromQuery = searchParams.get('verified') === '1' || searchParams.get('verified') === 'already';
  const hasError = searchParams.get('error');

  const [resendStatus, setResendStatus] = useState({
    sent: false,
    message: '',
    error: '',
    loading: false,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleResend = async () => {
    setResendStatus({ sent: false, message: '', error: '', loading: true });
    try {
      const res = await resendVerification();
      setResendStatus({
        sent: true,
        message: res.message || 'A fresh verification link has been dispatched to your email address.',
        error: '',
        loading: false,
      });
    } catch (err) {
      if (err.response?.status === 429) {
        setResendStatus({
          sent: false,
          message: '',
          error: 'Please wait a few minutes before requesting another verification email.',
          loading: false,
        });
      } else {
        setResendStatus({
          sent: false,
          message: '',
          error: err.response?.data?.message || 'Could not send verification email. Please try again.',
          loading: false,
        });
      }
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isFullyVerified = emailVerified || isVerifiedFromQuery;

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div
            className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border ${
              isFullyVerified
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/20 border-emerald-400/30'
                : 'bg-gradient-to-tr from-magenta-500 to-purple-600 shadow-magenta-500/20 border-white/20'
            }`}
          >
            {isFullyVerified ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : (
              <MailCheck className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isFullyVerified ? 'Email Verified' : 'Verify Your Email'}
          </h1>
          <p className="text-sm font-normal text-slate-400">
            {isFullyVerified
              ? 'Your account identity is verified and in good standing.'
              : 'Please confirm your email address to unlock full matrimonial features.'}
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-navy-800 border border-slate-750 shadow-2xl space-y-5">
          {hasError && (
            <Alert variant="danger" title="Verification Issue">
              {hasError === 'expired'
                ? 'Your email verification link has expired. Please dispatch a fresh link below.'
                : 'The verification link signature is invalid or altered. Please request a new link.'}
            </Alert>
          )}

          {isFullyVerified ? (
            <div className="space-y-5 text-center">
              <Alert variant="success" title="Status: Verified">
                Your email address has been successfully confirmed. You can now access your dashboard.
              </Alert>

              <Link to="/dashboard" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full justify-center text-base font-bold shadow-lg shadow-magenta-500/25"
                >
                  Continue to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-navy-750 border border-slate-700 text-sm text-slate-300 leading-relaxed">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Registered Email Address
                </span>
                <strong className="text-white break-all text-base">
                  {user?.email || 'your registered email'}
                </strong>
              </div>

              {resendStatus.sent && (
                <Alert variant="success">
                  {resendStatus.message}
                </Alert>
              )}

              {resendStatus.error && (
                <Alert variant="danger" onClose={() => setResendStatus((prev) => ({ ...prev, error: '' }))}>
                  {resendStatus.error}
                </Alert>
              )}

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={resendStatus.loading}
                  icon={Send}
                  onClick={handleResend}
                  className="w-full justify-center text-sm font-bold shadow-lg shadow-magenta-500/25"
                >
                  Resend Verification Email
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  isLoading={isRefreshing}
                  icon={RefreshCw}
                  onClick={handleManualRefresh}
                  className="w-full justify-center font-bold"
                >
                  Refresh Verification Status
                </Button>
              </div>
            </div>
          )}

          {user && (
            <div className="pt-4 border-t border-slate-750 flex items-center justify-between text-xs text-slate-400">
              <span>Signed in: <strong className="text-slate-200">{user.name}</strong></span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 font-bold text-magenta-400 hover:text-magenta-300 underline hover:no-underline cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

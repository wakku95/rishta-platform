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
            className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md border-2 ${
              isFullyVerified
                ? 'bg-emerald-600 border-emerald-700/40'
                : 'bg-burgundy-700 border-burgundy-900/30'
            }`}
          >
            {isFullyVerified ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : (
              <MailCheck className="w-8 h-8 text-gold-300" />
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-burgundy-900">
            {isFullyVerified ? 'Email Verified' : 'Verify Your Email'}
          </h1>
          <p className="text-sm font-medium text-stone-600">
            {isFullyVerified
              ? 'Your account identity is verified and in good standing.'
              : 'Please confirm your email address to unlock full matrimonial features.'}
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-5">
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
                  className="w-full justify-center text-base font-bold shadow-md"
                >
                  Continue to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-50 border-2 border-stone-200 text-sm text-stone-800 leading-relaxed">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Registered Email Address
                </span>
                <strong className="text-charcoal-900 break-all text-base">
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

              {/* Development Testing Hint */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                <p className="font-bold">Development Testing Note:</p>
                <p>Since mail is configured to the log driver in development, the verification link is saved in:</p>
                <code className="block bg-amber-100/70 p-1.5 rounded font-mono text-[11px] text-amber-950 break-all">
                  storage/logs/laravel.log
                </code>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={resendStatus.loading}
                  icon={Send}
                  onClick={handleResend}
                  className="w-full justify-center text-sm font-bold shadow-md"
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
            <div className="pt-4 border-t-2 border-stone-100 flex items-center justify-between text-xs text-stone-600">
              <span>Signed in: <strong>{user.name}</strong></span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 font-bold text-burgundy-700 hover:text-burgundy-900 underline hover:no-underline cursor-pointer"
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

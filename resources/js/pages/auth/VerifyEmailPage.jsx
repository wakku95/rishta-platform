import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { MailCheck, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

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

  const handleResend = async () => {
    setResendStatus({ sent: false, message: '', error: '', loading: true });
    try {
      const res = await resendVerification();
      setResendStatus({
        sent: true,
        message: res.message || 'A fresh verification link has been sent to your email.',
        error: '',
        loading: false,
      });
    } catch (err) {
      if (err.response?.status === 429) {
        setResendStatus({
          sent: false,
          message: '',
          error: 'Please wait before requesting another verification email.',
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

  const isFullyVerified = emailVerified || isVerifiedFromQuery;

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div
            className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isFullyVerified ? 'bg-emerald-600' : 'bg-burgundy-700'
            }`}
          >
            {isFullyVerified ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <MailCheck className="w-6 h-6 text-gold-300" />
            )}
          </div>
          <h2 className="mt-4 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-burgundy-900">
            {isFullyVerified ? 'Email Verified' : 'Verify Your Email'}
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">
            {isFullyVerified
              ? 'Your identity is confirmed. You can now access your dashboard.'
              : 'Please confirm your email address to ensure genuine matrimonial inquiries.'}
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border border-cream-300 shadow-sm space-y-5">
          {hasError && (
            <Alert variant="danger">
              {hasError === 'expired'
                ? 'Your verification link has expired. Please request a new one below.'
                : 'The verification link is invalid. Please request a new one.'}
            </Alert>
          )}

          {isFullyVerified ? (
            <div className="space-y-4 text-center">
              <Alert variant="success">
                Thank you! Your email address has been verified successfully.
              </Alert>
              <Link to="/dashboard" className="inline-block w-full">
                <Button variant="primary" size="lg" className="w-full justify-center">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cream-100/70 border border-cream-200 text-sm text-charcoal-700 leading-relaxed">
                We sent a verification link to:
                <p className="mt-1 font-semibold text-charcoal-900 break-all">
                  {user?.email || 'your registered email'}
                </p>
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

              <p className="text-xs text-charcoal-600 leading-relaxed">
                Click the link in the email to activate your account. If you did not receive it, check your spam or promotions folder or request another link below.
              </p>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={resendStatus.loading}
                  onClick={handleResend}
                  className="w-full justify-center"
                >
                  Resend Verification Email
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => refreshUser()}
                  className="w-full justify-center"
                >
                  I've Already Verified
                </Button>
              </div>
            </div>
          )}

          {user && (
            <div className="pt-4 border-t border-cream-200 flex items-center justify-between text-xs text-charcoal-600">
              <span>Signed in as <strong>{user.name}</strong></span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1 text-burgundy-700 hover:text-burgundy-900 font-medium hover:underline"
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

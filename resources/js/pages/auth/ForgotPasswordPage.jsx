import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { KeyRound, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccessMessage(
        response.data.message ||
          'If an account exists with this email address, a password reset link has been dispatched.'
      );
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many reset requests. Please wait a few minutes before trying again.');
      } else if (err.response?.status === 422) {
        setError(err.response.data.errors?.email?.[0] || 'Please enter a valid email address.');
      } else {
        setError(err.response?.data?.message || 'Unable to request password reset. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-magenta-500/20 border border-white/20">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Reset Your Password
          </h1>
          <p className="text-sm font-normal text-slate-400">
            We will send a secure password reset link to your registered email.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-navy-800 border border-slate-750 shadow-2xl">
          {successMessage ? (
            <div className="space-y-6 text-center">
              <Alert variant="success" title="Reset Link Dispatched">
                {successMessage}
              </Alert>
              <div className="p-4 rounded-xl bg-navy-750 border border-slate-700 text-xs text-slate-300 text-left space-y-2">
                <p className="font-semibold text-white">Next Steps for Testing:</p>
                <p>1. In development, email is logged to <code className="bg-navy-900 border border-slate-700 px-1.5 py-0.5 rounded text-magenta-300 font-mono">storage/logs/laravel.log</code>.</p>
                <p>2. Copy the reset link from the log to test password completion.</p>
              </div>
              <Link to="/login" className="block w-full">
                <Button variant="secondary" size="lg" className="w-full justify-center">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="danger" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Input
                label="Registered Email Address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="Enter the email associated with your account."
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                icon={Send}
                className="w-full justify-center text-base font-bold shadow-lg shadow-magenta-500/25"
              >
                Send Password Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-magenta-400 hover:text-magenta-300 underline hover:no-underline transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

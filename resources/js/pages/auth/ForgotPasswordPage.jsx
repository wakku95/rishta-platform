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
          <div className="mx-auto w-14 h-14 rounded-2xl bg-burgundy-700 flex items-center justify-center text-white shadow-md border-2 border-burgundy-900/30">
            <KeyRound className="w-8 h-8 text-gold-300" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-burgundy-900">
            Reset Your Password
          </h1>
          <p className="text-sm font-medium text-stone-600">
            We will send a secure password reset link to your registered email.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md">
          {successMessage ? (
            <div className="space-y-6 text-center">
              <Alert variant="success" title="Reset Link Dispatched">
                {successMessage}
              </Alert>
              <div className="p-4 rounded-xl bg-stone-50 border-2 border-stone-200 text-xs text-stone-700 text-left space-y-2">
                <p className="font-semibold text-charcoal-900">Next Steps for Testing:</p>
                <p>1. In development, email is logged to <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-900">storage/logs/laravel.log</code>.</p>
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
                className="w-full justify-center text-base font-bold shadow-md"
              >
                Send Password Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-burgundy-700 hover:text-burgundy-900 underline hover:no-underline"
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

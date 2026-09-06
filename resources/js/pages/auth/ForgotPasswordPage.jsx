import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { KeyRound, ArrowLeft } from 'lucide-react';

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
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-burgundy-700 flex items-center justify-center text-white shadow-md">
            <KeyRound className="w-6 h-6 text-gold-300" />
          </div>
          <h2 className="mt-4 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-burgundy-900">
            Forgot Password
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">
            Enter your registered email address and we will send you a secure password reset link.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border border-cream-300 shadow-sm">
          {successMessage ? (
            <div className="space-y-5 text-center">
              <Alert variant="success">
                {successMessage}
              </Alert>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                Please check your inbox (and spam folder) for the reset link. The link is valid for 60 minutes.
              </p>
              <Link to="/login" className="inline-block w-full">
                <Button variant="secondary" className="w-full justify-center">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="danger" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full justify-center mt-2"
              >
                Send Password Reset Link
              </Button>

              <div className="pt-3 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-600 hover:text-burgundy-700 transition-colors"
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

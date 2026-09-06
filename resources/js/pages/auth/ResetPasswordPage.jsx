import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { Lock, CheckCircle2, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    token: token,
    email: initialEmail,
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', formData);
      setIsSuccess(true);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setGeneralError(err.response.data.message || 'Please check your inputs.');
      } else {
        setGeneralError(
          err.response?.data?.message || 'Unable to reset password. The link may have expired or is invalid.'
        );
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
            <Lock className="w-8 h-8 text-gold-300" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-burgundy-900">
            Set New Password
          </h1>
          <p className="text-sm font-medium text-stone-600">
            Choose a new strong password to regain access to your account.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md">
          {!token && (
            <div className="mb-5">
              <Alert variant="warning" title="Missing Reset Token">
                This page was opened without a valid password reset token in the URL. Please use the link sent to your email.
              </Alert>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 border-2 border-emerald-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-charcoal-900">
                  Password Updated Successfully
                </h2>
                <p className="text-sm text-stone-600 mt-1">
                  Your new password is saved. You can now sign in with your updated credentials.
                </p>
              </div>
              <Link to="/login" className="block w-full">
                <Button variant="primary" size="lg" className="w-full justify-center text-base font-bold shadow-md">
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {generalError && (
                <Alert variant="danger" onClose={() => setGeneralError('')}>
                  {generalError}
                </Alert>
              )}

              <Input
                label="Registered Email Address"
                id="email"
                name="email"
                type="email"
                required
                placeholder="e.g. user@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email?.[0]}
              />

              <Input
                label="New Password"
                id="password"
                name="password"
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                error={errors.password?.[0]}
                helperText="Must contain letters and numbers."
              />

              <Input
                label="Confirm New Password"
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                required
                placeholder="Re-enter your new password"
                value={formData.password_confirmation}
                onChange={handleChange}
                error={errors.password_confirmation?.[0]}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                icon={KeyRound}
                className="w-full justify-center text-base font-bold shadow-md mt-2"
              >
                Update Password & Save
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

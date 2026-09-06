import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { Lock, CheckCircle2 } from 'lucide-react';

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
          err.response?.data?.message || 'Unable to reset password. The link may have expired.'
        );
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
            <Lock className="w-6 h-6 text-gold-300" />
          </div>
          <h2 className="mt-4 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-burgundy-900">
            Set New Password
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">
            Please choose a strong, secure password for your account.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border border-cream-300 shadow-sm">
          {isSuccess ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900">
                Password Reset Successfully
              </h3>
              <p className="text-sm text-charcoal-600">
                Your password has been updated. You can now sign in with your new credentials.
              </p>
              <Link to="/login" className="inline-block w-full">
                <Button variant="primary" className="w-full justify-center">
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
                label="Email Address"
                id="email"
                name="email"
                type="email"
                required
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
                className="w-full justify-center mt-2"
              >
                Reset Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

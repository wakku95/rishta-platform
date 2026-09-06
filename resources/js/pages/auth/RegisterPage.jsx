import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { HeartHandshake, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
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
      await register(formData);
      navigate('/verify-email', { replace: true });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setGeneralError(err.response.data.message || 'Please correct the validation errors below.');
      } else if (err.response?.status === 429) {
        setGeneralError('Too many registration attempts. Please wait a minute and try again.');
      } else {
        setGeneralError(err.response?.data?.message || 'Registration failed. Please try again.');
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
            <HeartHandshake className="w-6 h-6 text-gold-300" />
          </div>
          <h2 className="mt-4 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-burgundy-900">
            Create Your Account
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">
            Begin your matrimonial journey on Pakistan's privacy-first platform.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border border-cream-300 shadow-sm">
          {/* Privacy reassurance pill */}
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-burgundy-50/70 border border-burgundy-100 text-xs text-burgundy-900 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-burgundy-700 shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Guaranteed:</strong> Your contact number is never made public. Profiles are discovered respectfully with mutual consent.
            </span>
          </div>

          {generalError && (
            <div className="mb-5">
              <Alert variant="danger" onClose={() => setGeneralError('')}>
                {generalError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name (or Guardian Name)"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Muhammad Usman"
              value={formData.name}
              onChange={handleChange}
              error={errors.name?.[0]}
              helperText="You can also register on behalf of a son, daughter, or sibling."
            />

            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email?.[0]}
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password?.[0]}
              helperText="Must contain at least 8 characters with letters and numbers."
            />

            <Input
              label="Confirm Password"
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Re-enter your password"
              value={formData.password_confirmation}
              onChange={handleChange}
              error={errors.password_confirmation?.[0]}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full justify-center mt-3"
            >
              Register Account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-cream-200 text-center text-sm text-charcoal-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-burgundy-700 hover:text-burgundy-800 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

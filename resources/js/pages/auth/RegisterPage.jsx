import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { HeartHandshake, ShieldCheck, UserPlus } from 'lucide-react';

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
        setGeneralError(err.response.data.message || 'Please fix the validation errors below.');
      } else if (err.response?.status === 429) {
        setGeneralError('Too many registration attempts. Please wait 60 seconds and try again.');
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
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-magenta-500/20 border border-white/20">
            <HeartHandshake className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Create Free Account
          </h1>
          <p className="text-sm font-normal text-slate-400">
            Register to search or create private matrimonial profiles.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-navy-800 border border-slate-750 shadow-2xl">
          {/* Privacy Guarantee Pill */}
          <div className="mb-6 flex items-start gap-3 p-3.5 rounded-xl bg-magenta-950/40 border border-magenta-500/30 text-xs text-magenta-200 leading-relaxed font-medium">
            <ShieldCheck className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white font-semibold">Privacy Guaranteed:</strong> Phone numbers and personal contacts are never published publicly. Contact exchange requires mutual acceptance and verified OTP.
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
              label="Full Name or Guardian Name"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Fatima Tariq or Tariq Mahmood"
              value={formData.name}
              onChange={handleChange}
              error={errors.name?.[0]}
              helperText="Candidate name, or parent/guardian creating on their behalf."
            />

            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="e.g. fatima@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email?.[0]}
              helperText="Used for login and secure identity verification."
            />

            <Input
              label="Create Password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password?.[0]}
              helperText="Must have at least 8 characters with letters and numbers."
            />

            <Input
              label="Confirm Password"
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Re-enter the exact password"
              value={formData.password_confirmation}
              onChange={handleChange}
              error={errors.password_confirmation?.[0]}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={UserPlus}
              className="w-full justify-center text-base font-bold shadow-lg shadow-magenta-500/25 mt-2"
            >
              Create & Register Account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-400">
            <span>Already registered?</span>
            <Link
              to="/login"
              className="font-bold text-magenta-400 hover:text-magenta-300 underline hover:no-underline transition-colors"
            >
              Sign In to Account →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

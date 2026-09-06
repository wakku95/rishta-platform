import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { Lock, Mail, HeartHandshake } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
      await login(formData);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setGeneralError(err.response.data.message || 'Validation failed. Please check the form.');
      } else if (err.response?.status === 403) {
        setGeneralError(err.response.data.message || 'Your account has been suspended.');
      } else if (err.response?.status === 429) {
        setGeneralError('Too many login attempts. Please wait a minute and try again.');
      } else {
        setGeneralError(err.response?.data?.message || 'Failed to log in. Please check your credentials.');
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
            Welcome Back
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">
            Sign in to continue your matrimonial search with privacy and dignity.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border border-cream-300 shadow-sm">
          {generalError && (
            <div className="mb-5">
              <Alert variant="danger" onClose={() => setGeneralError('')}>
                {generalError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-charcoal-800"
                >
                  Password <span className="text-burgundy-700">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-burgundy-700 hover:text-burgundy-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password?.[0]}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-charcoal-700">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-burgundy-700 border-cream-300 focus:ring-burgundy-700"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full justify-center mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-cream-200 text-center text-sm text-charcoal-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-burgundy-700 hover:text-burgundy-800 hover:underline"
            >
              Create Free Profile
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

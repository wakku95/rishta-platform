import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { HeartHandshake, LogIn } from 'lucide-react';

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
        setGeneralError(err.response.data.message || 'Validation failed. Please check your credentials.');
      } else if (err.response?.status === 403) {
        setGeneralError(err.response.data.message || 'Your account has been suspended.');
      } else if (err.response?.status === 429) {
        setGeneralError('Too many login attempts. Please wait 60 seconds and try again.');
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
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-burgundy-700 flex items-center justify-center text-white shadow-md border-2 border-burgundy-900/30">
            <HeartHandshake className="w-8 h-8 text-gold-300" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-burgundy-900">
            Account Sign In
          </h1>
          <p className="text-sm font-medium text-stone-600">
            Enter your credentials to access your matrimonial dashboard.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md">
          {generalError && (
            <div className="mb-6">
              <Alert variant="danger" onClose={() => setGeneralError('')}>
                {generalError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="e.g. user@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email?.[0]}
              helperText="The email address you used during registration."
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-charcoal-900"
                >
                  Password <span className="text-burgundy-700">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-burgundy-700 hover:text-burgundy-900 underline hover:no-underline"
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password?.[0]}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-charcoal-800">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-2 border-stone-300 text-burgundy-700 focus:ring-burgundy-700 cursor-pointer"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={LogIn}
              className="w-full justify-center text-base font-bold shadow-md"
            >
              Sign In to Account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t-2 border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-stone-600">
            <span>Don't have an account yet?</span>
            <Link
              to="/register"
              className="font-bold text-burgundy-700 hover:text-burgundy-900 underline hover:no-underline"
            >
              Register Free Profile →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

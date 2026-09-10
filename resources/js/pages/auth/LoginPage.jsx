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
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-magenta-500/20 border border-white/20">
            <HeartHandshake className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Account Sign In
          </h1>
          <p className="text-sm font-normal text-slate-400">
            Enter your credentials to access your matrimonial dashboard.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-navy-800 border border-slate-750 shadow-2xl">
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
                  className="block text-sm font-semibold text-slate-200"
                >
                  Password <span className="text-magenta-400">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-magenta-400 hover:text-magenta-300 transition-colors"
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
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-300">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border border-slate-700 bg-navy-750 text-magenta-500 focus:ring-magenta-500 cursor-pointer"
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
              className="w-full justify-center text-base font-bold shadow-lg"
            >
              Sign In to Account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-750/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-400">
            <span>Don't have an account yet?</span>
            <Link
              to="/register"
              className="font-semibold text-magenta-400 hover:text-magenta-300 transition-colors"
            >
              Register Free Profile →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

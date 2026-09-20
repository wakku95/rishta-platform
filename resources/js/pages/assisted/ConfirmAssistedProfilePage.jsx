import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormError from '../../components/ui/FormError';
import { Loader2, CheckCircle2 } from 'lucide-react';

const ConfirmAssistedProfilePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/assisted/confirm/${token}`);
        setProfileData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired confirmation link.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/assisted/confirm/${token}`, { password, password_confirmation: passwordConfirm });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Raabta<span className="text-primary-500">Now</span></h1>
          <p className="text-slate-400 mt-2">Secure Profile Setup</p>
        </div>

        <Card>
          {error && !profileData && (
            <div className="text-center space-y-6 py-4">
              <div className="text-rose-400 font-medium">{error}</div>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">Return to Homepage</Button>
            </div>
          )}
          
          {success && (
            <div className="text-center space-y-6 py-4">
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Setup Complete!</h3>
                <p className="text-slate-400 text-sm">Your profile is now active. You can log in using your email and new password.</p>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full" variant="primary">
                Go to Login
              </Button>
            </div>
          )}
          
          {!success && profileData && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-xl text-sm text-slate-300">
                You are setting up the matrimonial profile <strong>{profileData?.profile?.profile_code}</strong> linked to the email <strong>{profileData?.email}</strong>.
              </div>

              {error && <FormError message={error} />}
              
              <Input
                label="Set Your Password"
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter a secure password"
              />
              
              <Input
                label="Confirm Password"
                type="password"
                id="password_confirm"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                required
                placeholder="Confirm your password"
              />

              <Button type="submit" className="w-full mt-2" isLoading={submitting} variant="primary">
                Confirm & Activate Profile
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConfirmAssistedProfilePage;

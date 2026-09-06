import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getProfile, activateProfile, hideProfile } from '../../api/profile';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  User,
  HeartHandshake,
  Calendar,
  MapPin,
  GraduationCap,
  Briefcase,
  Ruler,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Edit,
  Sliders,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, emailVerified } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
    confirmVariant: 'primary',
  });

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getProfile();
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleActivate = async () => {
    setActionLoading(true);
    setActionSuccess('');
    setError('');
    try {
      const res = await activateProfile();
      setProfile(res.data);
      setActionSuccess('Your matrimonial profile is now active and discoverable.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not activate profile.');
    } finally {
      setActionLoading(false);
      setConfirmModal({ ...confirmModal, open: false });
    }
  };

  const handleHide = async () => {
    setActionLoading(true);
    setActionSuccess('');
    setError('');
    try {
      const res = await hideProfile();
      setProfile(res.data);
      setActionSuccess('Your profile has been hidden from search results.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not hide profile.');
    } finally {
      setActionLoading(false);
      setConfirmModal({ ...confirmModal, open: false });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingState text="Loading your matrimonial profile..." />
      </div>
    );
  }

  // EMPTY STATE: User does not have a profile yet
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 sm:p-12 text-center space-y-6 bg-white border-2 border-stone-300 shadow-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-burgundy-50 border-2 border-burgundy-200 flex items-center justify-center text-burgundy-800 shadow-sm">
            <HeartHandshake className="w-8 h-8 text-burgundy-700" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-burgundy-900">
              Create Your Matrimonial Profile
            </h1>
            <p className="text-sm sm:text-base text-stone-600 font-medium leading-relaxed">
              Complete your profile to start finding suitable rishtas. Your profile will be private and confidential, strictly respecting Pakistani cultural standards.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/profile/edit">
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                iconPosition="right"
                className="font-bold text-base px-8 py-3.5 shadow-md hover:shadow-lg"
              >
                Create My Profile
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const completion = profile.completion_percentage ?? 0;
  const preferences = profile.preferences;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="md" className="font-bold">Active & Discoverable</Badge>;
      case 'hidden':
        return <Badge variant="warning" size="md" className="font-bold">Hidden from Search</Badge>;
      default:
        return <Badge variant="neutral" size="md" className="font-bold">Draft Profile</Badge>;
    }
  };

  const getManagedByLabel = (key) => {
    const map = {
      myself: 'Myself (Candidate)',
      parent: 'Parent (Father / Mother)',
      sibling: 'Brother / Sister',
      guardian: 'Guardian',
      family: 'Other Family Member',
    };
    return map[key] || key;
  };

  const getMaritalStatusLabel = (key) => {
    const map = {
      never_married: 'Never Married',
      divorced: 'Divorced',
      widowed: 'Widowed',
      separated: 'Separated',
    };
    return map[key] || key;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Feedback Alerts */}
      {actionSuccess && (
        <Alert variant="success" title="Success" className="border-2 border-emerald-300 shadow-xs">
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Notice" className="border-2 border-rose-300 shadow-xs">
          {error}
        </Alert>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-burgundy-900 to-burgundy-800 rounded-3xl p-6 sm:p-8 text-white shadow-md border-2 border-burgundy-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider bg-burgundy-950/80 text-gold-300 px-3 py-1 rounded-lg border border-burgundy-700 font-bold">
              {profile.profile_code}
            </span>
            {getStatusBadge(profile.profile_status)}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight">
            {profile.profession} ({profile.age} yrs)
          </h1>
          <p className="text-sm text-stone-200 font-medium">
            {profile.city}, Pakistan • Managed by {getManagedByLabel(profile.managed_by)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/profile/edit">
            <Button variant="secondary" size="md" icon={Edit} className="bg-white hover:bg-stone-50 text-burgundy-900 font-bold shadow-sm">
              Edit Profile
            </Button>
          </Link>

          {profile.profile_status === 'draft' && (
            <Button
              variant="gold"
              size="md"
              icon={Eye}
              loading={actionLoading}
              onClick={() => {
                if (!emailVerified) {
                  setError('You must verify your email address before activating your profile.');
                  return;
                }
                setConfirmModal({
                  open: true,
                  title: 'Activate Matrimonial Profile',
                  message: 'Your profile will become active and discoverable to compatible matches on the platform. You can hide it anytime.',
                  action: handleActivate,
                  confirmVariant: 'primary',
                });
              }}
              className="font-bold shadow-sm"
            >
              Activate Profile
            </Button>
          )}

          {profile.profile_status === 'active' && (
            <Button
              variant="secondary"
              size="md"
              icon={EyeOff}
              loading={actionLoading}
              onClick={() => {
                setConfirmModal({
                  open: true,
                  title: 'Hide Profile from Search',
                  message: 'When hidden, other members cannot discover your profile in search. Existing requests remain intact.',
                  action: handleHide,
                  confirmVariant: 'danger',
                });
              }}
              className="font-bold border-stone-300 text-stone-800 shadow-sm"
            >
              Hide Profile
            </Button>
          )}

          {profile.profile_status === 'hidden' && (
            <Button
              variant="gold"
              size="md"
              icon={Eye}
              loading={actionLoading}
              onClick={handleActivate}
              className="font-bold shadow-sm"
            >
              Unhide & Activate
            </Button>
          )}
        </div>
      </div>

      {/* Completion Meter Card */}
      <Card className="p-6 bg-white border-2 border-stone-300 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-burgundy-700" />
            <h2 className="text-base font-bold text-charcoal-900">Profile Completion</h2>
          </div>
          <span className="text-sm font-extrabold text-burgundy-800">{completion}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              completion >= 80
                ? 'bg-emerald-600'
                : completion >= 50
                ? 'bg-amber-600'
                : 'bg-burgundy-700'
            }`}
            style={{ width: `${completion}%` }}
          />
        </div>

        <p className="text-xs text-stone-500 font-medium">
          {completion < 70
            ? 'Complete mandatory biodata fields to reach 70% and unlock profile activation.'
            : completion < 100
            ? 'Add partner preferences to reach 100% complete and improve mutual compatibility.'
            : 'Your profile and partner preferences are 100% complete!'}
        </p>
      </Card>

      {/* Unverified Email Warning */}
      {!emailVerified && (
        <Alert
          variant="warning"
          title="Email Verification Needed for Activation"
          className="border-2 border-amber-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
            <p className="text-sm text-amber-950 font-medium">
              You can draft and preview your matrimonial biodata anytime, but your profile cannot be activated until your email is verified.
            </p>
            <Link to="/verify-email" className="shrink-0">
              <Button size="sm" variant="gold" icon={ArrowRight} iconPosition="right" className="font-bold">
                Verify Email
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Biodata Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Biodata Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-stone-100">
              <h2 className="text-lg font-serif font-extrabold text-burgundy-900">
                Biodata & Basic Information
              </h2>
              <Link to="/profile/edit">
                <Button variant="ghost" size="sm" icon={Edit} className="text-burgundy-800 font-bold">
                  Edit
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <User className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-stone-500 block uppercase">Gender</span>
                  <span className="text-sm font-bold text-charcoal-900 capitalize">{profile.gender}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <Calendar className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-stone-500 block uppercase">Age & Date of Birth</span>
                  <span className="text-sm font-bold text-charcoal-900">
                    {profile.age} years old ({profile.date_of_birth})
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <Ruler className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-stone-500 block uppercase">Height</span>
                  <span className="text-sm font-bold text-charcoal-900">{profile.height_formatted}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <MapPin className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-stone-500 block uppercase">City & Location</span>
                  <span className="text-sm font-bold text-charcoal-900">{profile.city}, Pakistan</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <GraduationCap className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-stone-500 block uppercase">Education</span>
                  <span className="text-sm font-bold text-charcoal-900">{profile.education}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <Briefcase className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-stone-500 block uppercase">Profession</span>
                  <span className="text-sm font-bold text-charcoal-900">{profile.profession}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <Users className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-stone-500 block uppercase">Religion & Sect</span>
                  <span className="text-sm font-bold text-charcoal-900">
                    {profile.religion} {profile.sect ? `(${profile.sect})` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <HeartHandshake className="w-5 h-5 text-burgundy-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-stone-500 block uppercase">Marital Status</span>
                  <span className="text-sm font-bold text-charcoal-900">
                    {getMaritalStatusLabel(profile.marital_status)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* About / Bio Card */}
          <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-100">
              <h2 className="text-lg font-serif font-extrabold text-burgundy-900">
                About & Family Background
              </h2>
            </div>
            <p className="text-sm sm:text-base text-charcoal-800 leading-relaxed font-medium whitespace-pre-line">
              {profile.about || 'No personal statement provided yet.'}
            </p>
          </Card>
        </div>

        {/* Sidebar Column: Partner Preferences & Management */}
        <div className="space-y-6">
          {/* Profile Management Info */}
          <Card className="p-6 bg-white border-2 border-stone-300 shadow-md space-y-4">
            <h2 className="text-base font-serif font-extrabold text-burgundy-900 pb-2 border-b-2 border-stone-100">
              Profile Management
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase block">Managed By</span>
                <span className="text-sm font-extrabold text-charcoal-900">
                  {getManagedByLabel(profile.managed_by)}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                This indicates whether inquiries will be addressed by the candidate directly or by a family representative.
              </p>
            </div>
          </Card>

          {/* Partner Preferences Card */}
          <Card className="p-6 bg-white border-2 border-stone-300 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-burgundy-700" />
                <h2 className="text-base font-serif font-extrabold text-burgundy-900">
                  Partner Preferences
                </h2>
              </div>
              <Link to="/profile/preferences">
                <Button variant="ghost" size="sm" icon={Edit} className="text-burgundy-800 font-bold">
                  {preferences ? 'Edit' : 'Add'}
                </Button>
              </Link>
            </div>

            {preferences ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase block">Looking For</span>
                  <span className="font-bold text-charcoal-900 capitalize">
                    {preferences.preferred_gender}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase block">Age Range</span>
                  <span className="font-bold text-charcoal-900">
                    {preferences.min_age} to {preferences.max_age} years
                  </span>
                </div>

                {preferences.preferred_cities?.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-stone-500 uppercase block">Preferred Cities</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preferences.preferred_cities.map((city) => (
                        <span key={city} className="text-xs bg-stone-100 text-stone-800 font-semibold px-2 py-0.5 rounded-md border border-stone-300">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.preferred_education && (
                  <div>
                    <span className="text-xs font-bold text-stone-500 uppercase block">Preferred Education</span>
                    <span className="font-bold text-charcoal-900">{preferences.preferred_education}</span>
                  </div>
                )}

                {preferences.preferred_marital_status?.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-stone-500 uppercase block">Marital Status</span>
                    <span className="font-bold text-charcoal-900">
                      {preferences.preferred_marital_status.map(getMaritalStatusLabel).join(', ')}
                    </span>
                  </div>
                )}

                {(preferences.min_height || preferences.max_height) && (
                  <div>
                    <span className="text-xs font-bold text-stone-500 uppercase block">Height Range</span>
                    <span className="font-bold text-charcoal-900">
                      {preferences.min_height ? `${preferences.min_height} cm` : 'Any'} – {preferences.max_height ? `${preferences.max_height} cm` : 'Any'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <p className="text-xs text-stone-500 font-medium">
                  You have not configured your partner preferences yet.
                </p>
                <Link to="/profile/preferences">
                  <Button variant="secondary" size="sm" icon={Sliders} className="font-bold w-full">
                    Set Partner Preferences
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        confirmVariant={confirmModal.confirmVariant}
        loading={actionLoading}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getProfile, activateProfile, hideProfile, getProfilePreview } from '../../api/profile';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
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
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Lock,
  Check,
  X,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, emailVerified } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Public Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

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

  const handleOpenPreview = async () => {
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      const res = await getProfilePreview();
      setPreviewData(res.data);
    } catch (err) {
      // Fallback to local profile safe preview if preview route errors
      if (profile) {
        setPreviewData({
          profile_code: profile.profile_code,
          age: profile.age,
          gender: profile.gender,
          religion: profile.religion,
          sect: profile.sect,
          city: profile.city,
          education: profile.education,
          profession: profile.profession,
          marital_status: profile.marital_status,
          height: profile.height,
          height_formatted: profile.height_formatted,
          managed_by: profile.managed_by,
          profile_status: profile.profile_status,
        });
      }
    } finally {
      setPreviewLoading(false);
    }
  };

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
              Create your profile using structured options. Your personal contact details and private introduction remain strictly protected.
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

  // Activation checklist calculations
  const isEmailOk = Boolean(emailVerified);
  const isBasicComplete = Boolean(
    profile.gender &&
    profile.date_of_birth &&
    profile.religion &&
    (profile.religion === 'Islam' ? profile.sect : true) &&
    profile.city &&
    profile.education &&
    profile.profession &&
    profile.marital_status &&
    profile.height &&
    profile.managed_by
  );
  const isPreferencesSet = Boolean(
    preferences &&
    preferences.preferred_gender &&
    preferences.min_age &&
    preferences.max_age
  );
  const canActivate = isEmailOk && isBasicComplete && isPreferencesSet;

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
          {/* Public Profile Preview Button */}
          <Button
            variant="secondary"
            size="md"
            icon={Eye}
            onClick={handleOpenPreview}
            className="bg-white hover:bg-stone-50 text-burgundy-900 font-bold shadow-sm"
          >
            Public Preview
          </Button>

          <Link to="/profile/edit">
            <Button variant="secondary" size="md" icon={Edit} className="bg-white hover:bg-stone-50 text-burgundy-900 font-bold shadow-sm">
              Edit Biodata
            </Button>
          </Link>

          {profile.profile_status === 'draft' && (
            <Button
              variant="gold"
              size="md"
              icon={CheckCircle2}
              loading={actionLoading}
              onClick={() => {
                if (!canActivate) {
                  setError('Please complete the activation requirements below before activating.');
                  return;
                }
                setConfirmModal({
                  open: true,
                  title: 'Activate Matrimonial Profile',
                  message: 'Your profile will become active and discoverable to compatible matches. You can hide it at any time.',
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
                  message: 'When hidden, your profile will not appear in search or discovery.',
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

      {/* Activation Requirements Checklist Card (Shown when Draft or Hidden) */}
      {profile.profile_status !== 'active' && (
        <Card className="p-6 bg-white border-2 border-stone-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h2 className="text-base font-serif font-extrabold text-burgundy-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-burgundy-700" />
              Profile Activation Requirements
            </h2>
            <span className="text-xs font-bold text-stone-500">
              {canActivate ? 'All Requirements Met ✓' : 'Incomplete'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
            <div className={`p-3.5 rounded-xl border-2 flex items-start gap-2.5 ${
              isEmailOk ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              {isEmailOk ? <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />}
              <div>
                <span className="font-bold block">1. Verified Email</span>
                <span>{isEmailOk ? 'Email address verified' : 'Email verification required'}</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border-2 flex items-start gap-2.5 ${
              isBasicComplete ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              {isBasicComplete ? <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />}
              <div>
                <span className="font-bold block">2. Basic Biodata (60%)</span>
                <span>{isBasicComplete ? 'All 10 core fields filled' : 'Complete all 10 core fields'}</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border-2 flex items-start gap-2.5 ${
              isPreferencesSet ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              {isPreferencesSet ? <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />}
              <div>
                <span className="font-bold block">3. Partner Preferences (30%)</span>
                <span>{isPreferencesSet ? 'Preferences configured' : 'Set partner preferences'}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-500 font-medium">
            💡 <em>Note:</em> "About Candidate" and "Family Background" (10%) are optional and not required to activate your profile.
          </p>
        </Card>
      )}

      {/* Completion Meter Card */}
      <Card className="p-6 bg-white border-2 border-stone-300 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-burgundy-700" />
            <h2 className="text-base font-bold text-charcoal-900">Profile Completion Score</h2>
          </div>
          <span className="text-sm font-extrabold text-burgundy-800">{completion}% / 100%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              completion >= 90
                ? 'bg-emerald-600'
                : completion >= 60
                ? 'bg-amber-600'
                : 'bg-burgundy-700'
            }`}
            style={{ width: `${completion}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-stone-500 pt-1 font-medium">
          <span>• <strong>Basic Biodata:</strong> 60% (10 fields @ 6% each)</span>
          <span>• <strong>Private Info:</strong> 10% (About & Family Background)</span>
          <span>• <strong>Partner Preferences:</strong> 30% (8 match criteria)</span>
        </div>
      </Card>

      {/* Biodata Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Biodata Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Public Matrimonial Biodata */}
          <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-stone-100">
              <div>
                <h2 className="text-lg font-serif font-extrabold text-burgundy-900">
                  Public Matrimonial Biodata
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Standardized fields visible during prospective match discovery.
                </p>
              </div>
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
                  <span className="text-xs font-bold text-stone-500 block uppercase">Age</span>
                  <span className="text-sm font-bold text-charcoal-900">
                    {profile.age} years old <span className="text-xs text-stone-400 font-normal">(DOB: {profile.date_of_birth})</span>
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
                  <span className="text-xs font-bold text-stone-500 block uppercase">Highest Education</span>
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
                  <span className="text-xs font-bold text-stone-500 block uppercase">
                    {profile.religion === 'Islam' ? 'Religion & Sect' : 'Religion'}
                  </span>
                  <span className="text-sm font-bold text-charcoal-900">
                    {profile.religion}{profile.religion === 'Islam' && profile.sect ? ` (${profile.sect})` : ''}
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

          {/* Card: Private Information (Strictly Confidential) */}
          <Card className="p-6 sm:p-8 bg-stone-50/60 border-2 border-stone-300 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-200">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-burgundy-800" />
                <h2 className="text-lg font-serif font-extrabold text-burgundy-900">
                  Private Information (Protected)
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Confidential
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-burgundy-50 border border-burgundy-200 text-xs text-burgundy-950 font-medium">
              🔒 <strong>Privacy Assurance:</strong> About and Family Background are never visible publicly or during search.
              They are only released after mutual rishta acceptance, unlock fee payment, and dual OTP mobile verification.
            </div>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  About Candidate
                </span>
                <p className="text-sm text-charcoal-800 leading-relaxed font-medium whitespace-pre-line">
                  {profile.about || <em className="text-stone-400">No personal statement entered yet.</em>}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Family Background
                </span>
                <p className="text-sm text-charcoal-800 leading-relaxed font-medium whitespace-pre-line">
                  {profile.family_background || <em className="text-stone-400">No family background details entered yet.</em>}
                </p>
              </div>
            </div>
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
                Indicates whether proposals are handled by the candidate directly or family elders.
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
                    {preferences.preferred_gender === 'female' ? 'Bride (Female)' : 'Groom (Male)'}
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

                {preferences.preferred_religion && (
                  <div>
                    <span className="text-xs font-bold text-stone-500 uppercase block">Preferred Religion</span>
                    <span className="font-bold text-charcoal-900">{preferences.preferred_religion}</span>
                  </div>
                )}

                {preferences.preferred_religion === 'Islam' && preferences.preferred_sect && (
                  <div>
                    <span className="text-xs font-bold text-stone-500 uppercase block">Preferred Sect</span>
                    <span className="font-bold text-charcoal-900">{preferences.preferred_sect}</span>
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
        isOpen={confirmModal.open}
        open={confirmModal.open}
        title={confirmModal.title}
        description={confirmModal.message}
        message={confirmModal.message}
        confirmText="Confirm"
        variant={confirmModal.confirmVariant}
        confirmVariant={confirmModal.confirmVariant}
        isLoading={actionLoading}
        loading={actionLoading}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />

      {/* Public Profile Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Public Profile Preview"
        subtitle="This preview shows exactly what other verified members will see during search and discovery."
        maxWidth="max-w-xl"
        footer={
          <Button
            variant="primary"
            size="md"
            onClick={() => setPreviewModalOpen(false)}
            className="font-bold"
          >
            Close Preview
          </Button>
        }
      >
        {previewLoading ? (
          <div className="py-8">
            <LoadingState text="Loading public preview..." />
          </div>
        ) : previewData ? (
          <div className="space-y-5">
            {/* Privacy Notice Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 font-medium space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Privacy Protection Active
              </p>
              <p className="leading-relaxed">
                Full Date of Birth, Contact Details, Email, Phone Number, About Statement, and Family Background are strictly <strong>excluded</strong> from public view.
              </p>
            </div>

            {/* Simulated Public Profile Card */}
            <div className="rounded-2xl border-2 border-burgundy-900/20 bg-stone-50 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider bg-burgundy-900 text-gold-300 px-2.5 py-1 rounded font-bold">
                    {previewData.profile_code}
                  </span>
                  <h3 className="font-serif text-xl font-extrabold text-burgundy-950 mt-2">
                    {previewData.profession} • {previewData.age} years old
                  </h3>
                </div>
                {getStatusBadge(previewData.profile_status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-500 font-bold block uppercase">Gender</span>
                  <span className="font-extrabold text-charcoal-900 capitalize">{previewData.gender}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block uppercase">Location</span>
                  <span className="font-extrabold text-charcoal-900">{previewData.city}, Pakistan</span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block uppercase">Height</span>
                  <span className="font-extrabold text-charcoal-900">{previewData.height_formatted}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block uppercase">Education</span>
                  <span className="font-extrabold text-charcoal-900">{previewData.education}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block uppercase">
                    {previewData.religion === 'Islam' ? 'Faith & Sect' : 'Religion'}
                  </span>
                  <span className="font-extrabold text-charcoal-900">
                    {previewData.religion}{previewData.religion === 'Islam' && previewData.sect ? ` (${previewData.sect})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block uppercase">Marital Status</span>
                  <span className="font-extrabold text-charcoal-900">{getMaritalStatusLabel(previewData.marital_status)}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-stone-200">
                  <span className="text-stone-500 font-bold block uppercase">Managed By</span>
                  <span className="font-extrabold text-charcoal-900">{getManagedByLabel(previewData.managed_by)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}


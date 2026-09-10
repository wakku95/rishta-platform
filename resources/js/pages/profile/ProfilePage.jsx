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
        <Card className="p-8 sm:p-12 text-center space-y-6 bg-navy-800 border border-slate-750 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-magenta-500/20 border border-white/20">
            <HeartHandshake className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
              Create Your Matrimonial Profile
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
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
                className="font-bold text-base px-8 py-3.5 shadow-lg shadow-magenta-500/25 hover:shadow-magenta-500/40"
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
        <Alert variant="success" title="Success" className="border border-emerald-500/40 shadow-xs">
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Notice" className="border border-rose-500/40 shadow-xs">
          {error}
        </Alert>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-800 via-navy-750 to-navy-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-750 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider bg-navy-900/90 text-magenta-300 px-3 py-1 rounded-lg border border-slate-700 font-bold">
              {profile.profile_code}
            </span>
            {getStatusBadge(profile.profile_status)}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {profile.profession} ({profile.age} yrs)
          </h1>
          <p className="text-sm text-slate-300 font-normal">
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
            className="font-bold shadow-sm"
          >
            Public Preview
          </Button>

          <Link to="/profile/edit">
            <Button variant="secondary" size="md" icon={Edit} className="font-bold shadow-sm">
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
        <Card className="p-6 bg-navy-800 border border-slate-750 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <h2 className="text-base font-serif font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-magenta-400" />
              Profile Activation Requirements
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {canActivate ? 'All Requirements Met ✓' : 'Incomplete'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              isEmailOk ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              {isEmailOk ? <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <div>
                <span className="font-bold block text-white">1. Verified Email</span>
                <span>{isEmailOk ? 'Email address verified' : 'Email verification required'}</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              isBasicComplete ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              {isBasicComplete ? <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <div>
                <span className="font-bold block text-white">2. Basic Biodata (60%)</span>
                <span>{isBasicComplete ? 'All 10 core fields filled' : 'Complete all 10 core fields'}</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              isPreferencesSet ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              {isPreferencesSet ? <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <div>
                <span className="font-bold block text-white">3. Partner Preferences (30%)</span>
                <span>{isPreferencesSet ? 'Preferences configured' : 'Set partner preferences'}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-normal">
            💡 <em>Note:</em> "About Candidate" and "Family Background" (10%) are optional and not required to activate your profile.
          </p>
        </Card>
      )}

      {/* Completion Meter Card */}
      <Card className="p-6 bg-navy-800 border border-slate-750 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-magenta-400" />
            <h2 className="text-base font-bold text-white">Profile Completion Score</h2>
          </div>
          <span className="text-sm font-extrabold text-magenta-300">{completion}% / 100%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-navy-900 rounded-full overflow-hidden border border-slate-700">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              completion >= 90
                ? 'bg-emerald-500'
                : completion >= 60
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-magenta-500 to-purple-600'
            }`}
            style={{ width: `${completion}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1 font-normal">
          <span>• <strong className="text-slate-300">Basic Biodata:</strong> 60% (10 fields @ 6% each)</span>
          <span>• <strong className="text-slate-300">Private Info:</strong> 10% (About & Family Background)</span>
          <span>• <strong className="text-slate-300">Partner Preferences:</strong> 30% (8 match criteria)</span>
        </div>
      </Card>

      {/* Biodata Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Biodata Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Public Matrimonial Biodata */}
          <Card className="p-6 sm:p-8 bg-navy-800 border border-slate-750 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-750">
              <div>
                <h2 className="text-lg font-serif font-extrabold text-white">
                  Public Matrimonial Biodata
                </h2>
                <p className="text-xs text-slate-400 font-normal">
                  Standardized fields visible during prospective match discovery.
                </p>
              </div>
              <Link to="/profile/edit">
                <Button variant="ghost" size="sm" icon={Edit} className="text-magenta-400 hover:text-magenta-300 font-bold">
                  Edit
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-750 border border-slate-700">
                <User className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Gender</span>
                  <span className="text-sm font-bold text-white capitalize">{profile.gender}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-750 border border-slate-700">
                <Calendar className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Age</span>
                  <span className="text-sm font-bold text-white">
                    {profile.age} years old <span className="text-xs text-slate-400 font-normal">(DOB: {profile.date_of_birth})</span>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-750 border border-slate-700">
                <Ruler className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Height</span>
                  <span className="text-sm font-bold text-white">{profile.height_formatted}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-750 border border-slate-700">
                <MapPin className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">City & Location</span>
                  <span className="text-sm font-bold text-white">{profile.city}, Pakistan</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-750 border border-slate-700">
                <GraduationCap className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Highest Education</span>
                  <span className="text-sm font-bold text-white">{profile.education}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-750 border border-slate-700">
                <Briefcase className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Profession</span>
                  <span className="text-sm font-bold text-white">{profile.profession}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-750 border border-slate-700">
                <Users className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">
                    {profile.religion === 'Islam' ? 'Religion & Sect' : 'Religion'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {profile.religion}{profile.religion === 'Islam' && profile.sect ? ` (${profile.sect})` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-750 border border-slate-700">
                <HeartHandshake className="w-5 h-5 text-magenta-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Marital Status</span>
                  <span className="text-sm font-bold text-white">
                    {getMaritalStatusLabel(profile.marital_status)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card: Private Information (Strictly Confidential) */}
          <Card className="p-6 sm:p-8 bg-navy-800 border border-slate-750 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-750">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-magenta-400" />
                <h2 className="text-lg font-serif font-extrabold text-white">
                  Private Information (Protected)
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Confidential
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-magenta-950/30 border border-magenta-500/30 text-xs text-magenta-200 font-normal">
              🔒 <strong className="text-white font-semibold">Privacy Assurance:</strong> About and Family Background are never visible publicly or during search.
              They are only released after mutual rishta acceptance, unlock fee payment, and dual OTP mobile verification.
            </div>

            <div className="space-y-4">
              <div className="bg-navy-750 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  About Candidate
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                  {profile.about || <em className="text-slate-500">No personal statement entered yet.</em>}
                </p>
              </div>

              <div className="bg-navy-750 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Family Background
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                  {profile.family_background || <em className="text-slate-500">No family background details entered yet.</em>}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Column: Partner Preferences & Management */}
        <div className="space-y-6">
          {/* Profile Management Info */}
          <Card className="p-6 bg-navy-800 border border-slate-750 shadow-md space-y-4">
            <h2 className="text-base font-serif font-extrabold text-white pb-2 border-b border-slate-750">
              Profile Management
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block">Managed By</span>
                <span className="text-sm font-extrabold text-white">
                  {getManagedByLabel(profile.managed_by)}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                Indicates whether proposals are handled by the candidate directly or family elders.
              </p>
            </div>
          </Card>

          {/* Partner Preferences Card */}
          <Card className="p-6 bg-navy-800 border border-slate-750 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-750">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-magenta-400" />
                <h2 className="text-base font-serif font-extrabold text-white">
                  Partner Preferences
                </h2>
              </div>
              <Link to="/profile/preferences">
                <Button variant="ghost" size="sm" icon={Edit} className="text-magenta-400 hover:text-magenta-300 font-bold">
                  {preferences ? 'Edit' : 'Add'}
                </Button>
              </Link>
            </div>

            {preferences ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Looking For</span>
                  <span className="font-bold text-white capitalize">
                    {preferences.preferred_gender === 'female' ? 'Bride (Female)' : 'Groom (Male)'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Age Range</span>
                  <span className="font-bold text-white">
                    {preferences.min_age} to {preferences.max_age} years
                  </span>
                </div>

                {preferences.preferred_cities?.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Preferred Cities</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {preferences.preferred_cities.map((city) => (
                        <span key={city} className="text-xs bg-navy-750 text-slate-200 font-medium px-2.5 py-0.5 rounded-lg border border-slate-700">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {preferences.preferred_religion && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Preferred Religion</span>
                    <span className="font-bold text-white">{preferences.preferred_religion}</span>
                  </div>
                )}

                {preferences.preferred_religion === 'Islam' && preferences.preferred_sect && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Preferred Sect</span>
                    <span className="font-bold text-white">{preferences.preferred_sect}</span>
                  </div>
                )}

                {preferences.preferred_education && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Preferred Education</span>
                    <span className="font-bold text-white">{preferences.preferred_education}</span>
                  </div>
                )}

                {preferences.preferred_marital_status?.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Marital Status</span>
                    <span className="font-bold text-white">
                      {preferences.preferred_marital_status.map(getMaritalStatusLabel).join(', ')}
                    </span>
                  </div>
                )}

                {(preferences.min_height || preferences.max_height) && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Height Range</span>
                    <span className="font-bold text-white">
                      {preferences.min_height ? `${preferences.min_height} cm` : 'Any'} – {preferences.max_height ? `${preferences.max_height} cm` : 'Any'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <p className="text-xs text-slate-400 font-normal">
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
            className="font-bold shadow-lg shadow-magenta-500/25"
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
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 font-normal space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Privacy Protection Active
              </p>
              <p className="leading-relaxed">
                Full Date of Birth, Contact Details, Email, Phone Number, About Statement, and Family Background are strictly <strong>excluded</strong> from public view.
              </p>
            </div>

            {/* Simulated Public Profile Card */}
            <div className="rounded-2xl border border-slate-750 bg-navy-750 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider bg-navy-900 text-magenta-300 px-2.5 py-1 rounded border border-slate-700 font-bold">
                    {previewData.profile_code}
                  </span>
                  <h3 className="font-serif text-xl font-extrabold text-white mt-2">
                    {previewData.profession} • {previewData.age} years old
                  </h3>
                </div>
                {getStatusBadge(previewData.profile_status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase">Gender</span>
                  <span className="font-extrabold text-white capitalize">{previewData.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase">Location</span>
                  <span className="font-extrabold text-white">{previewData.city}, Pakistan</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase">Height</span>
                  <span className="font-extrabold text-white">{previewData.height_formatted}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase">Education</span>
                  <span className="font-extrabold text-white">{previewData.education}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase">
                    {previewData.religion === 'Islam' ? 'Faith & Sect' : 'Religion'}
                  </span>
                  <span className="font-extrabold text-white">
                    {previewData.religion}{previewData.religion === 'Islam' && previewData.sect ? ` (${previewData.sect})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase">Marital Status</span>
                  <span className="font-extrabold text-white">{getMaritalStatusLabel(previewData.marital_status)}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-750">
                  <span className="text-slate-400 font-bold block uppercase">Managed By</span>
                  <span className="font-extrabold text-white">{getManagedByLabel(previewData.managed_by)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}


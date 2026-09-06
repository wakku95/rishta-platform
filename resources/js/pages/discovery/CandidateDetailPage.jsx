import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Briefcase,
  Ruler,
  HeartHandshake,
  Lock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { getPublicProfile } from '../../api/discovery';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import Alert from '../../components/ui/Alert';

export default function CandidateDetailPage() {
  const { profileCode } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPublicProfile(profileCode);
        if (res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('This candidate profile is no longer active or could not be found.');
        } else if (err.response?.status === 403) {
          setError(err.response.data.message || 'Email verification is required to view candidate profiles.');
        } else {
          setError('Failed to load candidate profile. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileCode]);

  const formatMaritalStatus = (status) => {
    switch (status) {
      case 'never_married':
        return 'Never Married';
      case 'divorced':
        return 'Divorced';
      case 'widowed':
        return 'Widowed';
      case 'separated':
        return 'Separated';
      default:
        return status;
    }
  };

  const formatManagedBy = (managed) => {
    switch (managed) {
      case 'myself':
        return 'Self (Candidate)';
      case 'parent':
        return 'Parent';
      case 'sibling':
        return 'Brother / Sister';
      case 'guardian':
        return 'Guardian';
      case 'family':
        return 'Family Member';
      default:
        return managed;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <LoadingState text="Loading candidate matrimonial profile..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-extrabold text-burgundy-900">Profile Unavailable</h2>
        <p className="text-sm text-stone-600 font-medium">{error}</p>
        <div className="pt-2">
          <Link to="/search">
            <Button variant="primary" icon={ArrowLeft}>
              Back to Candidate Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const faithDisplay = profile.sect
    ? `${profile.religion} (${profile.sect})`
    : profile.religion;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy-800 hover:text-burgundy-950 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search Results
        </Link>
      </div>

      {/* Main Candidate Header Card */}
      <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                Matrimonial Biodata
              </span>
              {profile.verifications?.email_verified && (
                <Badge variant="success" className="inline-flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Email Verified</span>
                </Badge>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-burgundy-900 tracking-tight">
              Profile #{profile.profile_code}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
              Candidate profile managed by <strong className="text-charcoal-800">{formatManagedBy(profile.managed_by)}</strong>
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-2xl sm:text-3xl font-serif font-extrabold text-charcoal-900">
              {profile.age} years
            </span>
            <span className="text-xs font-bold text-stone-500 capitalize flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-burgundy-700" />
              {profile.city}, Pakistan
            </span>
          </div>
        </div>

        {/* Structured Demographics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Faith & Origin */}
          <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-3">
            <h3 className="font-serif text-sm font-extrabold text-burgundy-900 uppercase tracking-wider pb-1 border-b border-stone-200">
              1. Demographics & Faith
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Gender</span>
                <span className="font-extrabold text-charcoal-900 capitalize">{profile.gender}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Faith & Sect</span>
                <span className="font-extrabold text-charcoal-900">{faithDisplay}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Current City</span>
                <span className="font-extrabold text-charcoal-900">{profile.city}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Marital Status</span>
                <span className="font-extrabold text-charcoal-900">{formatMaritalStatus(profile.marital_status)}</span>
              </div>
            </div>
          </div>

          {/* Education & Career */}
          <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-3">
            <h3 className="font-serif text-sm font-extrabold text-burgundy-900 uppercase tracking-wider pb-1 border-b border-stone-200">
              2. Education & Vocation
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Education</span>
                <span className="font-extrabold text-charcoal-900">{profile.education}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Profession</span>
                <span className="font-extrabold text-charcoal-900">{profile.profession}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Height</span>
                <span className="font-extrabold text-charcoal-900">
                  {profile.height_formatted || `${profile.height} cm`}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Listing Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active for Matrimonial
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Private Information Protection Notice Card */}
      <Card className="p-6 sm:p-8 bg-cream-50 border-2 border-gold-300/60 shadow-xs rounded-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 border border-gold-300 flex items-center justify-center text-burgundy-900 shrink-0 mt-0.5">
            <Lock className="w-5 h-5 text-burgundy-800" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-base font-extrabold text-burgundy-900">
              Private Information Strictly Protected
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed font-medium">
              To protect the honor, safety, and privacy of all candidates and their families,
              confidential personal statements, family backgrounds, phone numbers, and emails are
              never publicly displayed.
            </p>
            <p className="text-xs text-stone-500 font-medium">
              Private information is released only after mutual rishta expression of interest,
              recipient acceptance, and verified authorization by both parties.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

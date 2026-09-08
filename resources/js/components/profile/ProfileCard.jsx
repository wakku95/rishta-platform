import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, GraduationCap, Briefcase, Ruler, ShieldCheck, HeartHandshake, Eye, Bookmark } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { addToShortlist, removeFromShortlist } from '../../api/shortlist';

/**
 * Matrimonial candidate summary card for search discovery results.
 * Strictly respects privacy: displays only public demographics without private statements or contacts.
 */
export default function ProfileCard({ profile, isInitiallyShortlisted = false, onShortlistChange }) {
  if (!profile) return null;

  const [isShortlisted, setIsShortlisted] = useState(isInitiallyShortlisted);
  const [loadingShortlist, setLoadingShortlist] = useState(false);

  const handleToggleShortlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingShortlist) return;

    setLoadingShortlist(true);
    try {
      if (isShortlisted) {
        await removeFromShortlist(profile.profile_code);
        setIsShortlisted(false);
        if (onShortlistChange) onShortlistChange(profile.profile_code, false);
      } else {
        await addToShortlist(profile.profile_code);
        setIsShortlisted(true);
        if (onShortlistChange) onShortlistChange(profile.profile_code, true);
      }
    } catch (err) {
      console.error('Shortlist error:', err);
    } finally {
      setLoadingShortlist(false);
    }
  };

  // Format marital status for presentation
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

  // Format managed by label
  const formatManagedBy = (managed) => {
    switch (managed) {
      case 'myself':
        return 'Self';
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

  // Faith formatting (e.g., "Islam • Sunni" or "Hinduism")
  const faithDisplay = (profile.religion === 'Islam' && profile.sect)
    ? `${profile.religion} • ${profile.sect}`
    : profile.religion;

  return (
    <Card className="flex flex-col justify-between bg-white border-2 border-stone-200 hover:border-burgundy-300 transition-all duration-200 shadow-xs hover:shadow-md rounded-2xl overflow-hidden p-5 sm:p-6">
      <div className="space-y-4">
        {/* Header: Profile Code and Verification Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Candidate Profile
            </span>
            <span className="font-mono text-base font-extrabold text-burgundy-900">
              #{profile.profile_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {profile.verifications?.email_verified && (
              <Badge variant="success" className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </Badge>
            )}

            <button
              onClick={handleToggleShortlist}
              disabled={loadingShortlist}
              title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              className={`p-1.5 rounded-lg border transition-colors ${
                isShortlisted
                  ? 'bg-gold-50 border-gold-400 text-gold-700 hover:bg-gold-100'
                  : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-burgundy-800 hover:border-stone-300'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isShortlisted ? 'fill-gold-600 text-gold-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Primary Demographics */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-serif font-extrabold text-charcoal-900">
              {profile.age} yrs
            </span>
            <span className="text-sm font-bold text-stone-500 capitalize">
              • {profile.gender}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 mt-1">
            <MapPin className="w-3.5 h-3.5 text-burgundy-700 shrink-0" />
            <span>{profile.city}</span>
          </div>
        </div>

        {/* Structured Candidate Attributes */}
        <div className="space-y-2 pt-1 text-xs border-t border-stone-100">
          {/* Faith */}
          <div className="flex items-center justify-between text-charcoal-800 py-1">
            <span className="text-stone-500 font-medium">Faith & Sect</span>
            <span className="font-bold text-right text-charcoal-900">{faithDisplay}</span>
          </div>

          {/* Education */}
          <div className="flex items-center justify-between text-charcoal-800 py-1">
            <span className="text-stone-500 font-medium flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
              <span>Education</span>
            </span>
            <span className="font-bold text-right text-charcoal-900">{profile.education}</span>
          </div>

          {/* Profession */}
          <div className="flex items-center justify-between text-charcoal-800 py-1">
            <span className="text-stone-500 font-medium flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-stone-400" />
              <span>Profession</span>
            </span>
            <span className="font-bold text-right text-charcoal-900">{profile.profession}</span>
          </div>

          {/* Height & Marital Status */}
          <div className="flex items-center justify-between text-charcoal-800 py-1">
            <span className="text-stone-500 font-medium flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-stone-400" />
              <span>Height</span>
            </span>
            <span className="font-bold text-right text-charcoal-900">
              {profile.height_formatted || `${profile.height} cm`}
            </span>
          </div>

          <div className="flex items-center justify-between text-charcoal-800 py-1">
            <span className="text-stone-500 font-medium">Status</span>
            <span className="font-bold text-right text-charcoal-900">
              {formatMaritalStatus(profile.marital_status)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Managed By and Action CTA */}
      <div className="mt-5 pt-4 border-t border-stone-100 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-gold-600" />
            <span>Profile Managed By</span>
          </span>
          <span className="font-bold text-charcoal-800">
            {formatManagedBy(profile.managed_by)}
          </span>
        </div>

        <Link to={`/profiles/${profile.profile_code}`} className="block w-full">
          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            className="w-full justify-center text-burgundy-900 border-stone-300 hover:border-burgundy-700 hover:bg-burgundy-50 font-bold"
          >
            View Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
}

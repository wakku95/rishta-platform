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
    <Card className="flex flex-col justify-between bg-navy-800 border border-slate-750 hover:border-magenta-500/50 hover:shadow-xl hover:shadow-magenta-500/5 transition-all duration-200 rounded-2xl overflow-hidden p-5 sm:p-6 group">
      <div className="space-y-4">
        {/* Header: Profile Code and Verification Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-750/70">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Candidate Profile
            </span>
            <span className="font-mono text-sm font-extrabold text-white">
              #{profile.profile_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {profile.verifications?.email_verified && (
              <Badge variant="success" size="sm" className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </Badge>
            )}

            <button
              onClick={handleToggleShortlist}
              disabled={loadingShortlist}
              title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isShortlisted
                  ? 'bg-magenta-500/20 border-magenta-500/40 text-magenta-400 hover:bg-magenta-500/30'
                  : 'bg-navy-750 border-slate-700 text-slate-400 hover:text-magenta-400 hover:border-magenta-500/40'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isShortlisted ? 'fill-magenta-500 text-magenta-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Primary Demographics */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-serif font-extrabold text-white">
              {profile.age} yrs
            </span>
            <span className="text-sm font-bold text-slate-400 capitalize">
              • {profile.gender}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-magenta-400 mt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{profile.city}</span>
          </div>
        </div>

        {/* Structured Candidate Attributes */}
        <div className="space-y-2 pt-1 text-xs border-t border-slate-750/70">
          {/* Faith */}
          <div className="flex items-center justify-between text-slate-300 py-1">
            <span className="text-slate-400 font-medium">Faith & Sect</span>
            <span className="font-bold text-right text-white">{faithDisplay}</span>
          </div>

          {/* Education */}
          <div className="flex items-center justify-between text-slate-300 py-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Education</span>
            </span>
            <span className="font-bold text-right text-white">{profile.education}</span>
          </div>

          {/* Profession */}
          <div className="flex items-center justify-between text-slate-300 py-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Profession</span>
            </span>
            <span className="font-bold text-right text-white">{profile.profession}</span>
          </div>

          {/* Height & Marital Status */}
          <div className="flex items-center justify-between text-slate-300 py-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-slate-400" />
              <span>Height</span>
            </span>
            <span className="font-bold text-right text-white">
              {profile.height_formatted || `${profile.height} cm`}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300 py-1">
            <span className="text-slate-400 font-medium">Status</span>
            <span className="font-bold text-right text-white">
              {formatMaritalStatus(profile.marital_status)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Managed By and Action CTA */}
      <div className="mt-5 pt-4 border-t border-slate-750/70 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />
            <span>Managed By</span>
          </span>
          <span className="font-bold text-slate-200">
            {formatManagedBy(profile.managed_by)}
          </span>
        </div>

        <Link to={`/profiles/${profile.profile_code}`} className="block w-full">
          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            className="w-full justify-center group-hover:border-magenta-500/50 group-hover:bg-navy-750 transition-all font-semibold"
          >
            View Candidate Biodata
          </Button>
        </Link>
      </div>
    </Card>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, GraduationCap, Ruler, AlertCircle, EyeOff } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import GenderAvatar from '../ui/GenderAvatar';
import useAuth from '../../hooks/useAuth';

export default function AssistedListingCard({ listing, onHide }) {
  const { authenticated } = useAuth();
  // Truncate public about text
  const truncateAbout = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, text.lastIndexOf(' ', maxLength)) + '...';
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow bg-navy-800 border-amber-500/20 shadow-amber-500/5 relative overflow-hidden">
      
      {/* Corner Ribbon / Badge */}
      <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 uppercase tracking-wider rounded-bl-lg z-10 shadow-sm">
        Assisted Listing
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Header (No Name) */}
        <div className="flex items-center gap-3 mb-3 pt-2">
          <GenderAvatar gender={listing.gender} size="md" />

          <div>
            <h3 className="text-lg font-bold text-white font-serif tracking-tight">
              {listing.gender === 'male' ? 'Male' : 'Female'} ({listing.age} yrs)
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {listing.listing_code}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-slate-300 border-white/10">
            {listing.religion} {listing.sect ? `(${listing.sect})` : ''}
          </Badge>
          <Badge variant="outline" className="text-slate-300 border-white/10 capitalize">
            {listing.marital_status?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-sm text-slate-300 mb-4 flex-1">
          <div className="flex items-center gap-1.5" title="City">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{listing.city}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Education">
            <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{listing.education}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Profession">
            <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{listing.profession}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Height">
            <Ruler className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{listing.height} cm</span>
          </div>
        </div>

        {/* Short Bio */}
        <div className="mb-4">
          <p className="text-sm text-slate-400 italic line-clamp-3">
            "{truncateAbout(listing.public_about)}"
          </p>
        </div>
        
        {/* Concise Disclaimer */}
        <div className="mt-auto pt-2">
          <p className="text-[10px] text-slate-500 leading-tight">
            <strong className="text-slate-400">Important:</strong> Information provided may not have been independently verified by RaabtaNow. Please independently verify before proceeding.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-navy-900/50 space-y-2">
        <Link
          to={`/listings/${listing.listing_code}`}
          className="w-full flex items-center justify-center py-2.5 bg-navy-800 hover:bg-navy-750 text-amber-400 text-sm font-bold rounded-xl border border-amber-500/30 transition-colors"
        >
          View Full Detail
        </Link>

        {onHide && authenticated && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (window.confirm(`Hide listing #${listing.listing_code} from your discovery results?`)) {
                onHide(listing.listing_code, listing);
              }
            }}
            className="w-full text-center text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center justify-center gap-1.5 pt-1"
            title="Hide this listing from your discovery feed"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Not Interested / Hide</span>
          </button>
        )}
      </div>
    </Card>
  );
}

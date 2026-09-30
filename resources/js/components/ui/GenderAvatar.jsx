import React from 'react';

/**
 * High-quality Male and Female avatars for RaabtaNow candidate profiles.
 * Fits dark and light themes seamlessly.
 */
export default function GenderAvatar({ gender = 'female', size = 'md', className = '' }) {
  const isMale = String(gender).toLowerCase() === 'male';

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    card: 'w-full h-36',
  };

  const containerSize = sizeClasses[size] || size;
  const avatarSrc = isMale ? '/images/avatars/male_avatar.png' : '/images/avatars/female_avatar.png';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-2xl border ${
        isMale ? 'border-emerald-600/30 bg-[#e4f0ec]/30' : 'border-rose-600/30 bg-[#f4e7e9]/30'
      } shadow-sm ${containerSize} ${className}`}
    >
      <img
        src={avatarSrc}
        alt={isMale ? 'Groom Candidate' : 'Bride Candidate'}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

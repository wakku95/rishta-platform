import React from 'react';
import { HeartHandshake } from 'lucide-react';

/**
 * LoadingState with animated RaabtaNow brand logo.
 */
export default function LoadingState({
  message,
  text,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const displayMsg = text || message || 'Loading...';

  const sizeMap = {
    sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4', text: 'text-xs' },
    md: { box: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6', text: 'text-sm' },
    lg: { box: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8', text: 'text-base' },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {/* Animated Glowing Brand Logo */}
      <div className="relative mb-3.5">
        {/* Soft pulse glow ring */}
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-magenta-500/30 to-purple-600/30 blur-md animate-pulse pointer-events-none" />

        {/* Logo Container */}
        <div className={`relative ${current.box} bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-magenta-500/30 border border-white/25 animate-pulse`}>
          <HeartHandshake className={`${current.icon} text-white`} />
        </div>
      </div>

      {displayMsg && (
        <p className={`${current.text} font-medium text-slate-300 animate-pulse`}>
          {displayMsg}
        </p>
      )}
    </div>
  );
}

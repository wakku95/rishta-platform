import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingState spinner and skeleton placeholders.
 */
export default function LoadingState({
  message,
  text,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const displayMsg = text || message || 'Loading details...';
  const sizeStyles = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <Loader2 className={`${sizeStyles[size] || sizeStyles.md} animate-spin text-magenta-400 mb-3`} />
      {displayMsg && <p className="text-sm font-medium text-slate-400">{displayMsg}</p>}
    </div>
  );
}

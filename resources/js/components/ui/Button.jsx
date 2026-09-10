import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Enhanced, accessible Button component.
 * Ensures buttons always look like interactive buttons with clear boundaries and hover states.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost' | 'outline'
  size = 'md',        // 'sm' | 'md' | 'lg'
  isLoading = false,
  loading = false,
  disabled = false,
  className = '',
  icon: Icon = null,
  iconPosition = 'left',
  ...props
}) {
  const isButtonLoading = isLoading || loading;
  const isDisabled = disabled || isButtonLoading;

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-5 py-2.5 min-h-[44px] gap-2', // 44px touch target on mobile
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
  };

  const variantStyles = {
    // Primary: Vibrant Magenta-to-Purple gradient with hover glow
    primary: 'gradient-btn text-white font-bold border border-white/20 shadow-md focus:ring-magenta-500',
    // Secondary: Elevated Navy surface with crisp border
    secondary: 'bg-navy-800 text-slate-100 hover:bg-navy-750 active:bg-navy-700 hover:text-white border border-slate-700/80 hover:border-magenta-500/50 shadow-xs focus:ring-purple-500',
    // Gold: Warm amber accent button
    gold: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 border border-amber-400/40 shadow-sm focus:ring-amber-400',
    // Danger: High-contrast Rose/Red
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-rose-500/40 shadow-sm focus:ring-rose-500',
    // Outline: Glass transparent with subtle magenta/purple border
    outline: 'bg-transparent text-slate-200 hover:text-white hover:bg-navy-800 border border-slate-700 hover:border-magenta-500 focus:ring-magenta-500',
    // Ghost: Low-profile dark navy button
    ghost: 'bg-transparent text-slate-300 hover:text-white hover:bg-navy-800/80 border border-transparent hover:border-slate-800 focus:ring-purple-500',
  };

  const disabledStyles = 'opacity-40 cursor-not-allowed bg-navy-800! text-slate-500! border-slate-800! shadow-none! pointer-events-none';

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${isDisabled ? disabledStyles : 'active:scale-[0.98]'}
        ${className}
      `}
      {...props}
    >
      {isButtonLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
      {!isButtonLoading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span className="truncate">{children}</span>
      {!isButtonLoading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}

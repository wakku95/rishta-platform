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
  disabled = false,
  className = '',
  icon: Icon = null,
  iconPosition = 'left',
  ...props
}) {
  const isDisabled = disabled || isLoading;

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-5 py-2.5 min-h-[44px] gap-2', // 44px touch target on mobile
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
  };

  const variantStyles = {
    // Primary: Rich Burgundy with clear border and drop shadow
    primary: 'bg-burgundy-700 text-white hover:bg-burgundy-800 active:bg-burgundy-900 border border-burgundy-900/30 shadow-sm focus:ring-burgundy-700',
    // Secondary: High-contrast white card button with prominent stone border
    secondary: 'bg-white text-charcoal-900 hover:bg-stone-50 active:bg-stone-100 hover:text-burgundy-800 border-2 border-stone-300 hover:border-burgundy-700 shadow-xs focus:ring-burgundy-700',
    // Gold: Warm Pakistani subtle gold button
    gold: 'bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700 border border-gold-600/40 shadow-sm focus:ring-gold-500',
    // Danger: High-contrast Red for destructive actions
    danger: 'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 border border-rose-900/30 shadow-sm focus:ring-rose-600',
    // Outline: Transparent with explicit burgundy border
    outline: 'bg-transparent text-burgundy-800 hover:bg-burgundy-50 border-2 border-burgundy-700 focus:ring-burgundy-700',
    // Ghost: Subtle stone button with visible border
    ghost: 'bg-stone-100 text-charcoal-800 hover:bg-stone-200 active:bg-stone-300 border border-stone-200 hover:border-stone-300 focus:ring-burgundy-600',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed bg-stone-200! text-stone-500! border-stone-300! shadow-none! pointer-events-none';

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
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
      {!isLoading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span className="truncate">{children}</span>
      {!isLoading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}

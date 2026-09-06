import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button component with cultural Burgundy/Gold styling.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon = null,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2', // 44px touch target on mobile
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-burgundy-700 text-white hover:bg-burgundy-800 focus:ring-burgundy-700 shadow-sm border border-transparent',
    secondary: 'bg-white text-charcoal-800 border border-cream-300 hover:bg-cream-100 hover:border-cream-400 focus:ring-burgundy-600 shadow-xs',
    gold: 'bg-gold-500 text-white hover:bg-gold-600 focus:ring-gold-500 shadow-sm border border-transparent',
    danger: 'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-600 shadow-sm border border-transparent',
    ghost: 'text-charcoal-700 hover:bg-cream-200 focus:ring-burgundy-600 border border-transparent',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {!isLoading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  );
}

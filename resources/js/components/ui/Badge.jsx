import React from 'react';

/**
 * Status and tag Badge component.
 */
export default function Badge({
  children,
  variant = 'default', // 'default' | 'burgundy' | 'gold' | 'success' | 'warning' | 'danger'
  size = 'md',        // 'sm' | 'md'
  className = '',
  icon: Icon = null,
  ...props
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-medium gap-1.5',
  };

  const variantStyles = {
    default: 'bg-cream-200 text-charcoal-700 border border-cream-300',
    burgundy: 'bg-burgundy-50 text-burgundy-700 border border-burgundy-200',
    gold: 'bg-gold-50 text-gold-700 border border-gold-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.default} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

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
    default: 'bg-navy-750 text-slate-300 border border-slate-700/80',
    burgundy: 'bg-magenta-500/15 text-magenta-400 border border-magenta-500/30',
    magenta: 'bg-magenta-500/15 text-magenta-400 border border-magenta-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    gold: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
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

import React from 'react';
import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from 'lucide-react';

/**
 * Alert banner component for warnings, errors, and announcements.
 */
export default function Alert({
  children,
  title,
  variant = 'info', // 'info' | 'success' | 'warning' | 'danger' | 'burgundy'
  onClose,
  className = '',
}) {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: TriangleAlert,
    danger: AlertCircle,
    burgundy: Info,
  };

  const Icon = icons[variant] || Info;

  const variantStyles = {
    info: 'bg-blue-950/40 border-blue-800/60 text-blue-200',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
    danger: 'bg-rose-950/40 border-rose-800/60 text-rose-200',
    burgundy: 'bg-magenta-950/40 border-magenta-800/60 text-magenta-200',
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 border rounded-2xl ${variantStyles[variant] || variantStyles.info} ${className}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-current"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

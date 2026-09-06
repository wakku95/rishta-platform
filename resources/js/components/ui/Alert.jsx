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
    info: 'bg-blue-50/80 border-blue-200 text-blue-900 icon-blue-600',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900 icon-emerald-600',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900 icon-amber-600',
    danger: 'bg-rose-50/80 border-rose-200 text-rose-900 icon-rose-600',
    burgundy: 'bg-burgundy-50/80 border-burgundy-200 text-burgundy-900 icon-burgundy-700',
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

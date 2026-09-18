import React from 'react';

/**
 * Reusable Card container with visible borders and distinct header/body/footer divisions.
 */
export default function Card({
  children,
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = '',
  footer,
  ...props
}) {
  const hasHeader = Boolean(title || subtitle || action);
  const hasFooter = Boolean(footer);

  // If no header or footer is required, render as a single unified container to avoid double-padding and broken flex
  if (!hasHeader && !hasFooter && !bodyClassName) {
    const hasExplicitPadding = /\b(p|px|py)-/.test(className);
    const paddingClass = hasExplicitPadding ? '' : 'p-4 sm:p-6';

    return (
      <div
        className={`bg-navy-800 border border-slate-750/80 rounded-2xl shadow-lg shadow-black/25 overflow-hidden transition-all duration-200 ${paddingClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`bg-navy-800 border border-slate-750/80 rounded-2xl shadow-lg shadow-black/25 overflow-hidden transition-all duration-200 ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-750/70 bg-navy-850/50 flex items-center justify-between gap-3">
          <div>
            {title && <h3 className="font-bold text-white text-base tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-4 sm:p-6 ${bodyClassName}`}>
        {children}
      </div>

      {hasFooter && (
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-navy-850/50 border-t border-slate-750/70">
          {footer}
        </div>
      )}
    </div>
  );
}

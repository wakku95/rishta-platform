import React from 'react';

/**
 * Reusable Card container for sections and profile teasers.
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
  return (
    <div
      className={`bg-white border border-cream-300/80 rounded-2xl shadow-xs overflow-hidden transition-all duration-150 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-cream-200/80 flex items-center justify-between gap-3">
          <div>
            {title && <h3 className="font-semibold text-charcoal-900 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-charcoal-600 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-5 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="px-5 py-3 bg-cream-100/60 border-t border-cream-200/80">
          {footer}
        </div>
      )}
    </div>
  );
}

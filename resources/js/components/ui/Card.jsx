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
  return (
    <div
      className={`bg-white border-2 border-stone-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-150 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b-2 border-stone-100 bg-stone-50/75 flex items-center justify-between gap-3">
          <div>
            {title && <h3 className="font-bold text-charcoal-900 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-600 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 bg-stone-50/75 border-t-2 border-stone-100">
          {footer}
        </div>
      )}
    </div>
  );
}

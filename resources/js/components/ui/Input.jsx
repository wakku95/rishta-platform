import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Mobile-first Input component with high-contrast borders and clear error states.
 */
const Input = forwardRef(function Input({
  label,
  id,
  name,
  type = 'text',
  error,
  helperText,
  className = '',
  required = false,
  ...props
}, ref) {
  const inputId = id || name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-200"
        >
          {label}
          {required && <span className="text-magenta-400 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`
            w-full px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-navy-750
            border rounded-xl transition-all duration-150
            placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-magenta-500/30 focus:border-magenta-500
            disabled:bg-navy-850 disabled:text-slate-600 disabled:border-slate-800 disabled:cursor-not-allowed
            ${error
              ? 'border-rose-500 bg-rose-500/10 text-rose-200 focus:ring-rose-500/20 focus:border-rose-500'
              : 'border-slate-700 hover:border-slate-600'}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <div
          id={`${inputId}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1.5 rounded-lg"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-xs text-slate-400 font-medium">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;

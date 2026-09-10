import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Textarea component with high-contrast borders and character counter.
 */
const Textarea = forwardRef(function Textarea({
  label,
  id,
  name,
  rows = 4,
  error,
  helperText,
  className = '',
  required = false,
  maxLength,
  value,
  ...props
}, ref) {
  const textareaId = id || name;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-slate-200"
          >
            {label}
            {required && <span className="text-magenta-400 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="text-xs font-medium text-slate-400">
            {typeof value === 'string' ? value.length : 0} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        required={required}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        className={`
          w-full px-4 py-2.5 text-sm font-medium text-white bg-navy-750
          border rounded-xl transition-all duration-150 resize-y
          placeholder:text-slate-500
          focus:outline-none focus:ring-2 focus:ring-magenta-500/30 focus:border-magenta-500
          disabled:bg-navy-900 disabled:text-slate-500 disabled:border-slate-800 disabled:cursor-not-allowed
          ${error
            ? 'border-rose-500/80 bg-rose-950/20 text-white focus:ring-rose-500/20 focus:border-rose-500'
            : 'border-slate-700 hover:border-slate-600'}
          ${className}
        `}
        {...props}
      />

      {error && (
        <div
          id={`${textareaId}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1.5 rounded-lg"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {!error && helperText && (
        <p id={`${textareaId}-helper`} className="text-xs text-slate-400 font-medium px-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Textarea;

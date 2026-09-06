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
            className="block text-sm font-semibold text-charcoal-900"
          >
            {label}
            {required && <span className="text-burgundy-700 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="text-xs font-medium text-stone-500">
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
          w-full px-4 py-2.5 text-sm font-medium text-charcoal-900 bg-white
          border-2 rounded-xl transition-all duration-150 resize-y
          placeholder:text-stone-400
          focus:outline-none focus:ring-4 focus:ring-burgundy-700/15 focus:border-burgundy-700
          disabled:bg-stone-100 disabled:text-stone-500 disabled:border-stone-200 disabled:cursor-not-allowed
          ${error
            ? 'border-rose-600 bg-rose-50/20 text-rose-950 focus:ring-rose-500/20 focus:border-rose-600'
            : 'border-stone-300 hover:border-stone-400'}
          ${className}
        `}
        {...props}
      />

      {error && (
        <div
          id={`${textareaId}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {!error && helperText && (
        <p id={`${textareaId}-helper`} className="text-xs text-stone-600 font-medium px-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Textarea;

import React, { forwardRef } from 'react';

/**
 * Textarea component with character counter and error handling.
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-charcoal-800"
          >
            {label}
            {required && <span className="text-burgundy-700 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="text-xs text-charcoal-500">
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
          w-full px-3.5 py-2.5 text-sm text-charcoal-900 bg-white
          border rounded-xl shadow-xs transition-colors duration-150 resize-y
          placeholder:text-charcoal-500/60
          focus:outline-none focus:ring-2 focus:ring-burgundy-700 focus:border-transparent
          disabled:bg-cream-200 disabled:text-charcoal-500 disabled:cursor-not-allowed
          ${error ? 'border-rose-500 focus:ring-rose-500' : 'border-cream-300 hover:border-cream-400'}
          ${className}
        `}
        {...props}
      />

      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${textareaId}-helper`} className="mt-1.5 text-xs text-charcoal-600">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Textarea;

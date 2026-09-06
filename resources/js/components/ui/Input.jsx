import React, { forwardRef } from 'react';

/**
 * Mobile-first text/number/email Input component with label and error state.
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
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-charcoal-800 mb-1.5"
        >
          {label}
          {required && <span className="text-burgundy-700 ml-1" aria-hidden="true">*</span>}
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
            w-full px-3.5 py-2.5 min-h-[44px] text-sm text-charcoal-900 bg-white
            border rounded-xl shadow-xs transition-colors duration-150
            placeholder:text-charcoal-500/60
            focus:outline-none focus:ring-2 focus:ring-burgundy-700 focus:border-transparent
            disabled:bg-cream-200 disabled:text-charcoal-500 disabled:cursor-not-allowed
            ${error ? 'border-rose-500 focus:ring-rose-500' : 'border-cream-300 hover:border-cream-400'}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-charcoal-600">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;

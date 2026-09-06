import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Mobile-friendly Select dropdown component.
 */
const Select = forwardRef(function Select({
  label,
  id,
  name,
  options = [],
  placeholder = 'Select an option',
  error,
  helperText,
  className = '',
  required = false,
  ...props
}, ref) {
  const selectId = id || name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-charcoal-800 mb-1.5"
        >
          {label}
          {required && <span className="text-burgundy-700 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={`
            w-full appearance-none px-3.5 py-2.5 pr-10 min-h-[44px] text-sm text-charcoal-900 bg-white
            border rounded-xl shadow-xs transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-burgundy-700 focus:border-transparent
            disabled:bg-cream-200 disabled:text-charcoal-500 disabled:cursor-not-allowed
            ${error ? 'border-rose-500 focus:ring-rose-500' : 'border-cream-300 hover:border-cream-400'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={typeof opt === 'object' ? opt.value : opt}
              value={typeof opt === 'object' ? opt.value : opt}
            >
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p id={`${selectId}-error`} className="mt-1.5 text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${selectId}-helper`} className="mt-1.5 text-xs text-charcoal-600">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Select;

import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

/**
 * Mobile-friendly Select dropdown component with prominent borders.
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
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-semibold text-charcoal-900"
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
            w-full appearance-none px-4 py-2.5 pr-10 min-h-[44px] text-sm font-medium text-charcoal-900 bg-white
            border-2 rounded-xl transition-all duration-150 cursor-pointer
            focus:outline-none focus:ring-4 focus:ring-burgundy-700/15 focus:border-burgundy-700
            disabled:bg-stone-100 disabled:text-stone-500 disabled:border-stone-200 disabled:cursor-not-allowed
            ${error
              ? 'border-rose-600 bg-rose-50/20 text-rose-950 focus:ring-rose-500/20 focus:border-rose-600'
              : 'border-stone-300 hover:border-stone-400'}
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

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <div
          id={`${selectId}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {!error && helperText && (
        <p id={`${selectId}-helper`} className="text-xs text-stone-600 font-medium px-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Select;

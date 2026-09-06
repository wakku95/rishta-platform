import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Top-level FormError summary for validation messages.
 */
export default function FormError({
  message,
  errors = {},
  className = '',
}) {
  if (!message && Object.keys(errors).length === 0) return null;

  const errorList = Object.values(errors).flat();

  return (
    <div
      role="alert"
      className={`p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl ${className}`}
    >
      <div className="flex items-center gap-2 font-medium text-sm">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
        <span>{message || 'Please correct the errors below:'}</span>
      </div>

      {errorList.length > 0 && (
        <ul className="mt-2 list-disc list-inside text-xs text-rose-700 space-y-1 pl-1">
          {errorList.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

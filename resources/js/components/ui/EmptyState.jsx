import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState component with friendly guidance and next action.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are currently no records to display.',
  actionText,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center bg-white border border-dashed border-cream-300 rounded-2xl ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-burgundy-50 border border-burgundy-100 flex items-center justify-center text-burgundy-700 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-charcoal-900 mb-1.5">{title}</h4>
      <p className="text-sm text-charcoal-600 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

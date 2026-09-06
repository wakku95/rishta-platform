import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { TriangleAlert } from 'lucide-react';

/**
 * Reusable Confirmation Dialog for destructive or sensitive actions.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2.5 rounded-xl shrink-0 ${variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-burgundy-50 text-burgundy-700'}`}>
          <TriangleAlert className="w-5 h-5" />
        </div>
        <div className="text-sm text-charcoal-700 leading-relaxed pt-1">
          {description}
        </div>
      </div>
    </Modal>
  );
}

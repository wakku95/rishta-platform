import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { TriangleAlert } from 'lucide-react';

/**
 * Reusable Confirmation Dialog for destructive or sensitive actions.
 */
export default function ConfirmDialog({
  isOpen,
  open,
  onClose,
  onCancel,
  onConfirm,
  title = 'Are you sure?',
  description,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant,
  confirmVariant = 'danger',
  isLoading,
  loading = false,
}) {
  const isModalOpen = isOpen ?? open ?? false;
  const handleClose = onClose ?? onCancel ?? (() => {});
  const modalDescription = description ?? message ?? 'This action cannot be undone.';
  const modalVariant = variant ?? confirmVariant ?? 'danger';
  const isActionLoading = isLoading ?? loading ?? false;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      maxWidth="max-w-md"
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isActionLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={modalVariant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isActionLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2.5 rounded-xl shrink-0 ${modalVariant === 'danger' ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60' : 'bg-magenta-950/60 text-magenta-400 border border-magenta-800/60'}`}>
          <TriangleAlert className="w-5 h-5" />
        </div>
        <div className="text-sm text-slate-300 leading-relaxed pt-1">
          {modalDescription}
        </div>
      </div>
    </Modal>
  );
}

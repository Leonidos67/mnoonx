import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import ResponsiveDialogShell from './ResponsiveDialogShell';

export type ConfirmVariant = 'danger' | 'default';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onCancel]);

  const isDanger = variant === 'danger';

  return (
    <ResponsiveDialogShell
      open={isOpen}
      onClose={onCancel}
      title={title}
      sheetPadded
      role="alertdialog"
      disableClose={loading}
      zIndexClass="z-[130]"
      panelClassName="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isDanger ? 'bg-red-50 text-red-600' : 'bg-[#eef2ff] text-[#315efb]'
            }`}
          >
            <AlertTriangle className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div>
            <h2 id="confirm-modal-title" className="text-lg font-bold text-neutral-900">
              {title}
            </h2>
            <p id="confirm-modal-message" className="mt-2 text-sm leading-relaxed text-neutral-600">
              {message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="shrink-0 rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
            isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-neutral-800'
          }`}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </ResponsiveDialogShell>
  );
};

export default ConfirmModal;

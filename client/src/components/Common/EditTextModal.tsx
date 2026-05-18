import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import ResponsiveDialogShell from './ResponsiveDialogShell';

export interface EditTextModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  initialValue: string;
  placeholder?: string;
  maxLength?: number;
  submitLabel?: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

const EditTextModal: React.FC<EditTextModalProps> = ({
  isOpen,
  title,
  description,
  initialValue,
  placeholder = '',
  maxLength = 2000,
  submitLabel = 'Save',
  saving = false,
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValue(initialValue);
    const t = window.setTimeout(() => {
      textareaRef.current?.focus();
      const len = initialValue.length;
      textareaRef.current?.setSelectionRange(len, len);
    }, 50);
    return () => clearTimeout(t);
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, saving, onClose]);

  const trimmed = value.trim();
  const unchanged = trimmed === initialValue.trim();
  const canSubmit = trimmed.length > 0 && !unchanged && !saving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(trimmed);
  };

  return (
    <ResponsiveDialogShell
      open={isOpen}
      onClose={onClose}
      title={title}
      sheetPadded
      disableClose={saving}
      panelClassName="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
      zIndexClass="z-[120]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 id="edit-text-modal-title" className="text-xl font-bold text-neutral-900">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
            placeholder={placeholder}
            rows={5}
            disabled={saving}
            className="w-full resize-y rounded-2xl border border-neutral-200 px-4 py-3 text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:bg-neutral-50"
          />
          <p className="mt-1.5 text-right text-xs text-neutral-400">
            {value.length}/{maxLength}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 rounded-xl bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </ResponsiveDialogShell>
  );
};

export default EditTextModal;

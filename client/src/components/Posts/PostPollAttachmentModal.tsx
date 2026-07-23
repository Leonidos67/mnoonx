import React, { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import {
  createEmptyPollDraft,
  isValidPollDraft,
  newPollOptionId,
  type PostPollDraft,
} from '../../types/postPoll';

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;
const OPTION_MAX = 80;

export interface PostPollAttachmentFormProps {
  initialValue?: PostPollDraft | null;
  onSave: (poll: PostPollDraft) => void;
  onCancel: () => void;
  variant?: 'modal' | 'sheet';
}

export const PostPollAttachmentForm: React.FC<PostPollAttachmentFormProps> = ({
  initialValue,
  onSave,
  onCancel,
  variant = 'modal',
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<PostPollDraft['options']>(
    () => initialValue?.options?.length
      ? initialValue.options.map((o) => ({ ...o }))
      : createEmptyPollDraft().options
  );
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setOptions(
      initialValue?.options?.length
        ? initialValue.options.map((o) => ({ ...o }))
        : createEmptyPollDraft().options
    );
    setError(null);
  }, [initialValue]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const updateOption = (id: string, text: string) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, text: text.slice(0, OPTION_MAX) } : o))
    );
    setError(null);
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, { id: newPollOptionId(), text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleSave = () => {
    const draft: PostPollDraft = {
      options: options.map((o) => ({ id: o.id, text: o.text.trim() })),
    };
    if (!isValidPollDraft(draft)) {
      setError(t('postPoll.minOptions'));
      return;
    }
    onSave({
      options: draft.options.filter((o) => o.text),
    });
  };

  const footerClass =
    variant === 'sheet'
      ? 'mt-4 flex gap-2 border-t border-neutral-100 pt-3'
      : 'mt-5 flex justify-end gap-2';

  return (
    <div className={variant === 'sheet' ? 'px-1' : ''}>
      <p className="mb-3 text-sm text-neutral-500">{t('postPoll.hint')}</p>
      <div className="space-y-2">
        {options.map((opt, index) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(opt.id, e.target.value)}
              placeholder={t('postPoll.optionPlaceholder', { n: index + 1 })}
              maxLength={OPTION_MAX}
              className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            />
            {options.length > MIN_OPTIONS ? (
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label={t('postPoll.removeOption')}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <span className="w-8 shrink-0" aria-hidden />
            )}
          </div>
        ))}
      </div>
      {options.length < MAX_OPTIONS ? (
        <button
          type="button"
          onClick={addOption}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('postPoll.addOption')}
        </button>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className={footerClass}>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {t('postPoll.save')}
        </button>
      </div>
    </div>
  );
};

interface PostPollAttachmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (poll: PostPollDraft) => void;
  initialValue?: PostPollDraft | null;
}

const PostPollAttachmentModal: React.FC<PostPollAttachmentModalProps> = ({
  open,
  onClose,
  onSave,
  initialValue,
}) => {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-poll-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="post-poll-modal-title" className="text-lg font-semibold text-neutral-900">
            {t('postPoll.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <PostPollAttachmentForm
          initialValue={initialValue}
          onSave={(poll) => {
            onSave(poll);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default PostPollAttachmentModal;

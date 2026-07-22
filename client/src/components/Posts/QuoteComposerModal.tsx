import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import QuotedPostCard from './QuotedPostCard';
import type { FeedPost } from '../../types/postFeed';
import { useTranslation } from '../../i18n/useTranslation';

export interface QuoteComposerModalProps {
  open: boolean;
  quotedPost: FeedPost | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
}

const MAX_LENGTH = 2000;

/** Modal for composing a quote-repost: adds a comment above a preview of the quoted post. */
const QuoteComposerModal: React.FC<QuoteComposerModalProps> = ({
  open,
  quotedPost,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setContent('');
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open, quotedPost?._id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit(content.trim());
  };

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={onClose}
      title={t('quoteComposer.title')}
      sheetPadded
      disableClose={submitting}
      panelClassName="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
      zIndexClass="z-[120]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-neutral-900">{t('quoteComposer.title')}</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          placeholder={t('quoteComposer.placeholder')}
          rows={4}
          disabled={submitting}
          className="w-full resize-y rounded-2xl border border-neutral-200 px-4 py-3 text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:bg-neutral-50"
        />

        <QuotedPostCard quotedPost={quotedPost} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t('postComposer.posting') : t('quoteComposer.submit')}
          </button>
        </div>
      </form>
    </ResponsiveDialogShell>
  );
};

export default QuoteComposerModal;

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { normalizePostMediaUrl } from '../../utils/postMedia';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface PostMediaUrlModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (url: string) => void;
}

const PostMediaUrlModal: React.FC<PostMediaUrlModalProps> = ({ open, onClose, onAdd }) => {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewOk, setPreviewOk] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const reset = useCallback(() => {
    setUrlInput('');
    setError(null);
    setPreviewOk(null);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const normalized = normalizePostMediaUrl(urlInput);

  useEffect(() => {
    if (!open || !normalized) {
      setPreviewOk(null);
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    setPreviewOk(null);
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setPreviewOk(true);
        setChecking(false);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setPreviewOk(false);
        setChecking(false);
      }
    };
    img.src = resolveMediaUrl(normalized);
    return () => {
      cancelled = true;
    };
  }, [open, normalized]);

  const handleSave = () => {
    const url = normalizePostMediaUrl(urlInput);
    if (!url) {
      setError(t('postMedia.urlInvalid'));
      return;
    }
    onAdd(url);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-media-url-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="post-media-url-title" className="text-lg font-bold text-neutral-900">
            {t('postMedia.urlModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100"
            aria-label={t('postComposer.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        <label className="block text-sm font-medium text-neutral-700">{t('postMedia.urlLabel')}</label>
        <input
          type="url"
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            setError(null);
          }}
          placeholder={t('postMedia.urlPlaceholder')}
          className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5"
          autoFocus
        />
        <p className="mt-1.5 text-xs text-neutral-500">{t('postMedia.urlHint')}</p>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        {normalized ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-500">
                <Loader2 size={18} className="animate-spin" />
                {t('postMedia.urlChecking')}
              </div>
            ) : previewOk === true ? (
              <img
                src={resolveMediaUrl(normalized)}
                alt=""
                className="mx-auto max-h-40 w-full rounded-lg object-contain"
              />
            ) : previewOk === false ? (
              <p className="py-4 text-center text-sm text-amber-700">{t('postMedia.urlPreviewFailed')}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-neutral-100"
          >
            {t('postComposer.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!normalized || checking}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {t('postMedia.urlAdd')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostMediaUrlModal;

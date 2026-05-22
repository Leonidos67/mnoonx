import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Link2, Loader2, Trash2, Upload, X } from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { useTranslation } from '../../i18n/useTranslation';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { normalizePostMediaUrl } from '../../utils/postMedia';

interface CommunityBannerModalProps {
  open: boolean;
  onClose: () => void;
  bannerUrl: string;
  busy: boolean;
  onUploadFile: (file: File) => void | Promise<void>;
  onSaveUrl: (url: string) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
}

const CommunityBannerModal: React.FC<CommunityBannerModalProps> = ({
  open,
  onClose,
  bannerUrl,
  busy,
  onUploadFile,
  onSaveUrl,
  onRemove,
}) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewOk, setPreviewOk] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const hasBanner = Boolean(bannerUrl?.trim());
  const displayUrl = hasBanner ? resolveMediaUrl(bannerUrl) : '';
  const normalizedDraft = normalizePostMediaUrl(urlInput);
  const modalTitle = t('brandingBanner.modalTitle');

  const resetUrlForm = useCallback(() => {
    setUrlInput('');
    setError(null);
    setPreviewOk(null);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetUrlForm();
  }, [open, resetUrlForm]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open || !normalizedDraft) {
      setPreviewOk(null);
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    setPreviewOk(null);
    const img = new window.Image();
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
    img.src = resolveMediaUrl(normalizedDraft);
    return () => {
      cancelled = true;
    };
  }, [open, normalizedDraft]);

  const handleSaveUrl = () => {
    const url = normalizePostMediaUrl(urlInput);
    if (!url) {
      setError(t('brandingBanner.urlInvalid'));
      return;
    }
    void onSaveUrl(url);
  };

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void onUploadFile(file);
  };

  const body = (
    <div
      className="flex min-h-0 flex-1 flex-col lg:max-h-[min(90vh,640px)]"
      aria-labelledby="community-banner-modal-title"
    >
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3 lg:border-b lg:border-neutral-200 lg:pb-4">
        <h2 id="community-banner-modal-title" className="text-lg font-bold text-neutral-900">
          {modalTitle}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="hidden rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-50 lg:block"
          aria-label={t('postComposer.cancel')}
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:px-0">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
          <div className="relative aspect-[3/1] min-h-[100px] w-full bg-gradient-to-r from-gray-800 to-gray-900 sm:min-h-[120px]">
            {hasBanner ? (
              <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-neutral-400">
                {t('brandingBanner.noBanner')}
              </div>
            )}
            {busy ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : null}
          </div>
        </div>

        {hasBanner ? (
          <button
            type="button"
            onClick={() => void onRemove()}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {t('brandingBanner.remove')}
          </button>
        ) : null}

        <div className="mt-5 space-y-4 pb-1">
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">{t('brandingBanner.uploadFile')}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePickFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            >
              <Upload size={18} />
              {t('brandingBanner.chooseFile')}
            </button>
          </div>

          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {t('brandingBanner.or')}
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-800">
              <Link2 size={16} className="text-neutral-500" />
              {t('brandingBanner.urlSection')}
            </p>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setError(null);
              }}
              placeholder={t('brandingBanner.urlPlaceholder')}
              disabled={busy}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-neutral-500">{t('brandingBanner.urlHint')}</p>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

            {normalizedDraft ? (
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                {checking ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-500">
                    <Loader2 size={18} className="animate-spin" />
                    {t('postMedia.urlChecking')}
                  </div>
                ) : previewOk === true ? (
                  <img
                    src={resolveMediaUrl(normalizedDraft)}
                    alt=""
                    className="mx-auto max-h-28 w-full rounded-lg object-contain"
                  />
                ) : previewOk === false ? (
                  <p className="py-4 text-center text-sm text-amber-700">
                    {t('postMedia.urlPreviewFailed')}
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSaveUrl}
              disabled={busy || !normalizedDraft || checking}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              <ImageIcon size={16} />
              {t('brandingBanner.applyUrl')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={onClose}
      title={modalTitle}
      sheetPadded
      disableClose={busy}
      zIndexClass="z-[200]"
      panelClassName="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-xl lg:p-6"
    >
      {body}
    </ResponsiveDialogShell>
  );
};

export default CommunityBannerModal;

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { COMMUNITIES_API } from '../../config/api';
import { communityPath } from '../../constants/communityRoutes';
import { useTranslation } from '../../i18n/useTranslation';
import type { PostLinkAttachment } from '../../types/postLink';

interface OwnedCommunity {
  _id: string;
  name: string;
  handle: string;
  avatar?: string;
}

export type PostLinkMode = 'community' | 'url';

export interface PostLinkAttachmentFormProps {
  initialValue?: PostLinkAttachment | null;
  token: string | null;
  onSave: (link: PostLinkAttachment) => void;
  onCancel: () => void;
  /** Compact footer for mobile sheet */
  variant?: 'modal' | 'sheet';
}

export const PostLinkAttachmentForm: React.FC<PostLinkAttachmentFormProps> = ({
  initialValue,
  token,
  onSave,
  onCancel,
  variant = 'modal',
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<PostLinkMode>('community');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedHandle, setSelectedHandle] = useState('');
  const [communities, setCommunities] = useState<OwnedCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    if (initialValue?.url?.startsWith('/community/')) {
      const handle = initialValue.url.replace(/^\/community\//, '').split('/')[0];
      setMode('community');
      setSelectedHandle(handle);
      setCustomUrl('');
    } else if (initialValue?.url) {
      setMode('url');
      setCustomUrl(initialValue.url);
      setSelectedHandle('');
    } else {
      setMode('community');
      setCustomUrl('');
      setSelectedHandle('');
    }
    setTitle(initialValue?.title ?? '');
    setError(null);
  }, [initialValue]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoadingCommunities(true);
    fetch(`${COMMUNITIES_API}/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error((data as { message?: string }).message || 'Failed to load');
        if (!cancelled) setCommunities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCommunities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCommunities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (mode !== 'community' || selectedHandle || communities.length === 0) return;
    setSelectedHandle(communities[0].handle);
  }, [mode, communities, selectedHandle]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('postLink.titleRequired'));
      return;
    }

    if (mode === 'community') {
      if (!selectedHandle) {
        setError(t('postLink.communityRequired'));
        return;
      }
      onSave({ title: trimmedTitle, url: communityPath(selectedHandle) });
      return;
    }

    let url = customUrl.trim();
    if (!url) {
      setError(t('postLink.urlRequired'));
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setError(t('postLink.urlInvalid'));
        return;
      }
    } catch {
      setError(t('postLink.urlInvalid'));
      return;
    }
    onSave({ title: trimmedTitle, url });
  };

  const footerClass =
    variant === 'sheet'
      ? 'flex justify-end gap-2 border-t border-neutral-200 pt-4'
      : 'flex justify-end gap-2 border-t border-neutral-200 px-5 py-4';

  const bodyClass = variant === 'sheet' ? 'space-y-4' : 'space-y-4 px-5 py-4';

  return (
    <>
      <div className={bodyClass}>
        <div>
          <label htmlFor="post-link-title" className="mb-1.5 block text-sm font-medium text-neutral-700">
            {t('postLink.titleLabel')}
          </label>
          <input
            id="post-link-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={t('postLink.titlePlaceholder')}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">{t('postLink.linkType')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('community')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'community'
                  ? 'border-[#315efb] bg-[#eef2ff] text-[#315efb]'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {t('postLink.attachCommunity')}
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'url'
                  ? 'border-[#315efb] bg-[#eef2ff] text-[#315efb]'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {t('postLink.insertUrl')}
            </button>
          </div>
        </div>

        {mode === 'community' ? (
          <div>
            <p className="mb-2 text-sm text-neutral-500">{t('postLink.yourCommunities')}</p>
            {!token ? (
              <p className="text-sm text-neutral-500">{t('postLink.signInForCommunities')}</p>
            ) : loadingCommunities ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" aria-hidden />
              </div>
            ) : communities.length === 0 ? (
              <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-sm text-neutral-500">
                {t('postLink.noCommunities')}
              </p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-1">
                {communities.map((c) => {
                  const selected = selectedHandle === c.handle;
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedHandle(c.handle)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selected ? 'bg-[#eef2ff] text-[#315efb]' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <img
                          src={
                            c.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=111827&color=fff&size=40&bold=true`
                          }
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{c.name}</span>
                          <span className="block truncate text-xs text-neutral-500">@{c.handle}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="post-link-url" className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('postLink.urlLabel')}
            </label>
            <input
              id="post-link-url"
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
            />
          </div>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className={footerClass}>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          {t('postComposer.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          {t('postLink.save')}
        </button>
      </div>
    </>
  );
};

interface PostLinkAttachmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (link: PostLinkAttachment) => void;
  initialValue?: PostLinkAttachment | null;
  token: string | null;
}

const PostLinkAttachmentModal: React.FC<PostLinkAttachmentModalProps> = ({
  open,
  onClose,
  onSave,
  initialValue,
  token,
}) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-link-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 id="post-link-modal-title" className="text-lg font-semibold text-neutral-900">
            {t('postLink.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label={t('postComposer.cancel')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <PostLinkAttachmentForm
          initialValue={initialValue}
          token={token}
          onSave={(link) => {
            onSave(link);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default PostLinkAttachmentModal;

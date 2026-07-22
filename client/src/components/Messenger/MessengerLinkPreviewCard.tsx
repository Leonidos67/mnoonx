import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LINK_PREVIEW_API } from '../../config/api';
import ExternalLink from '../Common/ExternalLink';

interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
}

const previewCache = new Map<string, LinkPreviewData | null>();

interface MessengerLinkPreviewCardProps {
  url: string;
}

const MessengerLinkPreviewCard: React.FC<MessengerLinkPreviewCardProps> = ({ url }) => {
  const { token } = useAuth();
  const [preview, setPreview] = useState<LinkPreviewData | null>(previewCache.get(url) ?? null);
  const [loading, setLoading] = useState(!previewCache.has(url));

  useEffect(() => {
    if (!token || !url) return;
    if (previewCache.has(url)) {
      setPreview(previewCache.get(url) ?? null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${LINK_PREVIEW_API}?url=${encodeURIComponent(url)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('preview failed');
        const data = (await res.json()) as LinkPreviewData;
        previewCache.set(url, data);
        if (!cancelled) setPreview(data);
      } catch {
        previewCache.set(url, null);
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, token]);

  if (loading || !preview || (!preview.title && !preview.description && !preview.image)) {
    return null;
  }

  return (
    <ExternalLink
      href={preview.url || url}
      onClick={(e) => e.stopPropagation()}
      className="mt-2 flex max-w-[280px] overflow-hidden rounded-xl border border-black/10 bg-white/90 text-left text-neutral-900 no-underline transition-colors hover:bg-white"
    >
      {preview.image ? (
        <img src={preview.image} alt="" className="h-16 w-16 shrink-0 object-cover" />
      ) : null}
      <div className="min-w-0 flex-1 px-2.5 py-2">
        {preview.siteName ? (
          <p className="truncate text-[11px] uppercase tracking-wide text-neutral-400">
            {preview.siteName}
          </p>
        ) : null}
        {preview.title ? (
          <p className="line-clamp-1 text-xs font-semibold text-neutral-900">{preview.title}</p>
        ) : null}
        {preview.description ? (
          <p className="line-clamp-2 text-xs text-neutral-500">{preview.description}</p>
        ) : null}
      </div>
    </ExternalLink>
  );
};

export default MessengerLinkPreviewCard;

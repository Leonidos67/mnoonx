import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import type { PostLightboxMeta } from './postMediaTypes';

interface PostMediaLightboxProps {
  media: string[];
  index: number;
  meta: PostLightboxMeta;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

interface NaturalSize {
  width: number;
  height: number;
}

const formatLightboxDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Preserve aspect ratio; scale down only if larger than viewport. Never upscale. */
function fitNaturalSize(naturalW: number, naturalH: number): NaturalSize {
  const maxW = Math.min(window.innerWidth - 112, 1100);
  const maxH = window.innerHeight - 168;
  const scale = Math.min(1, maxW / naturalW, maxH / naturalH);
  return {
    width: Math.round(naturalW * scale),
    height: Math.round(naturalH * scale),
  };
}

const PostMediaLightbox: React.FC<PostMediaLightboxProps> = ({
  media,
  index,
  meta,
  onClose,
  onIndexChange,
}) => {
  const hasMultiple = media.length > 1;
  const [naturalByIndex, setNaturalByIndex] = useState<Record<number, NaturalSize>>({});
  const [viewportTick, setViewportTick] = useState(0);

  const displayAsCommunity = Boolean(meta.community);
  const displayName = displayAsCommunity ? meta.community!.name : meta.author.fullName;
  const displayAvatar = displayAsCommunity
    ? meta.community!.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.community!.name)}&background=315efb&color=fff&size=48&bold=true`
    : meta.author.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.author.fullName)}&background=000&color=fff&size=48&bold=true`;
  const profileLink = displayAsCommunity
    ? `/community/${meta.community!.handle}`
    : `/@${meta.author.username}`;

  const natural = naturalByIndex[index];

  const displaySize = useMemo(() => {
    if (!natural) return null;
    void viewportTick;
    return fitNaturalSize(natural.width, natural.height);
  }, [natural, viewportTick]);

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + media.length) % media.length);
  }, [index, media.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % media.length);
  }, [index, media.length, onIndexChange]);

  const isCurrentReady = Boolean(naturalByIndex[index]);

  useEffect(() => {
    let cancelled = false;
    media.forEach((url, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled || !img.naturalWidth) return;
        setNaturalByIndex((prev) => ({
          ...prev,
          [i]: { width: img.naturalWidth, height: img.naturalHeight },
        }));
      };
      img.src = resolveMediaUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [media]);

  useEffect(() => {
    const onResize = () => setViewportTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) goPrev();
      if (e.key === 'ArrowRight' && hasMultiple) goNext();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, goPrev, goNext, hasMultiple]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    setNaturalByIndex((prev) => ({
      ...prev,
      [index]: { width: img.naturalWidth, height: img.naturalHeight },
    }));
  };

  const navBtnClass =
    'absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-md transition-colors hover:bg-neutral-50 hover:text-neutral-900';

  const content = (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <header
        className="flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Link to={profileLink} onClick={onClose} className="shrink-0">
          <img src={displayAvatar} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-neutral-200" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={profileLink}
            onClick={onClose}
            className="block truncate font-semibold text-neutral-900 hover:underline"
          >
            {displayName}
          </Link>
          <p className="truncate text-xs text-neutral-500">
            {displayAsCommunity ? `@${meta.community!.handle}` : `@${meta.author.username}`}
            <span className="mx-1">·</span>
            {formatLightboxDate(meta.createdAt)}
            {hasMultiple && (
              <span className="ml-2 font-medium text-neutral-400">
                {index + 1} / {media.length}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Close"
        >
          <X size={22} />
        </button>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center bg-neutral-50 px-4 py-6 md:px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {hasMultiple && (
          <button type="button" onClick={goPrev} className={`${navBtnClass} left-3 md:left-6`} aria-label="Previous image">
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="flex max-h-full max-w-full flex-col items-center justify-center">
          {!isCurrentReady && (
            <div
              className="animate-pulse rounded-xl bg-neutral-200"
              style={
                displaySize
                  ? { width: displaySize.width, height: displaySize.height }
                  : { width: 280, height: 200 }
              }
              aria-hidden
            />
          )}
          <img
            key={media[index]}
            src={resolveMediaUrl(media[index])}
            alt=""
            width={displaySize?.width}
            height={displaySize?.height}
            onLoad={handleImageLoad}
            className={`rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/80 transition-opacity duration-200 ${
              isCurrentReady ? 'opacity-100' : 'absolute opacity-0 pointer-events-none'
            }`}
            style={
              displaySize
                ? { width: displaySize.width, height: displaySize.height }
                : { maxHeight: 'calc(100vh - 168px)', maxWidth: 'min(100vw - 7rem, 1100px)' }
            }
          />
        </div>

        {hasMultiple && (
          <button type="button" onClick={goNext} className={`${navBtnClass} right-3 md:right-6`} aria-label="Next image">
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default PostMediaLightbox;

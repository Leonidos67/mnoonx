import React from 'react';
import { Link } from 'react-router-dom';
import type { FeedPost } from '../../types/postFeed';
import { getPostDisplayMeta } from '../../utils/postDisplay';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { useTranslation } from '../../i18n/useTranslation';

export type QuotedPostValue = FeedPost | { missing: true } | null | undefined;

function isMissingQuote(value: QuotedPostValue): value is { missing: true } {
  return Boolean(value) && typeof value === 'object' && 'missing' in (value as object);
}

interface QuotedPostCardProps {
  quotedPost: QuotedPostValue;
  onClick?: (post: FeedPost) => void;
  className?: string;
}

/** Compact preview of a quoted (quote-reposted) post, shown inline on feed cards and in the quote composer. */
const QuotedPostCard: React.FC<QuotedPostCardProps> = ({ quotedPost, onClick, className = '' }) => {
  const { t } = useTranslation();

  if (!quotedPost) return null;

  if (isMissingQuote(quotedPost)) {
    return (
      <div
        className={`mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500 ${className}`}
      >
        {t('quotedPost.missing')}
      </div>
    );
  }

  const post = quotedPost;
  const { displayName, displayUsername, displayAvatar, profileLink } = getPostDisplayMeta(post);
  const mediaUrls = (post.media || []).map((u) => resolveMediaUrl(u)).filter(Boolean);
  const cover = mediaUrls[0];

  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return;
    e.stopPropagation();
    onClick(post);
  };

  return (
    <div
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`mt-2 min-w-0 overflow-hidden rounded-xl border border-neutral-200 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-neutral-50' : ''
      } ${className}`}
    >
      <div className="flex min-w-0 items-start gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
            <Link
              to={profileLink}
              onClick={(e) => e.stopPropagation()}
              className="flex shrink-0 items-center"
            >
              <img src={displayAvatar} alt="" className="h-4 w-4 rounded-full object-cover" />
            </Link>
            <Link
              to={profileLink}
              onClick={(e) => e.stopPropagation()}
              className="truncate font-semibold text-neutral-900 hover:underline"
            >
              {displayName}
            </Link>
            <span className="truncate text-neutral-500">{displayUsername}</span>
          </div>
          {post.content ? (
            <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-neutral-800">
              {post.content}
            </p>
          ) : null}
        </div>
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : null}
      </div>
    </div>
  );
};

export default QuotedPostCard;

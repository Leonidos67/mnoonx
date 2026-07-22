import React, { useRef, useState } from 'react';
import { Bookmark, Quote, Repeat2 } from 'lucide-react';
import {
  GitCompareArrowsIcon,
  HeartIcon,
  MessageCircleIcon,
  type IconHandle,
} from '@animateicons/react/lucide';
import FloatingMenu, { type FloatingMenuAnchor } from '../Common/FloatingMenu';
import { useTranslation } from '../../i18n/useTranslation';

type PostActionButtonsProps = {
  postId: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  liked: boolean;
  reposted: boolean;
  commentsExpanded: boolean;
  formatCount: (n: number) => string;
  onLike: (postId: string) => void;
  onToggleComments: (postId: string, e: React.MouseEvent) => void;
  onRepost: (postId: string) => void;
  bookmarked?: boolean;
  bookmarksCount?: number;
  onBookmark?: (postId: string) => void;
  /** When provided, the repost button opens a menu offering Repost / Quote */
  onQuote?: (postId: string) => void;
};

const iconBoxClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors';

const iconClass = '!h-4 !w-4 !min-h-0 !min-w-0';

const PostFeedActionButtons: React.FC<PostActionButtonsProps> = ({
  postId,
  likesCount,
  commentsCount,
  repostsCount,
  liked,
  reposted,
  commentsExpanded,
  formatCount,
  onLike,
  onToggleComments,
  onRepost,
  bookmarked = false,
  bookmarksCount,
  onBookmark,
  onQuote,
}) => {
  const { t } = useTranslation();
  const likeRef = useRef<IconHandle>(null);
  const commentRef = useRef<IconHandle>(null);
  const repostRef = useRef<IconHandle>(null);
  const repostBtnRef = useRef<HTMLButtonElement>(null);
  const [repostMenuOpen, setRepostMenuOpen] = useState(false);
  const [repostMenuAnchor, setRepostMenuAnchor] = useState<FloatingMenuAnchor | null>(null);

  const closeRepostMenu = () => {
    setRepostMenuOpen(false);
    setRepostMenuAnchor(null);
  };

  const handleRepostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuote) {
      onRepost(postId);
      return;
    }
    if (repostBtnRef.current) {
      setRepostMenuAnchor({ rect: repostBtnRef.current.getBoundingClientRect() });
    }
    setRepostMenuOpen(true);
  };

  return (
    <div className="mt-1 flex max-w-md items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onLike(postId);
        }}
        onMouseEnter={() => likeRef.current?.startAnimation()}
        onMouseLeave={() => likeRef.current?.stopAnimation()}
        className={`group flex items-center transition-colors ${
          liked ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'
        }`}
      >
        <div className={`${iconBoxClass} group-hover:bg-red-50`}>
          <HeartIcon
            ref={likeRef}
            size={16}
            duration={1}
            color="currentColor"
            isAnimated={false}
            className={iconClass}
          />
        </div>
        <span className="text-xs">{formatCount(likesCount || 0)}</span>
      </button>

      <button
        type="button"
        onClick={(e) => onToggleComments(postId, e)}
        onMouseEnter={() => commentRef.current?.startAnimation()}
        onMouseLeave={() => commentRef.current?.stopAnimation()}
        className={`group flex items-center transition-colors ${
          commentsExpanded ? 'text-black' : 'text-neutral-500 hover:text-black'
        }`}
      >
        <div className={`${iconBoxClass} group-hover:bg-black/5`}>
          <MessageCircleIcon
            ref={commentRef}
            size={16}
            duration={1}
            color="currentColor"
            isAnimated={false}
            className={iconClass}
          />
        </div>
        <span className="text-xs">{formatCount(commentsCount || 0)}</span>
      </button>

      <div className="relative">
        <button
          ref={repostBtnRef}
          type="button"
          onClick={handleRepostClick}
          onMouseEnter={() => repostRef.current?.startAnimation()}
          onMouseLeave={() => repostRef.current?.stopAnimation()}
          aria-haspopup={onQuote ? 'menu' : undefined}
          aria-expanded={onQuote ? repostMenuOpen : undefined}
          className={`group flex items-center transition-colors ${
            reposted ? 'text-black' : 'text-neutral-500 hover:text-black'
          }`}
        >
          <div className={`${iconBoxClass} group-hover:bg-black/5`}>
            <GitCompareArrowsIcon
              ref={repostRef}
              size={16}
              duration={1}
              color="currentColor"
              isAnimated={false}
              className={iconClass}
            />
          </div>
          <span className="text-xs">{formatCount(repostsCount || 0)}</span>
        </button>
        {onQuote ? (
          <FloatingMenu open={repostMenuOpen} anchor={repostMenuAnchor} onClose={closeRepostMenu} width={176}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeRepostMenu();
                onRepost(postId);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
            >
              <Repeat2 size={14} className="text-neutral-700" aria-hidden />
              {reposted ? t('common.undoRepost') : t('common.repost')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeRepostMenu();
                onQuote(postId);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
            >
              <Quote size={14} className="text-neutral-700" aria-hidden />
              {t('common.quote')}
            </button>
          </FloatingMenu>
        ) : null}
      </div>

      {onBookmark ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBookmark(postId);
          }}
          className={`group ml-auto flex items-center transition-colors ${
            bookmarked ? 'text-amber-500' : 'text-neutral-500 hover:text-amber-500'
          }`}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? t('common.bookmarkRemove') : t('common.bookmarkAdd')}
        >
          <div className={`${iconBoxClass} group-hover:bg-amber-50`}>
            <Bookmark size={16} className={iconClass} fill={bookmarked ? 'currentColor' : 'none'} />
          </div>
          {typeof bookmarksCount === 'number' && (
            <span className="text-xs">{formatCount(bookmarksCount || 0)}</span>
          )}
        </button>
      ) : null}
    </div>
  );
};

export default PostFeedActionButtons;

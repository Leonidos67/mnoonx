import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Lock } from 'lucide-react';
import PostContentBody from './PostContentBody';
import PostMediaGallery from './PostMediaGallery';
import { PostCommentsSection } from './PostCommentsSection';
import { AnimatedPostMenuIcon } from './PostMenuAnimatedIcons';
import PostFeedActionButtons from './PostFeedActionButtons';
import QuotedPostCard from './QuotedPostCard';
import FloatingMenu, { type FloatingMenuAnchor } from '../Common/FloatingMenu';
import { buildPostLightboxMeta } from '../../utils/buildPostLightboxMeta';
import type { FeedPost } from '../../types/postFeed';
import { useTranslation } from '../../i18n/useTranslation';
import { getPostDisplayMeta, type PostCommunityMeta } from '../../utils/postDisplay';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { followUserByUsername } from '../../utils/followUser';

export type PostFeedCardCommunityContext = PostCommunityMeta;

export interface PostFeedCardProps {
  post: FeedPost;
  communityContext?: PostFeedCardCommunityContext | null;
  isSelected?: boolean;
  onSelect?: (post: FeedPost) => void;
  formatPostDate: (date: string) => string;
  formatCount: (count: number) => string;
  likedPosts: Set<string>;
  repostedPosts: Set<string>;
  bookmarkedPosts?: Set<string>;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onQuote?: (postId: string) => void;
  onToggleComments: (postId: string, e: React.MouseEvent) => void;
  expandedCommentsPostId: string | null;
  menuOpenPostId: string | null;
  onMenuToggle: (postId: string, e?: React.MouseEvent) => void;
  menuRef?: React.RefObject<HTMLDivElement>;
  onCopyLink: (postId: string) => void;
  onEdit?: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  canManagePost?: boolean;
  inlineCommentText: string;
  onInlineCommentTextChange: (value: string) => void;
  onSubmitInlineComment: () => void;
  onSubmitInlineReply?: (parentId: string, content: string) => void;
  token: string | null;
  commentSubmitting: boolean;
  commentsLoading: boolean;
  isCommentOwner: (comment: import('../../types/postFeed').PostComment) => boolean;
  openCommentMenu: { commentId: string } | null;
  onCommentMenuToggle: (
    comment: import('../../types/postFeed').PostComment,
    postId: string,
    rect: DOMRect,
    isOpen: boolean,
  ) => void;
  onPollChange?: (poll: import('../../types/postPoll').FeedPostPoll) => void;
}

const PostFeedCard: React.FC<PostFeedCardProps> = ({
  post,
  communityContext,
  isSelected,
  onSelect,
  formatPostDate,
  formatCount,
  likedPosts,
  repostedPosts,
  bookmarkedPosts,
  onLike,
  onRepost,
  onBookmark,
  onQuote,
  onToggleComments,
  expandedCommentsPostId,
  menuOpenPostId,
  onMenuToggle,
  menuRef,
  onCopyLink,
  onEdit,
  onDelete,
  canManagePost,
  inlineCommentText,
  onInlineCommentTextChange,
  onSubmitInlineComment,
  onSubmitInlineReply,
  token,
  commentSubmitting,
  commentsLoading,
  isCommentOwner,
  openCommentMenu,
  onCommentMenuToggle,
  onPollChange,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [followBusy, setFollowBusy] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<FloatingMenuAnchor | null>(null);
  const postId = String(post._id);
  const menuOpen = menuOpenPostId === postId;

  useEffect(() => {
    if (!menuOpen) setMenuAnchor(null);
  }, [menuOpen]);

  const closeMenu = useCallback(() => {
    if (menuOpen) onMenuToggle(postId);
  }, [menuOpen, onMenuToggle, postId]);

  const { communityMeta, displayAsCommunity, displayName, displayUsername, displayAvatar, profileLink } =
    getPostDisplayMeta(post, communityContext);

  const authorUsername = String(post.author?.username || '').replace(/^@/, '').trim();
  const isOwnPost =
    Boolean(user) &&
    (String(user?.id || '') === String(post.author?._id || '') ||
      String(user?.username || '').toLowerCase() === authorUsername.toLowerCase());
  const canFollowAuthor = Boolean(authorUsername) && !isOwnPost;

  const handleFollowAuthor = async () => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    if (!authorUsername || followBusy) return;
    setFollowBusy(true);
    try {
      const result = await followUserByUsername(authorUsername, token);
      if (!result.ok) {
        showToast(t('common.followFailed'), 'error');
        return;
      }
      showToast(t('home.followUserSuccess', { username: authorUsername }));
      onMenuToggle(postId);
    } finally {
      setFollowBusy(false);
    }
  };

  const lightboxMeta = buildPostLightboxMeta(
    { ...post, community: communityMeta },
    communityMeta && !post.isPrivate
      ? {
          name: communityMeta.name,
          handle: communityMeta.handle,
          avatar: communityMeta.avatar,
        }
      : null,
  );

  return (
    <article
      onClick={() => onSelect?.(post)}
      className={`post-feed-card group/article cursor-pointer border-b border-neutral-200 p-4 transition-colors ${
        isSelected ? 'bg-neutral-50' : ''
      }`}
    >
      <div className="flex space-x-3">
        <Link to={profileLink} onClick={(e) => e.stopPropagation()}>
          <img
            src={displayAvatar}
            alt={displayName}
            className="h-6 w-6 rounded-full object-cover transition-opacity hover:opacity-90"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <Link
              to={profileLink}
              className="truncate font-bold text-neutral-900 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {displayName}
            </Link>
            <span className="truncate text-neutral-500">{displayUsername}</span>
            <span className="text-neutral-500">·</span>
            <span className="whitespace-nowrap text-neutral-500">{formatPostDate(post.createdAt)}</span>

            {post.isPrivate && (
              <span className="ml-2 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                <Lock size={10} />
                {t('home.private')}
              </span>
            )}

            {!displayAsCommunity && communityMeta && (
              <span className="ml-2 flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                <Globe size={10} />
                {t('common.via')} {communityMeta.name}
              </span>
            )}

            <div className="relative ml-auto" ref={menuOpen ? menuRef : null}>
              <button
                type="button"
                data-floating-menu-trigger
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  if (menuOpen) {
                    closeMenu();
                    return;
                  }
                  setMenuAnchor({ rect });
                  onMenuToggle(postId, e);
                }}
                className={`post-feed-card-menu flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
                  menuOpen
                    ? 'bg-black/10 text-black opacity-100'
                    : 'text-neutral-500 opacity-60 hover:bg-black/5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/article:opacity-100'
                }`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <AnimatedPostMenuIcon kind="ellipsis" size={16} />
              </button>

              <FloatingMenu
                open={menuOpen}
                anchor={menuAnchor}
                onClose={closeMenu}
                width={224}
              >
                {canFollowAuthor && (
                  <button
                    type="button"
                    disabled={followBusy}
                    onClick={() => void handleFollowAuthor()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50 disabled:opacity-50"
                    role="menuitem"
                  >
                    <AnimatedPostMenuIcon kind="follow" size={14} />
                    {t('home.followUser', { username: authorUsername })}
                  </button>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyLink(postId);
                    closeMenu();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
                  role="menuitem"
                >
                  <AnimatedPostMenuIcon kind="link" size={14} />
                  {t('home.copyLink')}
                </button>
                {canManagePost && onEdit && onDelete && (
                  <>
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(postId, post.content);
                        closeMenu();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
                      role="menuitem"
                    >
                      <AnimatedPostMenuIcon kind="edit" size={14} />
                      {t('common.edit')}
                    </button>
                    <div className="my-1 h-px bg-neutral-100" />
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        void onDelete(postId);
                        closeMenu();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      role="menuitem"
                    >
                      <AnimatedPostMenuIcon kind="trash" size={14} color="#dc2626" />
                      {t('common.delete')}
                    </button>
                  </>
                )}
              </FloatingMenu>
            </div>
          </div>

          <div className="mt-1">
            <PostContentBody
              content={post.content}
              linkAttachment={post.linkAttachment}
              coinAttachment={post.coinAttachment}
              poll={post.poll}
              postId={postId}
              onPollChange={onPollChange}
              contentClassName="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-neutral-900"
            />
          </div>

          {post.media && post.media.length > 0 && (
            <PostMediaGallery media={post.media} meta={lightboxMeta} />
          )}

          {post.quotedPost ? <QuotedPostCard quotedPost={post.quotedPost} /> : null}

          <PostFeedActionButtons
            postId={postId}
            likesCount={post.likesCount || 0}
            commentsCount={post.commentsCount || 0}
            repostsCount={post.repostsCount || 0}
            liked={likedPosts.has(postId)}
            reposted={repostedPosts.has(postId)}
            bookmarked={bookmarkedPosts?.has(postId) ?? post.isBookmarked ?? false}
            commentsExpanded={expandedCommentsPostId === postId}
            formatCount={formatCount}
            onLike={onLike}
            onToggleComments={onToggleComments}
            onRepost={onRepost}
            onBookmark={onBookmark}
            onQuote={onQuote}
          />

          {expandedCommentsPostId === postId && (
            <PostCommentsSection
              post={post}
              variant="feed"
              text={inlineCommentText}
              onTextChange={onInlineCommentTextChange}
              onSubmit={onSubmitInlineComment}
              onSubmitReply={onSubmitInlineReply}
              token={token}
              commentSubmitting={commentSubmitting}
              commentsLoading={commentsLoading}
              isCommentOwner={isCommentOwner}
              openCommentMenu={openCommentMenu}
              onCommentMenuToggle={onCommentMenuToggle}
            />
          )}
        </div>
      </div>
    </article>
  );
};

export default PostFeedCard;

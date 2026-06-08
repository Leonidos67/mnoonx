import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Heart, Lock, MessageCircle, MoreHorizontal, Pen, Repeat2, Trash, Unlink2 } from 'lucide-react';
import PostContentBody from './PostContentBody';
import PostMediaGallery from './PostMediaGallery';
import { PostCommentsSection } from './PostCommentsSection';
import { buildPostLightboxMeta } from '../../utils/buildPostLightboxMeta';
import type { FeedPost } from '../../types/postFeed';
import { useTranslation } from '../../i18n/useTranslation';
import { getPostDisplayMeta, type PostCommunityMeta } from '../../utils/postDisplay';

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
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onToggleComments: (postId: string, e: React.MouseEvent) => void;
  expandedCommentsPostId: string | null;
  menuOpenPostId: string | null;
  onMenuToggle: (postId: string, e: React.MouseEvent) => void;
  menuRef?: React.RefObject<HTMLDivElement>;
  onCopyLink: (postId: string) => void;
  onEdit?: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  canManagePost?: boolean;
  inlineCommentText: string;
  onInlineCommentTextChange: (value: string) => void;
  onSubmitInlineComment: () => void;
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
  onLike,
  onRepost,
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
  token,
  commentSubmitting,
  commentsLoading,
  isCommentOwner,
  openCommentMenu,
  onCommentMenuToggle,
}) => {
  const { t } = useTranslation();
  const postId = String(post._id);

  const { communityMeta, displayAsCommunity, displayName, displayUsername, displayAvatar, profileLink } =
    getPostDisplayMeta(post, communityContext);

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
      className={`group/article cursor-pointer border-b border-neutral-200 p-4 transition-colors hover:bg-neutral-50 ${
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

            <div className="relative ml-auto" ref={menuOpenPostId === postId ? menuRef : null}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle(postId, e);
                }}
                className={`rounded-full p-1 transition-all ${
                  menuOpenPostId === postId
                    ? 'bg-black/10 text-black opacity-100'
                    : 'text-neutral-500 opacity-0 hover:bg-black/5 group-hover/article:opacity-100'
                }`}
                aria-expanded={menuOpenPostId === postId}
                aria-haspopup="menu"
              >
                <MoreHorizontal size={16} />
              </button>

              {menuOpenPostId === postId && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => onCopyLink(postId)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
                    role="menuitem"
                  >
                    <Unlink2 size={14} />
                    {t('home.copyLink')}
                  </button>
                  {canManagePost && onEdit && onDelete && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(postId, post.content)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
                        role="menuitem"
                      >
                        <Pen size={14} />
                        {t('common.edit')}
                      </button>
                      <div className="my-1 h-px bg-neutral-100" />
                      <button
                        type="button"
                        onClick={() => onDelete(postId)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                        role="menuitem"
                      >
                        <Trash size={14} />
                        {t('common.delete')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-1">
            <PostContentBody
              content={post.content}
              linkAttachment={post.linkAttachment}
              coinAttachment={post.coinAttachment}
              contentClassName="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-neutral-900"
            />
          </div>

          {post.media && post.media.length > 0 && (
            <PostMediaGallery media={post.media} meta={lightboxMeta} />
          )}

          <div className="mt-1 flex max-w-md items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike(postId);
              }}
              className={`group flex items-center transition-colors ${
                likedPosts.has(postId) ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'
              }`}
            >
              <div className="rounded-full p-2 transition-colors group-hover:bg-red-50">
                <Heart size={16} fill={likedPosts.has(postId) ? 'currentColor' : 'none'} />
              </div>
              <span className="text-xs">{formatCount(post.likesCount || 0)}</span>
            </button>

            <button
              type="button"
              onClick={(e) => onToggleComments(postId, e)}
              className={`group flex items-center transition-colors ${
                expandedCommentsPostId === postId ? 'text-black' : 'text-neutral-500 hover:text-black'
              }`}
            >
              <div className="rounded-full p-2 transition-colors group-hover:bg-black/5">
                <MessageCircle size={16} />
              </div>
              <span className="text-xs">{formatCount(post.commentsCount || 0)}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRepost(postId);
              }}
              className={`group flex items-center transition-colors ${
                repostedPosts.has(postId) ? 'text-black' : 'text-neutral-500 hover:text-black'
              }`}
            >
              <div className="rounded-full p-2 transition-colors group-hover:bg-black/5">
                <Repeat2 size={16} fill={repostedPosts.has(postId) ? 'currentColor' : 'none'} />
              </div>
              <span className="text-xs">{formatCount(post.repostsCount || 0)}</span>
            </button>
          </div>

          {expandedCommentsPostId === postId && (
            <PostCommentsSection
              post={post}
              variant="feed"
              text={inlineCommentText}
              onTextChange={onInlineCommentTextChange}
              onSubmit={onSubmitInlineComment}
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

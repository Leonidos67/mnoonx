import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Unlink2 } from 'lucide-react';
import PostMediaGallery from './PostMediaGallery';
import { buildPostLightboxMeta } from '../../utils/buildPostLightboxMeta';
import { PostCommentsSection } from './PostCommentsSection';
import { formatCount } from './postFeedUtils';
import type { FeedPost, PostComment } from '../../types/postFeed';

interface PostDetailPanelProps {
  post: FeedPost;
  onClose: () => void;
  onCopyLink: (postId: string) => void;
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onSubmitComment: () => void;
  token: string | null;
  commentSubmitting: boolean;
  commentsLoading: boolean;
  isCommentOwner: (comment: PostComment) => boolean;
  openCommentMenu: { commentId: string } | null;
  onCommentMenuToggle: (
    comment: PostComment,
    postId: string,
    rect: DOMRect,
    isOpen: boolean,
  ) => void;
}

const PostDetailPanel: React.FC<PostDetailPanelProps> = ({
  post,
  onClose,
  onCopyLink,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  token,
  commentSubmitting,
  commentsLoading,
  isCommentOwner,
  openCommentMenu,
  onCommentMenuToggle,
}) => {
  const isCommunityPost = post.community && !post.isPrivate;
  const displayName = isCommunityPost ? post.community!.name : post.author.fullName;
  const displayAvatar = isCommunityPost
    ? post.community!.avatar ||
      `https://ui-avatars.com/api/?name=${post.community!.name}&background=315efb&color=fff&size=48&bold=true`
    : post.author.avatar ||
      `https://ui-avatars.com/api/?name=${post.author.fullName}&background=000&color=fff&size=48&bold=true`;
  const profileLink = isCommunityPost
    ? `/community/${post.community!.handle}`
    : `/@${post.author.username}`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-neutral-200 lg:shadow-sm">
      <div className="hidden lg:flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white/80 p-4 backdrop-blur-md">
        <button
          type="button"
          onClick={onClose}
          className="group flex items-center gap-1 font-medium text-neutral-500 transition-colors hover:text-black"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={() => onCopyLink(String(post._id))}
          className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
          aria-label="Copy post link"
          title="Copy link"
        >
          <Unlink2 size={18} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-2">
          <div className="mb-4 flex items-center gap-3">
            <Link to={profileLink} onClick={onClose}>
              <img src={displayAvatar} alt={displayName} className="h-12 w-12 rounded-full object-cover" />
            </Link>
            <div>
              <Link to={profileLink} onClick={onClose} className="font-bold hover:underline">
                {displayName}
              </Link>
              <p className="text-xs text-neutral-500">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          {post.content?.trim() ? (
            <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-neutral-900">
              {post.content}
            </p>
          ) : null}
          {post.media && post.media.length > 0 && (
            <div className="mt-3">
              <PostMediaGallery media={post.media} meta={buildPostLightboxMeta(post)} className="!mt-0" />
            </div>
          )}
          <div className="mt-4 flex items-center gap-4 border-t border-neutral-100 py-4 text-sm">
            <span>
              <span className="font-bold text-neutral-900">{formatCount(post.repostsCount)}</span>
              <span className="ml-1 text-neutral-500">Reposts</span>
            </span>
            <span>
              <span className="font-bold text-neutral-900">{formatCount(post.likesCount)}</span>
              <span className="ml-1 text-neutral-500">Likes</span>
            </span>
            <span>
              <span className="font-bold text-neutral-900">{formatCount(post.commentsCount || 0)}</span>
              <span className="ml-1 text-neutral-500">Comments</span>
            </span>
          </div>
          <div className="mt-2 border-t border-neutral-100 pt-4">
            <PostCommentsSection
              post={post}
              variant="sidebar"
              part="list"
              text={commentText}
              onTextChange={onCommentTextChange}
              onSubmit={onSubmitComment}
              token={token}
              commentSubmitting={commentSubmitting}
              commentsLoading={commentsLoading}
              isCommentOwner={isCommentOwner}
              openCommentMenu={openCommentMenu}
              onCommentMenuToggle={onCommentMenuToggle}
            />
          </div>
        </div>
        <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3">
          <PostCommentsSection
            post={post}
            variant="sidebar"
            part="composer"
            text={commentText}
            onTextChange={onCommentTextChange}
            onSubmit={onSubmitComment}
            token={token}
            commentSubmitting={commentSubmitting}
            commentsLoading={commentsLoading}
            isCommentOwner={isCommentOwner}
            openCommentMenu={openCommentMenu}
            onCommentMenuToggle={onCommentMenuToggle}
          />
        </div>
      </div>
    </div>
  );
};

export default PostDetailPanel;

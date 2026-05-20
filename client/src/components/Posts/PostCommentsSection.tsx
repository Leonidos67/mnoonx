import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Send } from 'lucide-react';
import type { FeedPost, PostComment } from '../../types/postFeed';
import { formatPostDate } from './postFeedUtils';

export const PostCommentComposer: React.FC<{
  variant: 'feed' | 'sidebar';
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  token: string | null;
  commentSubmitting: boolean;
}> = ({ variant, text, onTextChange, onSubmit, token, commentSubmitting }) => (
  <div
    className={variant === 'feed' ? 'flex gap-2 border-t border-neutral-100 pt-3' : 'flex gap-2'}
    onClick={(e) => e.stopPropagation()}
  >
    <input
      type="text"
      value={text}
      onChange={(e) => onTextChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSubmit();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      placeholder={token ? 'Write a comment…' : 'Sign in to comment'}
      disabled={!token || commentSubmitting}
      className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 disabled:opacity-60"
    />
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSubmit();
      }}
      disabled={!token || !text.trim() || commentSubmitting}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {commentSubmitting ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <Send size={16} />
      )}
    </button>
  </div>
);

export const PostCommentsSection: React.FC<{
  post: FeedPost;
  variant: 'feed' | 'sidebar';
  part?: 'all' | 'list' | 'composer';
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
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
}> = ({
  post,
  variant,
  part = 'all',
  text,
  onTextChange,
  onSubmit,
  token,
  commentSubmitting,
  commentsLoading,
  isCommentOwner,
  openCommentMenu,
  onCommentMenuToggle,
}) => {
  const postId = String(post._id);

  if (part === 'composer') {
    return (
      <PostCommentComposer
        variant={variant}
        text={text}
        onTextChange={onTextChange}
        onSubmit={onSubmit}
        token={token}
        commentSubmitting={commentSubmitting}
      />
    );
  }

  const listMaxHeight = variant === 'feed' ? 'max-h-[240px]' : '';

  return (
    <div
      className={variant === 'feed' ? 'mt-3 pt-3 border-t border-neutral-200' : ''}
      onClick={(e) => e.stopPropagation()}
    >
      {variant === 'sidebar' && (
        <p className="text-sm font-semibold text-neutral-900 mb-3">Comments</p>
      )}
      <div className={`overflow-y-auto ${listMaxHeight} pr-1 -mr-1`}>
        {commentsLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-black" />
          </div>
        ) : (
          <>
            {(!post.comments || post.comments.length === 0) && (
              <p className="py-4 text-center cursor-default text-sm text-neutral-500">
                No comments yet. Be the first to comment!
              </p>
            )}
            <ul className={`space-y-3 ${variant === 'feed' ? 'mb-2' : 'mb-4'}`}>
              {(post.comments || []).map((c) => (
                <li key={c._id} className="flex gap-2 text-sm group/comment">
                  <Link
                    to={`/@${c.user.username}`}
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={
                        c.user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.fullName || c.user.username)}&background=000&color=fff&size=${variant === 'feed' ? 32 : 24}&bold=true`
                      }
                      alt={c.user.fullName}
                      className={`${variant === 'feed' ? 'w-8 h-8' : 'w-6 h-6'} rounded-full object-cover`}
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900">
                          <Link
                            to={`/@${c.user.username}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {c.user.fullName}
                          </Link>
                          {variant === 'sidebar' ? (
                            <>
                              <span className="text-neutral-500 px-1">·</span>
                              <span className="text-neutral-500 font-normal">
                                {formatPostDate(c.createdAt)}
                              </span>
                            </>
                          ) : (
                            <span className="text-neutral-500 font-normal ml-1">
                              @{c.user.username}
                            </span>
                          )}
                        </p>
                        {variant === 'feed' && (
                          <p className="mt-0.5 text-xs text-neutral-400">
                            {formatPostDate(c.createdAt)}
                          </p>
                        )}
                        <p className="text-neutral-800 whitespace-pre-wrap break-words">
                          {c.content}
                        </p>
                      </div>
                      {isCommentOwner(c) && (
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const btn = e.currentTarget;
                              onCommentMenuToggle(
                                c,
                                postId,
                                btn.getBoundingClientRect(),
                                openCommentMenu?.commentId === c._id,
                              );
                            }}
                            className={`p-1 rounded-full transition-all ${
                              openCommentMenu?.commentId === c._id
                                ? 'bg-black/10 text-black opacity-100'
                                : 'text-neutral-500 opacity-0 group-hover/comment:opacity-100 hover:bg-black/5'
                            }`}
                            aria-expanded={openCommentMenu?.commentId === c._id}
                            aria-haspopup="menu"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {part === 'all' && (
        <PostCommentComposer
          variant={variant}
          text={text}
          onTextChange={onTextChange}
          onSubmit={onSubmit}
          token={token}
          commentSubmitting={commentSubmitting}
        />
      )}
    </div>
  );
};

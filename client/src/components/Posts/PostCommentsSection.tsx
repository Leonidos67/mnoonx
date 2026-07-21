import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedPostMenuIcon } from './PostMenuAnimatedIcons';
import AnimatedSendIcon, { type AnimatedSendIconHandle } from '../Common/AnimatedSendIcon';
import AnimatedReplyIcon from '../Common/AnimatedReplyIcon';
import type { FeedPost, PostComment } from '../../types/postFeed';
import { useTranslation } from '../../i18n/useTranslation';
import { formatPostDate } from './postFeedUtils';

export const PostCommentComposer: React.FC<{
  variant: 'feed' | 'sidebar';
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  token: string | null;
  commentSubmitting: boolean;
  placeholder?: string;
  compact?: boolean;
}> = ({
  variant,
  text,
  onTextChange,
  onSubmit,
  token,
  commentSubmitting,
  placeholder,
  compact,
}) => {
  const { t } = useTranslation();
  const sendRef = useRef<AnimatedSendIconHandle>(null);

  const submit = () => {
    if (!token || !text.trim() || commentSubmitting) return;
    sendRef.current?.startAnimation();
    onSubmit();
  };

  return (
    <div
      className={
        compact
          ? 'flex gap-2'
          : variant === 'feed'
            ? 'flex gap-2 border-t border-neutral-100 pt-3'
            : 'flex gap-2'
      }
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder={
          placeholder || (token ? t('home.writeComment') : t('home.signInToComment'))
        }
        disabled={!token || commentSubmitting}
        className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          submit();
        }}
        disabled={!token || !text.trim() || commentSubmitting}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <AnimatedSendIcon ref={sendRef} size={16} color="#ffffff" />
      </button>
    </div>
  );
};

function commentParentKey(c: PostComment): string | null {
  return c.parentId ? String(c.parentId) : null;
}

export const PostCommentsSection: React.FC<{
  post: FeedPost;
  variant: 'feed' | 'sidebar';
  part?: 'all' | 'list' | 'composer';
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  /** Reply to a comment; content is managed inside the section */
  onSubmitReply?: (parentId: string, content: string) => void;
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
  onSubmitReply,
  token,
  commentSubmitting,
  commentsLoading,
  isCommentOwner,
  openCommentMenu,
  onCommentMenuToggle,
}) => {
  const { t } = useTranslation();
  const postId = String(post._id);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { roots, repliesByParent } = useMemo(() => {
    const all = post.comments || [];
    const map = new Map<string, PostComment[]>();
    const top: PostComment[] = [];
    for (const c of all) {
      const parent = commentParentKey(c);
      if (!parent) {
        top.push(c);
        continue;
      }
      const list = map.get(parent) || [];
      list.push(c);
      map.set(parent, list);
    }
    return { roots: top, repliesByParent: map };
  }, [post.comments]);

  const openThread = (commentId: string) => {
    const rootId = (() => {
      const c = (post.comments || []).find((x) => String(x._id) === commentId);
      if (!c) return commentId;
      return commentParentKey(c) || String(c._id);
    })();
    setOpenThreadId((prev) => {
      if (prev === rootId) return prev;
      setReplyText('');
      return rootId;
    });
  };

  const submitReply = (parentId: string) => {
    if (!token || !replyText.trim() || commentSubmitting || !onSubmitReply) return;
    onSubmitReply(parentId, replyText.trim());
    setReplyText('');
  };

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
  const avatarSize = variant === 'feed' ? 32 : 24;
  const avatarClass = variant === 'feed' ? 'w-8 h-8' : 'w-6 h-6';

  const renderCommentRow = (c: PostComment, opts: { nested?: boolean; isRoot?: boolean }) => {
    const replies = repliesByParent.get(String(c._id)) || [];
    const threadOpen = openThreadId === String(c._id);
    const canReply = Boolean(onSubmitReply);
    const Wrapper: 'li' | 'div' = opts.nested ? 'div' : 'li';

    return (
      <Wrapper key={c._id} className="text-sm group/comment">
        <div
          className={`flex gap-2 rounded-lg transition-colors ${
            canReply && opts.isRoot
              ? 'cursor-pointer hover:bg-neutral-50/80 -mx-1 px-1 py-0.5'
              : ''
          }`}
          onClick={(e) => {
            if (!canReply || !opts.isRoot) return;
            e.stopPropagation();
            openThread(String(c._id));
          }}
        >
          <Link
            to={`/@${c.user.username}`}
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                c.user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.fullName || c.user.username)}&background=000&color=fff&size=${opts.nested ? 24 : avatarSize}&bold=true`
              }
              alt={c.user.fullName}
              className={`${opts.nested ? 'w-6 h-6' : avatarClass} rounded-full object-cover`}
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
                  {variant === 'sidebar' || opts.nested ? (
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
                {variant === 'feed' && !opts.nested && (
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {formatPostDate(c.createdAt)}
                  </p>
                )}
                <p className="text-neutral-800 whitespace-pre-wrap break-words">{c.content}</p>
                {opts.isRoot && replies.length > 0 && !threadOpen && (
                  <button
                    type="button"
                    className="mt-1 text-xs font-medium text-neutral-500 hover:text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      openThread(String(c._id));
                    }}
                  >
                    {replies.length === 1
                      ? t('home.replyCountOne')
                      : t('home.replyCountMany', { count: replies.length })}
                  </button>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {canReply && opts.isRoot && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openThread(String(c._id));
                    }}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                      threadOpen
                        ? 'bg-black/10 text-black opacity-100'
                        : 'text-neutral-500 opacity-0 group-hover/comment:opacity-100 hover:bg-black/5'
                    }`}
                    aria-label={t('home.replyAria')}
                    title={t('home.reply')}
                  >
                    <AnimatedReplyIcon size={14} />
                  </button>
                )}
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
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                        openCommentMenu?.commentId === c._id
                          ? 'bg-black/10 text-black opacity-100'
                          : 'text-neutral-500 opacity-0 group-hover/comment:opacity-100 hover:bg-black/5'
                      }`}
                      aria-expanded={openCommentMenu?.commentId === c._id}
                      aria-haspopup="menu"
                    >
                      <AnimatedPostMenuIcon kind="ellipsis" size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {opts.isRoot && threadOpen && (
          <div className="mt-2 ml-8 space-y-2 border-l border-neutral-200 pl-3">
            {replies.map((reply) => renderCommentRow(reply, { nested: true }))}
            {canReply && (
              <div onClick={(e) => e.stopPropagation()}>
                <PostCommentComposer
                  variant={variant}
                  compact
                  text={replyText}
                  onTextChange={setReplyText}
                  onSubmit={() => submitReply(String(c._id))}
                  token={token}
                  commentSubmitting={commentSubmitting}
                  placeholder={
                    token ? t('home.writeReply') : t('home.signInToComment')
                  }
                />
              </div>
            )}
          </div>
        )}
      </Wrapper>
    );
  };

  return (
    <div
      className={variant === 'feed' ? 'mt-3 pt-3 border-t border-neutral-200' : ''}
      onClick={(e) => e.stopPropagation()}
    >
      {variant === 'sidebar' && (
        <p className="text-sm font-semibold text-neutral-900 mb-3">{t('home.commentsHeading')}</p>
      )}
      <div className={`overflow-y-auto ${listMaxHeight} pr-1 -mr-1`}>
        {commentsLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-black" />
          </div>
        ) : (
          <>
            {roots.length === 0 && (
              <p className="py-4 text-center cursor-default text-sm text-neutral-500">
                {t('home.noCommentsHint')}
              </p>
            )}
            <ul className={`space-y-3 ${variant === 'feed' ? 'mb-2' : 'mb-4'}`}>
              {roots.map((c) => renderCommentRow(c, { isRoot: true }))}
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

import React from 'react';
import type { PostCoinAttachment } from '../../types/postCoin';
import type { PostLinkAttachment } from '../../types/postLink';
import type { FeedPostPoll } from '../../types/postPoll';
import PostCoinAttachmentDisplay from './PostCoinAttachmentDisplay';
import PostLinkAttachmentDisplay from './PostLinkAttachmentDisplay';
import PostPollDisplay from './PostPollDisplay';

interface PostContentBodyProps {
  content?: string;
  linkAttachment?: PostLinkAttachment | null;
  coinAttachment?: PostCoinAttachment | null;
  poll?: FeedPostPoll | null;
  postId?: string;
  onPollChange?: (poll: FeedPostPoll) => void;
  contentClassName?: string;
}

const PostContentBody: React.FC<PostContentBodyProps> = ({
  content,
  linkAttachment,
  coinAttachment,
  poll,
  postId,
  onPollChange,
  contentClassName = 'whitespace-pre-wrap break-words text-base leading-relaxed text-neutral-900',
}) => {
  const hasContent = Boolean(content?.trim());
  const hasLink = Boolean(linkAttachment?.title?.trim() && linkAttachment?.url?.trim());
  const hasCoin = Boolean(
    coinAttachment?.coinId?.trim() &&
      coinAttachment?.name?.trim() &&
      coinAttachment?.symbol?.trim()
  );
  const hasPoll = Boolean(poll?.options && poll.options.length >= 2 && postId);

  if (!hasContent && !hasLink && !hasCoin && !hasPoll) return null;

  return (
    <>
      {hasContent ? <p className={contentClassName}>{content}</p> : null}
      {hasLink ? <PostLinkAttachmentDisplay link={linkAttachment!} /> : null}
      {hasCoin ? <PostCoinAttachmentDisplay coin={coinAttachment!} /> : null}
      {hasPoll ? (
        <PostPollDisplay postId={postId!} poll={poll!} onPollChange={onPollChange} />
      ) : null}
    </>
  );
};

export default PostContentBody;

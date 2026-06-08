import React from 'react';
import type { PostCoinAttachment } from '../../types/postCoin';
import type { PostLinkAttachment } from '../../types/postLink';
import PostCoinAttachmentDisplay from './PostCoinAttachmentDisplay';
import PostLinkAttachmentDisplay from './PostLinkAttachmentDisplay';

interface PostContentBodyProps {
  content?: string;
  linkAttachment?: PostLinkAttachment | null;
  coinAttachment?: PostCoinAttachment | null;
  contentClassName?: string;
}

const PostContentBody: React.FC<PostContentBodyProps> = ({
  content,
  linkAttachment,
  coinAttachment,
  contentClassName = 'whitespace-pre-wrap break-words text-base leading-relaxed text-neutral-900',
}) => {
  const hasContent = Boolean(content?.trim());
  const hasLink = Boolean(linkAttachment?.title?.trim() && linkAttachment?.url?.trim());
  const hasCoin = Boolean(
    coinAttachment?.coinId?.trim() &&
      coinAttachment?.name?.trim() &&
      coinAttachment?.symbol?.trim()
  );

  if (!hasContent && !hasLink && !hasCoin) return null;

  return (
    <>
      {hasContent ? <p className={contentClassName}>{content}</p> : null}
      {hasLink ? <PostLinkAttachmentDisplay link={linkAttachment!} /> : null}
      {hasCoin ? <PostCoinAttachmentDisplay coin={coinAttachment!} /> : null}
    </>
  );
};

export default PostContentBody;

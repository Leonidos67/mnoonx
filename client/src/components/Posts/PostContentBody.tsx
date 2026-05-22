import React from 'react';
import type { PostLinkAttachment } from '../../types/postLink';
import PostLinkAttachmentDisplay from './PostLinkAttachmentDisplay';

interface PostContentBodyProps {
  content?: string;
  linkAttachment?: PostLinkAttachment | null;
  contentClassName?: string;
}

const PostContentBody: React.FC<PostContentBodyProps> = ({
  content,
  linkAttachment,
  contentClassName = 'whitespace-pre-wrap break-words text-base leading-relaxed text-neutral-900',
}) => {
  const hasContent = Boolean(content?.trim());
  const hasLink = Boolean(linkAttachment?.title?.trim() && linkAttachment?.url?.trim());

  if (!hasContent && !hasLink) return null;

  return (
    <>
      {hasContent ? <p className={contentClassName}>{content}</p> : null}
      {hasLink ? <PostLinkAttachmentDisplay link={linkAttachment!} /> : null}
    </>
  );
};

export default PostContentBody;

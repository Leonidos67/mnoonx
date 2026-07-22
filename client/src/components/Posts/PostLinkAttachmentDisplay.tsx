import React from 'react';
import { Link } from 'react-router-dom';
import type { PostLinkAttachment } from '../../types/postLink';
import ExternalLink from '../Common/ExternalLink';

interface PostLinkAttachmentDisplayProps {
  link: PostLinkAttachment;
  className?: string;
}

const PostLinkAttachmentDisplay: React.FC<PostLinkAttachmentDisplayProps> = ({ link, className = '' }) => {
  const title = link.title?.trim();
  const url = link.url?.trim();
  if (!title || !url) return null;

  const linkClass = `text-[#315efb] underline decoration-[#315efb]/40 underline-offset-2 hover:text-[#2447c9] ${className}`;

  if (url.startsWith('/')) {
    return (
      <p className="">
        <Link to={url} className={`${linkClass} break-words`}>
          {title}
        </Link>
      </p>
    );
  }

  return (
    <p className="mt-2">
      <ExternalLink href={url} className={`${linkClass} break-all`}>
        {title}
      </ExternalLink>
    </p>
  );
};

export default PostLinkAttachmentDisplay;

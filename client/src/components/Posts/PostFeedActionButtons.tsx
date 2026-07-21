import React, { useRef } from 'react';
import {
  GitCompareArrowsIcon,
  HeartIcon,
  MessageCircleIcon,
  type IconHandle,
} from '@animateicons/react/lucide';

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
}) => {
  const likeRef = useRef<IconHandle>(null);
  const commentRef = useRef<IconHandle>(null);
  const repostRef = useRef<IconHandle>(null);

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

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRepost(postId);
        }}
        onMouseEnter={() => repostRef.current?.startAnimation()}
        onMouseLeave={() => repostRef.current?.stopAnimation()}
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
    </div>
  );
};

export default PostFeedActionButtons;

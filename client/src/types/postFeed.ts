export interface PostComment {
  _id: string;
  content: string;
  createdAt: string;
  likesCount?: number;
  /** Null/undefined = top-level; otherwise parent comment _id */
  parentId?: string | null;
  user: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
}

import type { PostCoinAttachment } from './postCoin';
import type { PostLinkAttachment } from './postLink';

export interface FeedPost {
  _id: string;
  content: string;
  author: {
    _id?: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  community?: {
    _id: string;
    name: string;
    handle: string;
    avatar: string;
  } | null;
  likesCount: number;
  commentsCount: number;
  comments?: PostComment[];
  repostsCount: number;
  viewsCount?: number;
  media: string[];
  linkAttachment?: PostLinkAttachment | null;
  coinAttachment?: PostCoinAttachment | null;
  createdAt: string;
  isLiked?: boolean;
  isReposted?: boolean;
  isPrivate?: boolean;
  isBookmarked?: boolean;
  bookmarksCount?: number;
  /** Present when this post is a quote-repost of another post */
  quoteOf?: string | null;
  /** Serialized original post when this is a quote-repost, or `{ missing: true }` if deleted */
  quotedPost?: FeedPost | { missing: true } | null;
}

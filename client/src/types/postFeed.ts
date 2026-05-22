export interface PostComment {
  _id: string;
  content: string;
  createdAt: string;
  likesCount?: number;
  user: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
}

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
  createdAt: string;
  isLiked?: boolean;
  isReposted?: boolean;
  isPrivate?: boolean;
}

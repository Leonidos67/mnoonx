import type { PostLightboxMeta } from '../components/Posts/postMediaTypes';

type PostForLightbox = {
  content?: string;
  createdAt: string;
  isPrivate?: boolean;
  author: {
    username: string;
    fullName: string;
    avatar: string;
  };
  community?: {
    name: string;
    handle: string;
    avatar?: string;
  } | null;
};

export function buildPostLightboxMeta(
  post: PostForLightbox,
  communityOverride?: PostLightboxMeta['community'] | null
): PostLightboxMeta {
  const community =
    communityOverride !== undefined
      ? communityOverride
      : post.community && !post.isPrivate
        ? post.community
        : null;

  return {
    author: post.author,
    community,
    createdAt: post.createdAt,
    content: post.content,
  };
}

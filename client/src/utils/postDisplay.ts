import type { FeedPost } from '../types/postFeed';

export interface PostCommunityMeta {
  _id: string;
  name: string;
  handle: string;
  avatar: string;
}

export function isPopulatedCommunity(community: unknown): community is PostCommunityMeta {
  if (!community || typeof community !== 'object') return false;
  const c = community as PostCommunityMeta;
  return typeof c.name === 'string' && c.name.length > 0 && typeof c.handle === 'string';
}

export function resolvePostCommunity(
  post: FeedPost,
  communityContext?: PostCommunityMeta | null,
): PostCommunityMeta | null {
  if (isPopulatedCommunity(post.community)) return post.community;
  if (communityContext) return communityContext;
  return null;
}

export function getPostDisplayMeta(
  post: FeedPost,
  communityContext?: PostCommunityMeta | null,
) {
  const communityMeta = resolvePostCommunity(post, communityContext);
  const displayAsCommunity = Boolean(communityMeta && !post.isPrivate);
  const authorName = post.author?.fullName || post.author?.username || 'User';
  const authorUsername = post.author?.username || 'user';

  const displayName = displayAsCommunity
    ? communityMeta!.name
    : authorName;
  const displayUsername = displayAsCommunity
    ? `@${communityMeta!.handle}`
    : `@${authorUsername}`;
  const displayAvatar = displayAsCommunity
    ? communityMeta!.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(communityMeta!.name)}&background=315efb&color=fff&size=40&bold=true`
    : post.author?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=000&color=fff&size=40&bold=true`;
  const profileLink = displayAsCommunity
    ? `/community/${communityMeta!.handle}`
    : `/@${authorUsername}`;

  return {
    communityMeta,
    displayAsCommunity,
    displayName,
    displayUsername,
    displayAvatar,
    profileLink,
  };
}

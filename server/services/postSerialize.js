const Community = require('../models/Community');
const User = require('../models/User');

function serializePollForFeed(poll, viewerUserId) {
  const options = Array.isArray(poll?.options) ? poll.options : [];
  if (options.length < 2) return null;

  const uid = viewerUserId ? String(viewerUserId) : null;
  let totalVotes = 0;
  let viewerVotedOptionId = null;

  const mapped = options.map((opt) => {
    const votes = Array.isArray(opt.votes) ? opt.votes.map(String) : [];
    const votesCount =
      typeof opt.votesCount === 'number' ? opt.votesCount : votes.length;
    totalVotes += votesCount;
    if (uid && votes.some((id) => id === uid)) {
      viewerVotedOptionId = String(opt.id);
    }
    return {
      id: String(opt.id),
      text: String(opt.text || '').trim(),
      votesCount,
    };
  });

  return {
    options: mapped.map((opt) => ({
      ...opt,
      percent:
        totalVotes > 0 ? Math.round((opt.votesCount / totalVotes) * 1000) / 10 : 0,
    })),
    totalVotes,
    viewerVotedOptionId,
  };
}

async function serializeCommunityInfo(communityId) {
  if (!communityId) return null;
  const community = await Community.findById(communityId).select('name handle avatar');
  if (!community) return null;
  return {
    _id: community._id,
    name: community.name,
    handle: community.handle,
    avatar: community.avatar || '',
  };
}

async function serializePostAuthor(authorId) {
  const author = await User.findById(authorId).select('username fullName avatar');
  if (!author) {
    return {
      _id: String(authorId),
      username: 'unknown',
      fullName: 'Unknown',
      avatar: '',
    };
  }
  return {
    _id: author._id.toString(),
    username: author.username,
    fullName: author.fullName || author.username,
    avatar: author.avatar || '',
  };
}

/**
 * @param {import('../models/Post')} post
 * @param {string|null|undefined} viewerUserId
 */
async function serializeFeedPost(post, viewerUserId) {
  const uid = viewerUserId ? String(viewerUserId) : null;
  const author = await serializePostAuthor(post.author);
  const community = await serializeCommunityInfo(post.community);

  return {
    _id: post._id,
    content: post.content,
    author,
    community,
    media: post.media || [],
    linkAttachment:
      post.linkAttachment?.title?.trim() && post.linkAttachment?.url?.trim()
        ? {
            title: String(post.linkAttachment.title).trim(),
            url: String(post.linkAttachment.url).trim(),
          }
        : null,
    coinAttachment:
      post.coinAttachment?.coinId?.trim() &&
      post.coinAttachment?.name?.trim() &&
      post.coinAttachment?.symbol?.trim()
        ? {
            coinId: String(post.coinAttachment.coinId).trim().toLowerCase(),
            name: String(post.coinAttachment.name).trim(),
            symbol: String(post.coinAttachment.symbol).trim().toLowerCase(),
          }
        : null,
    poll: serializePollForFeed(post.poll, uid),
    likesCount: post.likesCount || 0,
    commentsCount: post.commentsCount || 0,
    repostsCount: post.repostsCount || 0,
    viewsCount: post.viewsCount || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isLiked: uid ? (post.likes || []).some((id) => String(id) === uid) : false,
    isReposted: uid ? (post.reposts || []).some((id) => String(id) === uid) : false,
    isBookmarked: uid ? (post.bookmarks || []).some((id) => String(id) === uid) : false,
    bookmarksCount: post.bookmarksCount || 0,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    quoteOf: post.quoteOf || null,
    quotedPost: null,
    isPrivate: post.isPrivate || false,
  };
}

async function attachQuotedPost(serialized, quoteOfId, viewerUserId) {
  if (!quoteOfId) return serialized;
  try {
    const Post = require('../models/Post');
    const original = await Post.findById(quoteOfId);
    if (!original) {
      serialized.quotedPost = { missing: true };
      return serialized;
    }
    serialized.quotedPost = await serializeFeedPost(original, viewerUserId);
  } catch {
    serialized.quotedPost = { missing: true };
  }
  return serialized;
}

module.exports = {
  serializeCommunityInfo,
  serializePostAuthor,
  serializeFeedPost,
  attachQuotedPost,
  serializePollForFeed,
};

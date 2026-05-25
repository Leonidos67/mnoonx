const Follow = require('../models/Follow');
const User = require('../models/User');

const DEFAULT_CANDIDATE_POOL = 600;
const DEFAULT_FEED_LIMIT = 60;
const MAX_FEED_LIMIT = 100;
const MAX_SAME_AUTHOR_IN_ROW = 2;
const MAX_SAME_COMMUNITY_IN_ROW = 1;

/** Stable 0..1 jitter per post + viewer + calendar day */
function dailyJitter(postId, viewerKey) {
  const day = new Date().toISOString().slice(0, 10);
  const seed = `${postId}:${viewerKey || 'guest'}:${day}`;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (h % 1000) / 1000;
}

function ageHours(createdAt) {
  const t = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  return Math.max(0, (Date.now() - t) / (1000 * 60 * 60));
}

function isCommunityPromoLink(linkAttachment) {
  const url = linkAttachment?.url;
  if (!url || typeof url !== 'string') return false;
  return /\/community\/[^/?#]+/i.test(url);
}

function dayKey(createdAt) {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {import('../models/Post')} post
 * @param {{ followingAuthors: Set<string>, joinedCommunityIds: Set<string>, viewerKey: string }} ctx
 */
function computePostScore(post, ctx) {
  const hours = ageHours(post.createdAt);
  const recency = Math.exp(-hours / 56);

  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const reposts = post.repostsCount || 0;
  const engagement =
    Math.min(2.2, Math.log1p(likes) * 0.35) +
    Math.min(2.5, Math.log1p(comments) * 0.5) +
    Math.min(1.8, Math.log1p(reposts) * 0.4);

  const authorId = String(post.author);
  let personal = 0;
  if (ctx.followingAuthors.has(authorId)) personal += 1.1;
  const commId = post.community ? String(post.community) : '';
  if (commId && ctx.joinedCommunityIds.has(commId)) personal += 0.65;

  const hasMedia = Array.isArray(post.media) && post.media.length > 0 ? 0.2 : 0;
  const promo = isCommunityPromoLink(post.linkAttachment) ? 0.12 : 0;
  const jitter = dailyJitter(String(post._id), ctx.viewerKey) * 0.35;

  return recency * 2.4 + engagement * 0.45 + personal + hasMedia + promo + jitter;
}

function violatesDiversity(post, recentPosts) {
  if (!recentPosts.length) return false;

  const author = String(post.author);
  const comm = post.community ? String(post.community) : null;

  const tailAuthors = recentPosts.map((p) => String(p.author));
  const sameAuthorRun = tailAuthors.filter((a) => a === author).length;
  if (sameAuthorRun >= MAX_SAME_AUTHOR_IN_ROW) return true;

  if (comm) {
    const tailComms = recentPosts.map((p) => (p.community ? String(p.community) : null));
    const sameCommRun = tailComms.filter((c) => c === comm).length;
    if (sameCommRun >= MAX_SAME_COMMUNITY_IN_ROW) return true;
  }

  return false;
}

/**
 * Greedy feed: high score first, but spread authors, communities, and posting days.
 * @param {import('../models/Post')[]} posts
 * @param {number} limit
 * @param {{ followingAuthors: Set<string>, joinedCommunityIds: Set<string>, viewerKey: string }} ctx
 */
function buildRankedFeed(posts, limit, ctx) {
  const scored = posts.map((post) => ({
    post,
    score: computePostScore(post, ctx),
    day: dayKey(post.createdAt),
  }));

  scored.sort((a, b) => b.score - a.score);

  const picked = [];
  const remaining = [...scored];
  const dayCounts = new Map();

  while (picked.length < limit && remaining.length > 0) {
    let bestIdx = -1;
    let bestAdj = -Infinity;
    let relaxedIdx = -1;
    let relaxedAdj = -Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const item = remaining[i];
      const dayCount = dayCounts.get(item.day) || 0;
      const dayPenalty = dayCount * 0.18;
      const adj = item.score - dayPenalty;

      if (adj > relaxedAdj) {
        relaxedAdj = adj;
        relaxedIdx = i;
      }

      const recent = picked.slice(-3).map((x) => x.post);
      if (violatesDiversity(item.post, recent)) continue;

      if (adj > bestAdj) {
        bestAdj = adj;
        bestIdx = i;
      }
    }

    const useIdx = bestIdx >= 0 ? bestIdx : relaxedIdx;
    if (useIdx < 0) break;

    const [item] = remaining.splice(useIdx, 1);
    picked.push(item);
    dayCounts.set(item.day, (dayCounts.get(item.day) || 0) + 1);
  }

  return picked.map((x) => x.post);
}

/**
 * @param {string|null|undefined} userId
 */
async function loadFeedViewerContext(userId) {
  const followingAuthors = new Set();
  const joinedCommunityIds = new Set();

  if (!userId) {
    return { followingAuthors, joinedCommunityIds, viewerKey: 'guest' };
  }

  const uid = String(userId);
  const follows = await Follow.find({ follower: uid }).select('following').lean();
  for (const f of follows) {
    if (f.following) followingAuthors.add(String(f.following));
  }

  const user = await User.findById(uid).select('joinedCommunities').lean();
  if (user?.joinedCommunities) {
    for (const c of user.joinedCommunities) {
      joinedCommunityIds.add(String(c));
    }
  }

  return { followingAuthors, joinedCommunityIds, viewerKey: uid };
}

function clampInt(value, min, max, fallback) {
  const n = parseInt(String(value), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

module.exports = {
  DEFAULT_CANDIDATE_POOL,
  DEFAULT_FEED_LIMIT,
  MAX_FEED_LIMIT,
  loadFeedViewerContext,
  computePostScore,
  buildRankedFeed,
  clampInt,
  isCommunityPromoLink,
};

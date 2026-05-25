/**
 * Seed 480 community promo posts (22–24.05.2026) with join/visit CTA.
 *
 * Usage (from server/):
 *   npm run seed:may22-24          — insert missing
 *   npm run seed:may22-24 -- --force — delete seed posts in date range, re-insert
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');
const { generateMay22_24Posts, DAY_QUOTAS, USERNAME_POOL } = require('./generateMay22_24Posts');

const SEED_PASSWORD = 'SeedDemo2024!';

function parsePublishedAt(value) {
  const [datePart, timePart] = value.trim().split(/\s+/);
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function rangeMay22_24() {
  const start = new Date(2026, 4, 22, 0, 0, 0, 0);
  const end = new Date(2026, 4, 25, 0, 0, 0, 0);
  return { start, end };
}

function buildComments(specComments, userMap) {
  if (!specComments?.length) return [];
  return specComments
    .map((c) => {
      const author = userMap.get(c.by);
      if (!author) return null;
      const createdAt = parsePublishedAt(c.publishedAt);
      return {
        user: author._id.toString(),
        content: c.text,
        likes: [],
        likesCount: 0,
        createdAt,
      };
    })
    .filter(Boolean);
}

function buildEngagementIds(userMap, authorId, count) {
  const author = String(authorId);
  const out = [];
  const pool = [...userMap.values()]
    .map((u) => u._id.toString())
    .filter((id) => id !== author);
  let i = 0;
  while (out.length < count && pool.length > 0) {
    out.push(pool[i % pool.length]);
    i += 1;
  }
  return out.slice(0, count);
}

async function ensureUser(def) {
  let user = await User.findOne({ username: def.username });
  if (user) return user;

  user = new User({
    username: def.username,
    email: def.email || `${def.username}@seed.mnoonx.dev`,
    password: SEED_PASSWORD,
    fullName: def.fullName || def.username,
    bio: def.bio || '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(def.fullName || def.username)}&background=111827&color=fff&size=128&bold=true`,
  });
  await user.save();
  console.log(`  + user @${def.username}`);
  return user;
}

async function ensureAuthorsForPosts(posts, userMap) {
  const names = new Set([...posts.map((p) => p.username), ...USERNAME_POOL]);
  for (const username of names) {
    if (userMap.has(username)) continue;
    let user = await User.findOne({ username });
    if (!user) {
      user = await User.findOne({ email: `${username}@seed.mnoonx.dev` });
    }
    if (!user) {
      user = await ensureUser({
        username,
        email: `${username}@seed.mnoonx.dev`,
        fullName: username.replace(/_/g, ' '),
      });
    }
    userMap.set(username, user);
  }
}

async function loadCommunities() {
  const docs = await Community.find()
    .select('name handle description category owner')
    .populate('owner', 'username')
    .lean();

  if (docs.length === 0) {
    console.log('  No communities in DB — using default list from generateMay21Posts');
    const { DEFAULT_COMMUNITIES } = require('./generateMay22_24Posts');
    return DEFAULT_COMMUNITIES.map((c) => ({
      handle: c.handle,
      name: c.name,
      topic: c.topic,
      ownerUsername: null,
    }));
  }

  return docs.map((c) => ({
    handle: c.handle,
    name: c.name,
    topic: c.description?.slice(0, 80) || c.category || 'крипто',
    ownerUsername: c.owner?.username || null,
  }));
}

async function createPost(authorId, spec, userMap) {
  const createdAt = parsePublishedAt(spec.publishedAt);
  const commentDocs = buildComments(spec.comments, userMap);
  const commentsCount = commentDocs.length;
  const likes = buildEngagementIds(userMap, authorId, spec.likes ?? 0);
  const reposts = buildEngagementIds(userMap, authorId, spec.reposts ?? 0);

  const post = new Post({
    author: authorId.toString(),
    content: spec.content,
    linkAttachment: spec.linkAttachment,
    media: [],
    likes,
    likesCount: likes.length,
    reposts,
    repostsCount: reposts.length,
    comments: commentDocs,
    commentsCount,
    viewsCount: Math.max(3, Math.floor((spec.likes ?? 0) * 2 + commentsCount + 2)),
    isPrivate: false,
    community: null,
  });

  post.createdAt = createdAt;
  post.updatedAt = createdAt;
  await post.save({ timestamps: false });
}

async function clearRangePosts(seedAuthorIds) {
  const { start, end } = rangeMay22_24();
  const result = await Post.deleteMany({
    author: { $in: seedAuthorIds },
    createdAt: { $gte: start, $lt: end },
  });
  console.log(`  Removed ${result.deletedCount} posts dated 22–24.05.2026 (seed authors)`);
}

async function main() {
  const force = process.argv.includes('--force');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  console.log(`  Day quotas: ${DAY_QUOTAS.map((d) => `${d.date} → ${d.count}`).join(', ')}`);

  const communities = await loadCommunities();
  console.log(`  Communities: ${communities.length}`);

  const POSTS = generateMay22_24Posts(communities);
  console.log(`  Generated posts: ${POSTS.length}`);

  const userMap = new Map();
  await ensureAuthorsForPosts(POSTS, userMap);

  const seedAuthorIds = [...userMap.values()].map((u) => u._id.toString());

  if (force) {
    await clearRangePosts(seedAuthorIds);
  }

  let created = 0;
  let skipped = 0;

  for (const spec of POSTS) {
    const user = userMap.get(spec.username);
    if (!user) {
      skipped += 1;
      continue;
    }

    const createdAt = parsePublishedAt(spec.publishedAt);
    const exists = await Post.findOne({
      author: user._id.toString(),
      content: spec.content,
      createdAt: {
        $gte: new Date(createdAt.getTime() - 60000),
        $lte: new Date(createdAt.getTime() + 60000),
      },
    });

    if (exists && !force) {
      skipped += 1;
      continue;
    }
    if (exists && force) {
      await Post.deleteOne({ _id: exists._id });
    }

    await createPost(user._id, spec, userMap);
    created += 1;
  }

  for (const user of userMap.values()) {
    const count = await Post.countDocuments({ author: user._id.toString() });
    await User.findByIdAndUpdate(user._id, { postsCount: count });
  }

  const byDay = {};
  for (const spec of POSTS) {
    const day = spec.publishedAt.split(' ')[0];
    byDay[day] = (byDay[day] || 0) + 1;
  }

  console.log('\nDone.');
  console.log(`  Posts created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  By day (template): ${JSON.stringify(byDay)}`);
  console.log(`  All promo posts include linkAttachment → /community/:handle`);
  console.log(`  Likes/reposts: small (0–9 likes typical)\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

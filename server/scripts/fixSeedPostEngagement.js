/**
 * Sync likes/reposts arrays with likesCount/repostsCount (seed posts had counts but empty arrays).
 *
 * Usage (from server/):
 *   node scripts/fixSeedPostEngagement.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

function buildIds(pool, authorId, targetCount, existing = []) {
  const author = String(authorId);
  const out = [...existing.map(String)];
  const usable = pool.filter((id) => id !== author && !out.includes(id));
  let i = 0;
  while (out.length < targetCount) {
    const pick = usable.length > 0 ? usable[i % usable.length] : `seed-engagement-${out.length}`;
    out.push(pick);
    i += 1;
    if (i > targetCount * Math.max(usable.length, 1) + 10) {
      out.push(`seed-engagement-${out.length}`);
    }
  }
  return out.slice(0, targetCount);
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const seedUsers = await User.find({ email: /@seed\.mnoonx\.dev$/i }).select('_id');
  const pool = seedUsers.map((u) => u._id.toString());
  if (pool.length === 0) {
    console.error('No seed users found. Run npm run seed:feed first.');
    process.exit(1);
  }

  const posts = await Post.find({
    $or: [
      { $expr: { $gt: ['$likesCount', { $size: { $ifNull: ['$likes', []] } }] } },
      { $expr: { $gt: ['$repostsCount', { $size: { $ifNull: ['$reposts', []] } }] } },
    ],
  }).select('author likes likesCount reposts repostsCount');

  let fixed = 0;
  for (const post of posts) {
    let dirty = false;
    const targetLikes = post.likesCount || 0;
    const currentLikes = (post.likes || []).length;
    if (targetLikes > currentLikes) {
      post.likes = buildIds(pool, post.author, targetLikes, post.likes);
      dirty = true;
    } else if (targetLikes < currentLikes) {
      post.likes = post.likes.slice(0, targetLikes);
      post.likesCount = post.likes.length;
      dirty = true;
    }

    const targetReposts = post.repostsCount || 0;
    const currentReposts = (post.reposts || []).length;
    if (targetReposts > currentReposts) {
      post.reposts = buildIds(pool, post.author, targetReposts, post.reposts);
      dirty = true;
    } else if (targetReposts < currentReposts) {
      post.reposts = post.reposts.slice(0, targetReposts);
      post.repostsCount = post.reposts.length;
      dirty = true;
    }

    if (dirty) {
      post.likesCount = (post.likes || []).length;
      post.repostsCount = (post.reposts || []).length;
      post.markModified('likes');
      post.markModified('reposts');
      await post.save();
      fixed += 1;
    }
  }

  console.log(`Checked ${posts.length} posts with mismatched engagement, fixed ${fixed}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

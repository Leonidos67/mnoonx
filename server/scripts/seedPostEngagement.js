/**
 * Set likes/reposts on a post using bulk seed users (seedMnoonxBulkMembers.js).
 *
 * Usage (from server/):
 *   node scripts/seedPostEngagement.js --postId=6a0675e5077a2470929eb722 --likes=120 --reposts=5
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

const BULK_EMAIL_DOMAIN = 'bulk.seed.mnoonx.dev';

function parseArg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.split('=').slice(1).join('=');
}

function pickUserIds(pool, authorId, targetCount, existing = []) {
  const author = String(authorId);
  const out = [...existing.map(String)];
  const usable = pool.filter((id) => id !== author && !out.includes(id));
  if (usable.length < targetCount - out.length) {
    throw new Error(
      `Need ${targetCount - out.length} unique users but only ${usable.length} available (excluding author).`,
    );
  }
  let i = 0;
  while (out.length < targetCount) {
    out.push(usable[i % usable.length]);
    i += 1;
  }
  return out.slice(0, targetCount);
}

async function main() {
  const postId = String(parseArg('postId', '')).trim();
  const likesTarget = Math.max(0, parseInt(parseArg('likes', '0'), 10) || 0);
  const repostsTarget = Math.max(0, parseInt(parseArg('reposts', '0'), 10) || 0);

  if (!postId) {
    console.error('Usage: node scripts/seedPostEngagement.js --postId=<id> [--likes=120] [--reposts=5]');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const post = await Post.findById(postId).select('author likes likesCount reposts repostsCount content');
  if (!post) {
    console.error(`Post not found: ${postId}`);
    process.exit(1);
  }

  const bulkUsers = await User.find({
    email: new RegExp(`@${BULK_EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i'),
  })
    .select('_id username')
    .sort({ username: 1 });

  const pool = bulkUsers.map((u) => u._id.toString());
  if (pool.length === 0) {
    console.error(`No bulk users (@${BULK_EMAIL_DOMAIN}). Run: npm run seed:mnoonx-members`);
    process.exit(1);
  }

  console.log(`Post: ${postId}`);
  console.log(`Author: ${post.author}`);
  console.log(`Bulk users in pool: ${pool.length}`);
  console.log(`Targets: ${likesTarget} likes, ${repostsTarget} reposts`);
  console.log(`Before: likes=${post.likesCount} (${(post.likes || []).length} ids), reposts=${post.repostsCount} (${(post.reposts || []).length} ids)`);

  post.likes = pickUserIds(pool, post.author, likesTarget, []);
  post.likesCount = post.likes.length;

  post.reposts = pickUserIds(pool, post.author, repostsTarget, []);
  post.repostsCount = post.reposts.length;

  post.markModified('likes');
  post.markModified('reposts');
  await post.save();

  console.log(`After:  likes=${post.likesCount}, reposts=${post.repostsCount}`);
  console.log('Done.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

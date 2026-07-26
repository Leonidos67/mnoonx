/**
 * Restore the two original @mnoonx community posts:
 * 1) Welcome message
 * 2) Image + "2000 users" milestone text
 *
 * Usage (from server/):
 *   node scripts/restoreMnoonxPosts.js
 *   node scripts/restoreMnoonxPosts.js --with-engagement
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');

const OWNER_USERNAME = 'malvinalord';
const COMMUNITY_HANDLE = 'mnoonx';

/** Same copy as system_mnoonx welcome in messaging.js */
const WELCOME_CONTENT = `Welcome to MNOONX!

Thousands of internet entrepreneurs like you launch their businesses on MNOONX every day. You're just 3 steps away from joining them:

1. Add apps to your mnoonx
2. Set up MNOONX Payments
3. Invite your first user

If you have any questions, please contact our Support Team.

We're excited to see what you build!`;

const USERS_2000_CONTENT =
  '2000 users in MNOONX — thank you for building with us! 🚀';

const RESTORE_SPECS = [
  {
    _id: '6a0675e4077a2470929eb721',
    content: WELCOME_CONTENT,
    media: [],
    linkAttachment: null,
    createdAt: new Date(2026, 4, 19, 16, 30, 0, 0),
    likesTarget: 6,
    repostsTarget: 1,
  },
  {
    _id: '6a0675e5077a2470929eb722',
    content: USERS_2000_CONTENT,
    media: ['https://i.ibb.co/sv4kYKHK/image.png'],
    linkAttachment: null,
    createdAt: new Date(2026, 4, 21, 12, 0, 0, 0),
    likesTarget: 120,
    repostsTarget: 5,
  },
];

const BULK_EMAIL_DOMAIN = 'bulk.seed.mnoonx.dev';

function pickUserIds(pool, authorId, targetCount) {
  const author = String(authorId);
  const out = [];
  const usable = pool.filter((id) => id !== author);
  let i = 0;
  while (out.length < targetCount && usable.length > 0) {
    out.push(usable[i % usable.length]);
    i += 1;
  }
  return out;
}

async function applyEngagement(post, likesTarget, repostsTarget, bulkPool) {
  post.likes = pickUserIds(bulkPool, post.author, likesTarget);
  post.likesCount = post.likes.length;
  post.reposts = pickUserIds(bulkPool, post.author, repostsTarget);
  post.repostsCount = post.reposts.length;
  post.viewsCount = Math.max(post.viewsCount || 0, post.likesCount * 2 + 15);
  post.markModified('likes');
  post.markModified('reposts');
  await post.save({ timestamps: false });
}

async function upsertPost(authorId, communityId, spec) {
  const payload = {
    author: authorId,
    content: spec.content,
    community: communityId,
    media: spec.media || [],
    linkAttachment: spec.linkAttachment || undefined,
    isPrivate: false,
    comments: [],
    commentsCount: 0,
    bookmarks: [],
    updatedAt: spec.createdAt,
  };

  let post = await Post.findById(spec._id);
  if (post) {
    Object.assign(post, payload);
    post.createdAt = spec.createdAt;
    await post.save({ timestamps: false });
    console.log(`  ~ updated post ${spec._id}`);
    return post;
  }

  post = new Post({
    _id: new mongoose.Types.ObjectId(spec._id),
    ...payload,
    likes: [],
    likesCount: 0,
    reposts: [],
    repostsCount: 0,
    views: [],
    viewsCount: 12,
  });
  post.createdAt = spec.createdAt;
  await post.save({ timestamps: false });
  console.log(`  + post ${spec._id}`);
  return post;
}

async function main() {
  const withEngagement = process.argv.includes('--with-engagement');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 90000 });

  const owner = await User.findOne({ username: OWNER_USERNAME });
  const community = await Community.findOne({ handle: COMMUNITY_HANDLE });

  if (!owner || !community) {
    console.error('Owner or community not found');
    process.exit(1);
  }

  const authorId = owner._id.toString();
  const communityId = community._id;

  let bannerUrl = community.banner?.trim() || '';
  if (bannerUrl && !RESTORE_SPECS[1].media.length) {
    RESTORE_SPECS[1].media = [bannerUrl];
  } else if (bannerUrl) {
    RESTORE_SPECS[1].media = [bannerUrl];
  }

  console.log(`Restore MNOONX posts (@${OWNER_USERNAME})`);
  console.log(`  Image post media: ${RESTORE_SPECS[1].media[0] || '(none)'}`);

  const bulkUsers = withEngagement
    ? await User.find({
        email: new RegExp(`@${BULK_EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i'),
      })
        .select('_id')
        .sort({ username: 1 })
    : [];
  const bulkPool = bulkUsers.map((u) => u._id.toString());

  for (const spec of RESTORE_SPECS) {
    const post = await upsertPost(authorId, communityId, spec);
    if (withEngagement && bulkPool.length) {
      await applyEngagement(post, spec.likesTarget, spec.repostsTarget, bulkPool);
      console.log(`    engagement: ${post.likesCount} likes, ${post.repostsCount} reposts`);
    }
  }

  const count = await Post.countDocuments({ author: authorId });
  await User.findByIdAndUpdate(owner._id, { postsCount: count });

  console.log(`\nDone. @${OWNER_USERNAME} postsCount: ${count}`);
  console.log(`  Welcome: /post/${RESTORE_SPECS[0]._id}`);
  console.log(`  2000 users + image: /post/${RESTORE_SPECS[1]._id}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

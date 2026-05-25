/**
 * Restore @mnoonx posts from JSON backup (your real composer posts).
 *
 * 1. Copy mnoonxPosts.backup.example.json → mnoonxPosts.backup.json
 * 2. Fill exact content, media paths, dates, engagement counts
 * 3. node scripts/restoreMnoonxPostsFromBackup.js
 *    node scripts/restoreMnoonxPostsFromBackup.js --replace-wrong
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');

const BACKUP_FILE = path.join(__dirname, 'mnoonxPosts.backup.json');
const OWNER_USERNAME = 'malvinalord';
const COMMUNITY_HANDLE = 'mnoonx';
const WRONG_IDS = ['6a0675e5077a2470929eb722', '6a0675e4077a2470929eb721'];

async function main() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`Create ${BACKUP_FILE} from mnoonxPosts.backup.example.json`);
    process.exit(1);
  }

  const specs = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
  if (!Array.isArray(specs) || specs.length === 0) {
    console.error('Backup must be a non-empty JSON array');
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

  if (process.argv.includes('--replace-wrong')) {
    const removed = await Post.deleteMany({ _id: { $in: WRONG_IDS } });
    console.log(`Removed ${removed.deletedCount} auto-restored placeholder posts`);
  }

  for (const spec of specs) {
    const createdAt = new Date(spec.createdAt);
    const payload = {
      author: authorId,
      content: spec.content,
      community: communityId,
      media: spec.media || [],
      linkAttachment: spec.linkAttachment || undefined,
      isPrivate: false,
      likes: [],
      likesCount: spec.likesCount ?? 0,
      reposts: [],
      repostsCount: spec.repostsCount ?? 0,
      comments: [],
      commentsCount: 0,
      viewsCount: spec.viewsCount ?? 10,
      createdAt,
      updatedAt: createdAt,
    };

    if (spec._id) {
      const existing = await Post.findById(spec._id);
      if (existing) {
        Object.assign(existing, payload);
        await existing.save({ timestamps: false });
        console.log(`  ~ ${spec._id}`);
      } else {
        const post = new Post({ _id: new mongoose.Types.ObjectId(spec._id), ...payload });
        await post.save({ timestamps: false });
        console.log(`  + ${spec._id}`);
      }
    } else {
      const post = new Post(payload);
      post.createdAt = createdAt;
      await post.save({ timestamps: false });
      console.log(`  + new ${post._id}`);
    }
  }

  const count = await Post.countDocuments({ author: authorId });
  await User.findByIdAndUpdate(owner._id, { postsCount: count });
  console.log(`Done. @${OWNER_USERNAME} posts: ${count}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

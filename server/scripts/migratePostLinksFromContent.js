/**
 * Move inline /community/{handle} URLs from post content into linkAttachment.
 *
 * Usage (from server/):
 *   node scripts/migratePostLinksFromContent.js           # apply
 *   node scripts/migratePostLinksFromContent.js --dry-run  # preview only
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Community = require('../models/Community');
const { COMMUNITIES: SEED_COMMUNITIES } = require('./generateMay21Posts');

const COMMUNITY_PATH_RE = /\/community\/([a-z0-9_-]+)\/?/gi;

function extractCommunityHandle(content) {
  const matches = [...content.matchAll(COMMUNITY_PATH_RE)];
  if (!matches.length) return null;
  return matches[matches.length - 1][1].toLowerCase();
}

function stripCommunityUrlsFromContent(content) {
  let cleaned = content;
  cleaned = cleaned.replace(/\s*—\s*\/community\/[a-z0-9_-]+\/?\s*/gi, ' ');
  cleaned = cleaned.replace(/\s*→\s*\/community\/[a-z0-9_-]+\/?\s*/gi, ' ');
  cleaned = cleaned.replace(/\s*Join:\s*\/community\/[a-z0-9_-]+\/?\s*/gi, ' ');
  cleaned = cleaned.replace(/\s*\/community\/[a-z0-9_-]+\/?\s*/gi, ' ');
  cleaned = cleaned.replace(/\s*Join\s+[^.!?]+[.!?]?\s*$/iu, '');
  cleaned = cleaned.replace(/\s*Заходи в сообщество\s+[^.!?]+[.!?]?\s*$/iu, '');
  cleaned = cleaned.replace(
    /\s*Заходи в сообщество\s+[^.]+\.\s*Там разбираем[^.]*\.?\s*/giu,
    ''
  );
  cleaned = cleaned.replace(
    /\s*Join\s+[^.]+\.\s*[^.]*discussions, no hype-only vibes\.?\s*/giu,
    ''
  );
  cleaned = cleaned.replace(/\s*P\.S\.\s*Вечером загляну в [^.]+\.\s*$/iu, '');
  cleaned = cleaned.replace(/\s*—\s*$/u, '');
  cleaned = cleaned.replace(/\s*→\s*$/u, '');
  cleaned = cleaned.replace(/\s*Join:\s*$/iu, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\s+([.,!?])/g, '$1');
  return cleaned;
}

function handleToTitle(handle) {
  return handle
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function hasLinkAttachment(post) {
  return Boolean(post.linkAttachment?.title?.trim() && post.linkAttachment?.url?.trim());
}

function buildLinkForHandle(handle, communityByHandle) {
  const comm = communityByHandle.get(handle);
  const url = `/community/${handle}`;
  const title = comm?.name || handleToTitle(handle);
  return { title: title.slice(0, 120), url };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const communities = await Community.find().select('name handle');
  const communityByHandle = new Map(communities.map((c) => [c.handle.toLowerCase(), c]));
  for (const c of SEED_COMMUNITIES) {
    if (!communityByHandle.has(c.handle)) {
      communityByHandle.set(c.handle, { name: c.name, handle: c.handle });
    }
  }

  const candidates = await Post.find({
    $or: [
      { content: { $regex: /\/community\/[a-z0-9_-]+/i } },
      {
        linkAttachment: { $exists: true, $ne: null },
        content: { $regex: /Заходи в сообщество|Join .+ hype-only|Pull up:/i },
      },
    ],
  }).select('content linkAttachment author');

  const toUpdate = candidates.filter((p) => {
    if (!hasLinkAttachment(p)) return true;
    return /\/community\/|Заходи в сообщество|Join .+ hype-only|Pull up:/i.test(p.content);
  });

  console.log(`Found ${candidates.length} posts with /community/ in text`);
  console.log(`Will migrate ${toUpdate.length} (no linkAttachment yet)`);
  if (dryRun) console.log('DRY RUN — no writes\n');

  let updated = 0;
  let skipped = 0;

  for (const post of toUpdate) {
    let handle = extractCommunityHandle(post.content);
    if (!handle && hasLinkAttachment(post)) {
      const m = post.linkAttachment.url.match(/^\/community\/([a-z0-9_-]+)/i);
      handle = m ? m[1].toLowerCase() : null;
    }
    if (!handle) {
      skipped += 1;
      continue;
    }

    const linkAttachment = hasLinkAttachment(post)
      ? {
          title: post.linkAttachment.title.trim().slice(0, 120),
          url: post.linkAttachment.url.trim().slice(0, 500),
        }
      : buildLinkForHandle(handle, communityByHandle);
    const content = stripCommunityUrlsFromContent(post.content);

    if (!content && !linkAttachment.url) {
      skipped += 1;
      continue;
    }

    console.log('---');
    console.log(`Post ${post._id}`);
    console.log(`  Before: ${post.content.slice(0, 100)}${post.content.length > 100 ? '…' : ''}`);
    console.log(`  After:  ${content.slice(0, 100)}${content.length > 100 ? '…' : ''}`);
    console.log(`  Link:   "${linkAttachment.title}" → ${linkAttachment.url}`);

    if (!dryRun) {
      post.content = content;
      post.linkAttachment = linkAttachment;
      post.markModified('linkAttachment');
      await post.save();
    }
    updated += 1;
  }

  console.log(`\nDone. ${dryRun ? 'Would update' : 'Updated'}: ${updated}, skipped: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

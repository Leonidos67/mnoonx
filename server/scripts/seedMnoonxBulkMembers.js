/**
 * Create bulk users with unique crypto personas and add them to community @mnoonx.
 *
 * Usage (from server/):
 *   npm run seed:mnoonx-members
 *   node scripts/seedMnoonxBulkMembers.js --count=492
 *   node scripts/seedMnoonxBulkMembers.js --count=492 --clean-generic
 *   node scripts/seedMnoonxBulkMembers.js --handle=mnoonx
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const { generateBulkPersonas } = require('./bulkMemberPersonas');

const DEFAULT_HANDLE = 'mnoonx';
const DEFAULT_COUNT = 492;
const BULK_PASSWORD = 'BulkMember2024!';
const EMAIL_DOMAIN = 'bulk.seed.mnoonx.dev';
const GENERIC_USERNAME_RE = /^mnoonx_u\d+$/i;

function parseArg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.split('=').slice(1).join('=');
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function cleanGenericBulkUsers(community) {
  const genericUsers = await User.find({
    $or: [
      { username: GENERIC_USERNAME_RE },
      { email: new RegExp(`^mnoonx_u\\d+@${EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i') },
    ],
  }).select('_id username');

  if (!genericUsers.length) {
    console.log('  No generic mnoonx_u* users to remove.');
    return 0;
  }

  const ids = genericUsers.map((u) => u._id);
  const idStr = new Set(ids.map((id) => id.toString()));

  community.members = (community.members || []).filter((m) => !idStr.has(m.toString()));
  community.memberJoins = (community.memberJoins || []).filter((j) => !idStr.has(j.userId.toString()));
  community.memberCount = community.members.length;
  community.markModified('members');
  community.markModified('memberJoins');
  await community.save();

  await User.updateMany({ _id: { $in: ids } }, { $pull: { joinedCommunities: community._id } });
  const del = await User.deleteMany({ _id: { $in: ids } });

  console.log(`  Removed ${del.deletedCount} generic users (mnoonx_u001 style).`);
  return del.deletedCount;
}

async function main() {
  const handle = String(parseArg('handle', DEFAULT_HANDLE)).toLowerCase();
  const count = Math.min(Math.max(parseInt(parseArg('count', String(DEFAULT_COUNT)), 10) || DEFAULT_COUNT, 1), 2000);
  const cleanGeneric = hasFlag('clean-generic');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const community = await Community.findOne({ handle });
  if (!community) {
    console.error(`Community @${handle} not found. Create it first.`);
    process.exit(1);
  }

  console.log(`Community: ${community.name} (@${handle})`);
  console.log(`Current members: ${community.memberCount ?? community.members?.length ?? 0}`);

  if (cleanGeneric) {
    console.log('Cleaning old generic bulk users...');
    await cleanGenericBulkUsers(community);
  }

  const personas = generateBulkPersonas(count, EMAIL_DOMAIN);
  console.log(`Creating up to ${personas.length} unique users (${EMAIL_DOMAIN})...\n`);

  const passwordHash = await bcrypt.hash(BULK_PASSWORD, 10);
  let createdUsers = 0;
  let skippedUsers = 0;

  for (const persona of personas) {
    const exists = await User.findOne({
      $or: [{ username: persona.username }, { email: persona.email }],
    }).select('_id');

    if (exists) {
      skippedUsers += 1;
      continue;
    }

    await User.create({
      username: persona.username,
      email: persona.email,
      password: passwordHash,
      fullName: persona.fullName,
      bio: persona.bio,
      avatar: persona.avatar,
    });
    createdUsers += 1;
    if (createdUsers % 50 === 0) {
      console.log(`  users created: ${createdUsers}`);
    }
  }

  const bulkUsers = await User.find({
    email: new RegExp(`@${EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i'),
  })
    .select('_id')
    .limit(count + 500);

  const memberSet = new Set((community.members || []).map((m) => m.toString()));
  const joinKnown = new Set((community.memberJoins || []).map((j) => j.userId.toString()));
  const toAdd = bulkUsers.filter((u) => !memberSet.has(u._id.toString()));

  const baseTime = Date.now();
  for (let i = 0; i < toAdd.length; i++) {
    const uid = toAdd[i]._id;
    community.members.push(uid);
    if (!joinKnown.has(uid.toString())) {
      community.memberJoins.push({
        userId: uid,
        joinedAt: new Date(baseTime - (toAdd.length - i) * 60000),
      });
    }
  }

  community.memberCount = community.members.length;
  community.markModified('members');
  community.markModified('memberJoins');
  await community.save();

  if (toAdd.length > 0) {
    await User.updateMany(
      { _id: { $in: toAdd.map((u) => u._id) } },
      { $addToSet: { joinedCommunities: community._id } }
    );
  }

  const samples = personas.slice(0, 5).map((p) => `@${p.username} (${p.fullName})`);

  console.log('\nDone.');
  console.log(`  Users created: ${createdUsers}`);
  console.log(`  Users already existed: ${skippedUsers}`);
  console.log(`  Added to @${handle}: ${toAdd.length}`);
  console.log(`  Total members now: ${community.memberCount}`);
  console.log(`\n  Login password (all bulk users): ${BULK_PASSWORD}`);
  console.log(`  Examples: ${samples.join(', ')}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

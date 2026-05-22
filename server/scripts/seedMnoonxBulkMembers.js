/**
 * Create 300 bulk users and add them to community @mnoonx.
 *
 * Usage (from server/):
 *   node scripts/seedMnoonxBulkMembers.js
 *   node scripts/seedMnoonxBulkMembers.js --count=300
 *   node scripts/seedMnoonxBulkMembers.js --handle=mnoonx
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');

const DEFAULT_HANDLE = 'mnoonx';
const DEFAULT_COUNT = 300;
const BULK_PASSWORD = 'BulkMember2024!';
const EMAIL_DOMAIN = 'bulk.seed.mnoonx.dev';

function parseArg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.split('=').slice(1).join('=');
}

async function main() {
  const handle = String(parseArg('handle', DEFAULT_HANDLE)).toLowerCase();
  const count = Math.min(Math.max(parseInt(parseArg('count', String(DEFAULT_COUNT)), 10) || DEFAULT_COUNT, 1), 2000);

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
  console.log(`Creating up to ${count} users (${EMAIL_DOMAIN})...\n`);

  const passwordHash = await bcrypt.hash(BULK_PASSWORD, 10);
  let createdUsers = 0;
  let skippedUsers = 0;

  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(3, '0');
    const username = `mnoonx_u${num}`;
    const email = `${username}@${EMAIL_DOMAIN}`;

    const exists = await User.findOne({ $or: [{ username }, { email }] }).select('_id');
    if (exists) {
      skippedUsers += 1;
      continue;
    }

    await User.create({
      username,
      email,
      password: passwordHash,
      fullName: `MNOONX Member ${num}`,
      bio: 'MNOONX community member.',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(`M${num}`)}&background=315efb&color=fff&size=128&bold=true`,
    });
    createdUsers += 1;
    if (createdUsers % 50 === 0) {
      console.log(`  users created: ${createdUsers}`);
    }
  }

  const bulkUsers = await User.find({ email: new RegExp(`@${EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i') })
    .select('_id')
    .limit(count);

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

  console.log('\nDone.');
  console.log(`  Users created: ${createdUsers}`);
  console.log(`  Users already existed: ${skippedUsers}`);
  console.log(`  Added to @${handle}: ${toAdd.length}`);
  console.log(`  Total members now: ${community.memberCount}`);
  console.log(`\n  Login password (all bulk users): ${BULK_PASSWORD}`);
  console.log(`  Example: mnoonx_u001@${EMAIL_DOMAIN}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

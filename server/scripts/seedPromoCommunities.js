/**
 * Create private promo communities (from generateMay21Posts) with join codes.
 *
 * Usage (from server/):
 *   node scripts/seedPromoCommunities.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const { COMMUNITIES } = require('./generateMay21Posts');

const OWNER_USERNAME = 'cryptoalpha';

/** handle → join passphrase (share with testers) */
const JOIN_CODES = {
  'memecoin-lab': 'MEMELAB26',
  'defi-perps-hub': 'DEFIPERPS26',
  'btc-macro-desk': 'BTCMACRO26',
  'sol-degen-zone': 'SOLDEGEN26',
  'trading-floor': 'TRADEFLOOR26',
  'yield-masters': 'YIELD26',
  'perp-academy': 'PERPS26',
  'onchain-radar': 'ONCHAIN26',
};

const CATEGORY_BY_HANDLE = {
  'memecoin-lab': 'Memecoins',
  'defi-perps-hub': 'DeFi',
  'btc-macro-desk': 'Futures',
  'sol-degen-zone': 'Memecoins',
  'trading-floor': 'Futures',
  'yield-masters': 'DeFi',
  'perp-academy': 'Futures',
  'onchain-radar': 'On-Chain',
};

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  let owner = await User.findOne({ username: OWNER_USERNAME });
  if (!owner) {
    const anySeed = await User.findOne({ email: /@seed\.mnoonx\.dev$/i });
    owner = anySeed;
  }
  if (!owner) {
    console.error(`Owner @${OWNER_USERNAME} not found. Run npm run seed:feed first.`);
    process.exit(1);
  }

  const extraMembers = await User.find({ email: /@seed\.mnoonx\.dev$/i })
    .limit(8)
    .select('_id');
  const memberIds = [
    owner._id,
    ...extraMembers.map((u) => u._id).filter((id) => !id.equals(owner._id)),
  ].slice(0, 5);

  console.log(`Owner: @${owner.username} (${owner._id})\n`);

  let created = 0;
  let updated = 0;

  for (const spec of COMMUNITIES) {
    const handle = spec.handle.toLowerCase();
    const joinCode = JOIN_CODES[handle] || `${handle.replace(/-/g, '').slice(0, 8).toUpperCase()}26`;
    const existing = await Community.findOne({ handle });

    const payload = {
      name: spec.name,
      handle,
      description: `${spec.topic}.`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(spec.name)}&background=111827&color=fff&size=128&bold=true`,
      banner: '',
      owner: owner._id,
      members: memberIds,
      memberCount: memberIds.length,
      memberJoins: memberIds.map((id, i) => ({
        userId: id,
        joinedAt: new Date(Date.now() - (memberIds.length - i) * 86400000),
      })),
      category: CATEGORY_BY_HANDLE[handle] || 'Other',
      isPublic: false,
      joinCode,
      isPaid: false,
      price: 0,
      membersCanPost: true,
    };

    if (existing) {
      existing.name = payload.name;
      existing.description = payload.description;
      existing.isPublic = false;
      existing.joinCode = joinCode;
      existing.category = payload.category;
      if (String(existing.owner) !== String(owner._id)) {
        existing.owner = owner._id;
      }
      existing.markModified('memberJoins');
      await existing.save();
      updated += 1;
      console.log(`~ updated @${handle}  joinCode: ${joinCode}`);
    } else {
      const comm = new Community(payload);
      await comm.save();
      await User.findByIdAndUpdate(owner._id, {
        $addToSet: { ownedCommunities: comm._id, joinedCommunities: comm._id },
      });
      for (const mid of memberIds) {
        if (mid.equals(owner._id)) continue;
        await User.findByIdAndUpdate(mid, {
          $addToSet: { joinedCommunities: comm._id },
        });
      }
      created += 1;
      console.log(`+ created @${handle}  joinCode: ${joinCode}`);
    }
  }

  console.log(`\nDone. Created: ${created}, updated: ${updated}`);
  console.log('\nJoin codes:');
  for (const spec of COMMUNITIES) {
    const handle = spec.handle.toLowerCase();
    console.log(`  /community/${handle}  →  ${JOIN_CODES[handle]}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

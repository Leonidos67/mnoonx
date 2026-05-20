/**
 * Delete duplicate seed posts stuck on 21 May 2026 (local time).
 * Usage: node scripts/deleteMay21Posts.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

const MAY21_START = new Date(2026, 4, 21, 0, 0, 0, 0);
const MAY22_START = new Date(2026, 4, 22, 0, 0, 0, 0);

const CONTENT_MARKERS = [
  'Утренний срез: BTC $95.2k',
  'CPI на этой неделе — главный катализатор',
  'На SOL снова всплеск новых тикеров',
  'Закрыл половину позиции по BTC на локальном хае',
  'Стейблы: чистый приток в USDC за 7 дней',
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const candidates = await Post.find({
    createdAt: { $gte: MAY21_START, $lt: MAY22_START },
  }).select('author content createdAt');

  const toDelete = candidates.filter((p) =>
    CONTENT_MARKERS.some((marker) => p.content.includes(marker))
  );

  console.log(`Found ${candidates.length} posts on 21 May, ${toDelete.length} match the 5 RU feed posts.`);
  for (const p of toDelete) {
    console.log(`  - ${p.createdAt.toLocaleString('ru-RU')}: ${p.content.slice(0, 70)}...`);
  }

  if (toDelete.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const authorIds = [...new Set(toDelete.map((p) => p.author))];
  const res = await Post.deleteMany({ _id: { $in: toDelete.map((p) => p._id) } });
  console.log(`Deleted: ${res.deletedCount}`);

  for (const aid of authorIds) {
    const count = await Post.countDocuments({ author: aid });
    await User.findByIdAndUpdate(aid, { postsCount: count });
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

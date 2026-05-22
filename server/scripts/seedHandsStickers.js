/**
 * Seed Hands sticker pack. Run: node server/scripts/seedHandsStickers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { ensureHandsStickerPack } = require('../services/stickers');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mnoonx';
  await mongoose.connect(uri);
  const pack = await ensureHandsStickerPack();
  console.log('Hands sticker pack ready:', pack.slug, pack._id.toString());
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

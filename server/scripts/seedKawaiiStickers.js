/**
 * Seed default Kawaii sticker pack. Run: node server/scripts/seedKawaiiStickers.js
 * Requires MONGO_URI in server/.env
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { ensureKawaiiStickerPack } = require('../services/stickers');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mnoonx';
  await mongoose.connect(uri);
  const pack = await ensureKawaiiStickerPack();
  console.log('Kawaii sticker pack ready:', pack.slug, pack._id.toString());
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

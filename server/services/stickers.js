const StickerPack = require('../models/StickerPack');
const Sticker = require('../models/Sticker');
const UserStickerPack = require('../models/UserStickerPack');

const HANDS_PACK = {
  slug: 'hands',
  name: 'Hands',
  sortOrder: 1,
  stickers: [
    { slug: 'call-me-left', imageUrl: 'https://i.ibb.co/rG5qhNJj/Call-Me-Left-Hand.png', sortOrder: 0 },
    { slug: 'pointing-down-left', imageUrl: 'https://i.ibb.co/XrCJQvj1/Pointing-Down-Left-Hand.png', sortOrder: 1 },
    { slug: 'pointing-up-right', imageUrl: 'https://i.ibb.co/FkF16dfm/Pointing-Up-Right-Hand.png', sortOrder: 2 },
    { slug: 'rock-on-left', imageUrl: 'https://i.ibb.co/k637QtCD/Rock-On-Left-Hand.png', sortOrder: 3 },
    { slug: 'scrolling-phone-right', imageUrl: 'https://i.ibb.co/vxND3xrk/Scrolling-Phone-with-Right-Hand.png', sortOrder: 4 },
    { slug: 'thumbs-up-right', imageUrl: 'https://i.ibb.co/PZNM1rM4/Thumbs-Up-Right-Hand.png', sortOrder: 5 },
  ],
};

const KAWAII_PACK = {
  slug: 'kawaii',
  name: 'Kawaii',
  stickers: [
    { slug: 'cookie', imageUrl: 'https://i.ibb.co/jkXVvHmh/image-Photoroom.png', sortOrder: 0 },
    { slug: 'cream-blob', imageUrl: 'https://i.ibb.co/nSWKJ8Y/image-Photoroom-1.png', sortOrder: 1 },
    { slug: 'croissant', imageUrl: 'https://i.ibb.co/9kQ5nLQf/image-Photoroom-2.png', sortOrder: 2 },
    { slug: 'star', imageUrl: 'https://i.ibb.co/0pjkBpzY/image-Photoroom-4.png', sortOrder: 3 },
    { slug: 'yell-monster', imageUrl: 'https://i.ibb.co/fGN5CKNv/image-Photoroom-3.png', sortOrder: 4 },
    { slug: 'cheese', imageUrl: 'https://i.ibb.co/tp6Rgyvk/image-Photoroom-5.png', sortOrder: 5 },
    { slug: 'popsicle', imageUrl: 'https://i.ibb.co/1fn11rbC/image-Photoroom-6.png', sortOrder: 6 },
    { slug: 'pudding', imageUrl: 'https://i.ibb.co/DPKKYCVr/image-Photoroom-7.png', sortOrder: 7 },
    { slug: 'ghost', imageUrl: 'https://i.ibb.co/mrZyN19r/image-Photoroom-1.png', sortOrder: 8 },
  ],
};

async function upsertStickerPackDefinition(definition) {
  let pack = await StickerPack.findOne({ slug: definition.slug });
  if (!pack) {
    pack = await StickerPack.create({
      slug: definition.slug,
      name: definition.name,
      isDefault: Boolean(definition.isDefault),
      sortOrder: definition.sortOrder ?? 0,
    });
  } else {
    pack.name = definition.name;
    if (definition.sortOrder != null) pack.sortOrder = definition.sortOrder;
    if (definition.isDefault != null) pack.isDefault = Boolean(definition.isDefault);
    await pack.save();
  }

  for (const item of definition.stickers) {
    await Sticker.findOneAndUpdate(
      { packId: pack._id, slug: item.slug },
      { $set: { imageUrl: item.imageUrl, sortOrder: item.sortOrder } },
      { upsert: true, new: true }
    );
  }

  return pack;
}

async function ensureHandsStickerPack() {
  return upsertStickerPackDefinition(HANDS_PACK);
}

async function ensureKawaiiStickerPack() {
  let pack = await StickerPack.findOne({ slug: KAWAII_PACK.slug });
  if (!pack) {
    pack = await StickerPack.create({
      slug: KAWAII_PACK.slug,
      name: KAWAII_PACK.name,
      isDefault: true,
      sortOrder: 0,
    });
  } else if (!pack.isDefault) {
    pack.isDefault = true;
    pack.name = KAWAII_PACK.name;
    await pack.save();
  }

  for (const item of KAWAII_PACK.stickers) {
    await Sticker.findOneAndUpdate(
      { packId: pack._id, slug: item.slug },
      { $set: { imageUrl: item.imageUrl, sortOrder: item.sortOrder } },
      { upsert: true, new: true }
    );
  }

  return pack;
}

async function ensureUserDefaultStickerPacks(userId) {
  const pack = await ensureKawaiiStickerPack();
  await UserStickerPack.findOneAndUpdate(
    { userId, packId: pack._id },
    { $setOnInsert: { installedAt: new Date() } },
    { upsert: true }
  );
}

async function installStickerPackForUser(userId, packSlug) {
  const pack = await StickerPack.findOne({ slug: packSlug });
  if (!pack) return null;
  await UserStickerPack.findOneAndUpdate(
    { userId, packId: pack._id },
    { $setOnInsert: { installedAt: new Date() } },
    { upsert: true }
  );
  return pack;
}

async function getInstalledStickerPacksForUser(userId) {
  await ensureUserDefaultStickerPacks(userId);

  const installs = await UserStickerPack.find({ userId }).sort({ installedAt: 1 }).lean();
  const packIds = installs.map((i) => i.packId);
  if (packIds.length === 0) return [];

  const packs = await StickerPack.find({ _id: { $in: packIds } }).sort({ sortOrder: 1 }).lean();
  const stickers = await Sticker.find({ packId: { $in: packIds } })
    .sort({ sortOrder: 1 })
    .lean();

  const stickersByPack = new Map();
  stickers.forEach((s) => {
    const key = String(s.packId);
    if (!stickersByPack.has(key)) stickersByPack.set(key, []);
    stickersByPack.get(key).push({
      id: String(s._id),
      slug: s.slug,
      imageUrl: s.imageUrl,
      sortOrder: s.sortOrder,
    });
  });

  return packs.map((p) => ({
    id: String(p._id),
    slug: p.slug,
    name: p.name,
    stickers: stickersByPack.get(String(p._id)) || [],
  }));
}

module.exports = {
  ensureKawaiiStickerPack,
  ensureHandsStickerPack,
  ensureUserDefaultStickerPacks,
  installStickerPackForUser,
  getInstalledStickerPacksForUser,
};

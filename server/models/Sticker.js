const mongoose = require('mongoose');

const StickerSchema = new mongoose.Schema({
  packId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StickerPack',
    required: true,
    index: true,
  },
  slug: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

StickerSchema.index({ packId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Sticker', StickerSchema);

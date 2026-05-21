const mongoose = require('mongoose');

const UserStickerPackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  packId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StickerPack',
    required: true,
    index: true,
  },
  installedAt: { type: Date, default: Date.now },
});

UserStickerPackSchema.index({ userId: 1, packId: 1 }, { unique: true });

module.exports = mongoose.model('UserStickerPack', UserStickerPackSchema);

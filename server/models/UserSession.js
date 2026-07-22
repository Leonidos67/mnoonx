const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    tokenId: { type: String, required: true, unique: true },
    userAgent: { type: String, default: '', maxlength: 300 },
    ip: { type: String, default: '', maxlength: 64 },
    lastActiveAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSessionSchema.index({ userId: 1, revokedAt: 1, lastActiveAt: -1 });

module.exports = mongoose.model('UserSession', userSessionSchema);

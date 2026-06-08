const mongoose = require('mongoose');

const PortfolioWalletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    address: { type: String, required: true, trim: true },
    chain: { type: String, required: true, trim: true },
    label: { type: String, default: '', maxlength: 80 },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PortfolioWalletSchema.index({ user: 1, address: 1, chain: 1 }, { unique: true });

module.exports = mongoose.model('PortfolioWallet', PortfolioWalletSchema);

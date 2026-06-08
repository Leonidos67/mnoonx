const mongoose = require('mongoose');

const PortfolioHoldingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coinId: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    avgBuyPriceUsd: { type: Number, default: null },
    source: {
      type: String,
      enum: ['manual', 'wallet'],
      default: 'manual',
    },
    /** Last known USD price from TON API (jettons) when CoinGecko id is unknown */
    livePriceUsd: { type: Number, default: null },
    imageUrl: { type: String, default: '' },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioWallet', default: null },
    txType: { type: String, enum: ['buy', 'sell', 'transfer', 'sync'], default: 'buy' },
    txDate: { type: Date, default: () => new Date() },
    notes: { type: String, default: '', maxlength: 500 },
    contractAddress: { type: String, default: '' },
    chain: { type: String, default: '' },
  },
  { timestamps: true }
);

PortfolioHoldingSchema.index({ user: 1, source: 1 });
PortfolioHoldingSchema.index(
  { user: 1, wallet: 1, coinId: 1, contractAddress: 1, chain: 1 },
  { unique: true, partialFilterExpression: { source: 'wallet', wallet: { $type: 'objectId' } } }
);

module.exports = mongoose.model('PortfolioHolding', PortfolioHoldingSchema);

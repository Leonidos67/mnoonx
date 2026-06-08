const express = require('express');
const auth = require('../middleware/auth');
const PortfolioHolding = require('../models/PortfolioHolding');
const PortfolioWallet = require('../models/PortfolioWallet');
const {
  isTonAddress,
  normalizeAddress,
  getSupportedNetworks,
  fetchTonWalletBalances,
} = require('../services/walletBalance');
const portfolioService = require('../services/portfolioService');

const router = express.Router();

function requireUser(req, res) {
  if (!req.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }
  return true;
}

// @route GET /api/portfolio/networks
router.get('/networks', (_req, res) => {
  res.json({ networks: getSupportedNetworks() });
});

// @route GET /api/portfolio/overview
router.get('/overview', auth, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const data = await portfolioService.buildOverview(req.userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/portfolio/holdings
router.post('/holdings', auth, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const { coinId, symbol, name, amount, avgBuyPriceUsd, txType, txDate, notes } = req.body;
    const amt = Number(amount);
    if (!coinId || !symbol || !name || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Invalid holding data' });
    }
    const holding = await PortfolioHolding.create({
      user: req.userId,
      coinId: String(coinId).trim().slice(0, 80),
      symbol: String(symbol).trim().slice(0, 20),
      name: String(name).trim().slice(0, 120),
      amount: amt,
      avgBuyPriceUsd:
        avgBuyPriceUsd != null && Number(avgBuyPriceUsd) > 0 ? Number(avgBuyPriceUsd) : null,
      source: 'manual',
      txType: ['buy', 'sell', 'transfer'].includes(txType) ? txType : 'buy',
      txDate: txDate ? new Date(txDate) : new Date(),
      notes: String(notes || '').slice(0, 500),
    });
    res.status(201).json(holding.toObject());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PATCH /api/portfolio/holdings/:id
router.patch('/holdings/:id', auth, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const holding = await PortfolioHolding.findOne({ _id: req.params.id, user: req.userId });
    if (!holding) return res.status(404).json({ message: 'Holding not found' });
    if (holding.source !== 'manual') {
      return res.status(400).json({ message: 'Only manual holdings can be edited' });
    }
    const { amount, avgBuyPriceUsd, txType, txDate, notes } = req.body;
    if (amount !== undefined) {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: 'Invalid amount' });
      holding.amount = amt;
    }
    if (avgBuyPriceUsd !== undefined) {
      holding.avgBuyPriceUsd =
        avgBuyPriceUsd != null && Number(avgBuyPriceUsd) > 0 ? Number(avgBuyPriceUsd) : null;
    }
    if (txType !== undefined && ['buy', 'sell', 'transfer'].includes(txType)) holding.txType = txType;
    if (txDate !== undefined) holding.txDate = new Date(txDate);
    if (notes !== undefined) holding.notes = String(notes).slice(0, 500);
    await holding.save();
    res.json(holding.toObject());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route DELETE /api/portfolio/holdings/:id
router.delete('/holdings/:id', auth, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const result = await PortfolioHolding.deleteOne({ _id: req.params.id, user: req.userId });
    if (!result.deletedCount) return res.status(404).json({ message: 'Holding not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/portfolio/wallets
router.post('/wallets', auth, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const { address, label } = req.body;
    const normalized = normalizeAddress(address);
    if (!isTonAddress(normalized)) {
      return res.status(400).json({ message: 'Invalid TON wallet address' });
    }
    const { friendlyAddress } = await fetchTonWalletBalances(normalized);
    const canonical = friendlyAddress || normalized;
    const existing = await PortfolioWallet.findOne({
      user: req.userId,
      address: canonical,
      chain: 'ton',
    });
    if (existing) {
      return res.status(409).json({ message: 'Wallet already connected' });
    }
    const wallet = await PortfolioWallet.create({
      user: req.userId,
      address: canonical,
      chain: 'ton',
      label: String(label || '').slice(0, 80),
    });
    const overview = await portfolioService.syncWallet(req.userId, wallet._id);
    res.status(201).json({ wallet: wallet.toObject(), overview });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
});

// @route POST /api/portfolio/wallets/:id/sync
router.post('/wallets/:id/sync', auth, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const overview = await portfolioService.syncWallet(req.userId, req.params.id);
    res.json(overview);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
});

// @route DELETE /api/portfolio/wallets/:id
router.delete('/wallets/:id', auth, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const wallet = await PortfolioWallet.findOne({ _id: req.params.id, user: req.userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    await PortfolioHolding.deleteMany({ user: req.userId, wallet: wallet._id, source: 'wallet' });
    await wallet.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

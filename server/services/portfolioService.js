const PortfolioHolding = require('../models/PortfolioHolding');
const PortfolioWallet = require('../models/PortfolioWallet');
const { fetchTonWalletBalances } = require('./walletBalance');
async function getSimplePrices(coinIds) {
  const ids = [
    ...new Set(
      coinIds.filter(
        (id) => id && !String(id).startsWith('eth-token-') && !String(id).startsWith('ton-jetton-')
      )
    ),
  ];
  if (!ids.length) return {};
  const url = new URL('https://api.coingecko.com/api/v3/simple/price');
  url.searchParams.set('ids', ids.join(','));
  url.searchParams.set('vs_currencies', 'usd');
  url.searchParams.set('include_24hr_change', 'true');
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) return {};
  return res.json();
}

function enrichHolding(row, prices) {
  const price = prices[row.coinId]?.usd ?? row.livePriceUsd ?? null;
  const change24h = prices[row.coinId]?.usd_24h_change ?? null;
  const valueUsd = price != null ? row.amount * price : null;
  const costBasis =
    row.avgBuyPriceUsd != null && row.avgBuyPriceUsd > 0
      ? row.amount * row.avgBuyPriceUsd
      : null;
  const profitUsd = valueUsd != null && costBasis != null ? valueUsd - costBasis : null;
  const profitPct =
    profitUsd != null && costBasis != null && costBasis > 0
      ? (profitUsd / costBasis) * 100
      : null;
  return {
    ...row,
    priceUsd: price,
    change24h,
    valueUsd,
    costBasisUsd: costBasis,
    profitUsd,
    profitPct,
  };
}

async function buildOverview(userId) {
  const [holdings, wallets] = await Promise.all([
    PortfolioHolding.find({ user: userId }).sort({ updatedAt: -1 }).lean(),
    PortfolioWallet.find({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const coinIds = holdings.map((h) => h.coinId);
  const prices = await getSimplePrices(coinIds);
  const enriched = holdings.map((h) => enrichHolding(h, prices));

  const totalValueUsd = enriched.reduce((sum, h) => sum + (h.valueUsd || 0), 0);
  const totalCostUsd = enriched.reduce((sum, h) => sum + (h.costBasisUsd || 0), 0);
  const totalProfitUsd = totalCostUsd > 0 ? totalValueUsd - totalCostUsd : null;

  let weightedChange24h = null;
  const withValue = enriched.filter((h) => h.valueUsd != null && h.change24h != null);
  if (withValue.length && totalValueUsd > 0) {
    weightedChange24h =
      withValue.reduce((sum, h) => sum + (h.change24h * (h.valueUsd / totalValueUsd)), 0);
  }

  return {
    summary: {
      totalValueUsd,
      totalCostUsd: totalCostUsd || null,
      totalProfitUsd,
      change24h: weightedChange24h,
      holdingsCount: enriched.length,
      walletsCount: wallets.length,
    },
    holdings: enriched,
    wallets,
  };
}

async function syncWallet(userId, walletId) {
  const wallet = await PortfolioWallet.findOne({ _id: walletId, user: userId });
  if (!wallet) {
    const err = new Error('Wallet not found');
    err.status = 404;
    throw err;
  }

  const { friendlyAddress, holdings: list } = await fetchTonWalletBalances(wallet.address);
  if (friendlyAddress) {
    wallet.address = friendlyAddress;
  }
  const ops = [];

  for (const b of list) {
    ops.push(
      PortfolioHolding.findOneAndUpdate(
        {
          user: userId,
          source: 'wallet',
          wallet: wallet._id,
          coinId: b.coinId,
          contractAddress: b.contractAddress || '',
          chain: b.chain || wallet.chain,
        },
        {
          $set: {
            symbol: b.symbol,
            name: b.name,
            amount: b.amount,
            livePriceUsd: b.livePriceUsd ?? null,
            imageUrl: b.image || '',
            txType: 'sync',
            txDate: new Date(),
          },
          $setOnInsert: {
            user: userId,
            source: 'wallet',
            wallet: wallet._id,
            coinId: b.coinId,
            contractAddress: b.contractAddress || '',
            chain: b.chain || wallet.chain,
          },
        },
        { upsert: true, new: true }
      )
    );
  }

  await Promise.all(ops);

  const syncedCoinKeys = new Set(
    list.map((b) => `${b.coinId}|${b.contractAddress || ''}|${b.chain || wallet.chain}`)
  );
  const existing = await PortfolioHolding.find({ user: userId, source: 'wallet', wallet: wallet._id });
  const toDelete = existing.filter(
    (h) => !syncedCoinKeys.has(`${h.coinId}|${h.contractAddress || ''}|${h.chain || wallet.chain}`)
  );
  if (toDelete.length) {
    await PortfolioHolding.deleteMany({ _id: { $in: toDelete.map((d) => d._id) } });
  }

  wallet.lastSyncedAt = new Date();
  await wallet.save();

  return buildOverview(userId);
}

module.exports = {
  buildOverview,
  syncWallet,
  enrichHolding,
  getSimplePrices,
};

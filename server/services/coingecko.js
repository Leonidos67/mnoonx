const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
/** Fresh TTL for CoinGecko responses */
const CACHE_TTL_MS = 3 * 60 * 1000;
/** Serve stale cache on 429 for up to this age */
const STALE_TTL_MS = 15 * 60 * 1000;
const MIN_REQUEST_GAP_MS = 350;

const cache = new Map();
const inFlight = new Map();
let lastRequestAt = 0;

function cacheKey(path, params) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${path}?${sorted}`;
}

function getCachedEntry(key) {
  return cache.get(key) || null;
}

function getCached(key, { allowStale = false } = {}) {
  const entry = getCachedEntry(key);
  if (!entry) return null;
  const age = Date.now() - entry.ts;
  if (age <= CACHE_TTL_MS) return entry.data;
  if (allowStale && age <= STALE_TTL_MS) return entry.data;
  if (age > STALE_TTL_MS) cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { ts: Date.now(), data });
}

async function waitForRateSlot() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_REQUEST_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_GAP_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

async function coingeckoFetch(path, params = {}) {
  const key = cacheKey(path, params);
  const fresh = getCached(key);
  if (fresh) return fresh;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const run = (async () => {
    await waitForRateSlot();

    const url = new URL(`${COINGECKO_BASE}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const stale = getCached(key, { allowStale: true });
      if (res.status === 429 && stale) {
        return stale;
      }
      const text = await res.text().catch(() => '');
      const err = new Error(
        res.status === 429
          ? `An error occurred on the server side. Error code: ${res.status}`
          : `An error occurred on the server side. Error code: ${res.status}`
      );
      err.status = res.status;
      err.body = text;
      throw err;
    }

    const data = await res.json();
    setCache(key, data);
    return data;
  })();

  inFlight.set(key, run);
  try {
    return await run;
  } finally {
    inFlight.delete(key);
  }
}

/**
 * @param {{ vs_currency?: string, order?: string, per_page?: number, page?: number }} [options]
 */
async function getMarkets(options = {}) {
  return coingeckoFetch('/coins/markets', {
    vs_currency: options.vs_currency || 'usd',
    order: options.order || 'market_cap_desc',
    per_page: Math.min(options.per_page || 100, 250),
    page: options.page || 1,
    sparkline: options.sparkline ? 'true' : 'false',
    price_change_percentage: options.price_change_percentage || '24h,7d',
  });
}

async function getGlobal() {
  return coingeckoFetch('/global');
}

/** @param {number} [days] */
async function getGlobalMarketCapChart(days = 7) {
  try {
    return await coingeckoFetch('/global/market_cap_chart', {
      days,
      vs_currency: 'usd',
    });
  } catch {
    return null;
  }
}

/**
 * Top coins with 7d hourly sparklines for index / cap history estimates.
 * @param {{ per_page?: number }} [options]
 */
async function getMarketsForStats(options = {}) {
  return coingeckoFetch('/coins/markets', {
    vs_currency: options.vs_currency || 'usd',
    order: 'market_cap_desc',
    per_page: Math.min(options.per_page || 50, 100),
    page: 1,
    sparkline: 'true',
    price_change_percentage: '24h,7d,30d,200d',
  });
}

/**
 * @param {string} query
 */
async function searchCoins(query) {
  const q = (query || '').trim();
  if (!q) return { coins: [], exchanges: [], icos: [], categories: [], nfts: [] };
  return coingeckoFetch('/search', { query: q });
}

/**
 * @param {string} id
 */
async function getCoinById(id) {
  const coinId = (id || '').trim().toLowerCase();
  if (!coinId) {
    const err = new Error('Coin id is required');
    err.status = 400;
    throw err;
  }
  return coingeckoFetch(`/coins/${encodeURIComponent(coinId)}`, {
    localization: 'false',
    tickers: 'false',
    market_data: 'true',
    community_data: 'false',
    developer_data: 'false',
    sparkline: 'false',
  });
}

async function getTrending() {
  return coingeckoFetch('/search/trending');
}

function mapMarketRow(c) {
  return {
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    image: c.image,
    current_price: c.current_price,
    market_cap: c.market_cap,
    market_cap_rank: c.market_cap_rank,
    total_volume: c.total_volume,
    price_change_percentage_24h: c.price_change_percentage_24h,
    price_change_percentage_7d: c.price_change_percentage_7d_in_currency?.usd ?? c.price_change_percentage_7d ?? null,
    high_24h: c.high_24h,
    low_24h: c.low_24h,
  };
}

function buildMarketsPayload(markets, trendingRaw) {
  const rows = (markets || []).map(mapMarketRow);

  const changes = rows
    .map((c) => c.price_change_percentage_24h)
    .filter((v) => typeof v === 'number');
  const avgChange24h =
    changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;

  const overview = {
    trackedCount: rows.length,
    totalMarketCap: rows.reduce((sum, c) => sum + (c.market_cap || 0), 0),
    totalVolume24h: rows.reduce((sum, c) => sum + (c.total_volume || 0), 0),
    avgChange24h,
    topGainers: [...rows]
      .filter((c) => typeof c.price_change_percentage_24h === 'number')
      .sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
      .slice(0, 5),
    topLosers: [...rows]
      .filter((c) => typeof c.price_change_percentage_24h === 'number')
      .sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0))
      .slice(0, 5),
  };

  const highTrust = rows
    .filter(
      (c) =>
        c.market_cap_rank &&
        c.market_cap_rank <= 50 &&
        (c.price_change_percentage_24h ?? 0) >= 0 &&
        (c.market_cap ?? 0) > 0
    )
    .sort((a, b) => (a.market_cap_rank ?? 999) - (b.market_cap_rank ?? 999))
    .slice(0, 8);

  const marketById = new Map(rows.map((c) => [c.id, c]));
  const trending = (trendingRaw?.coins || [])
    .slice(0, 8)
    .map((entry) => {
      const item = entry.item || entry;
      const fromMarkets = marketById.get(item.id);
      return {
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        image: item.small || item.thumb || item.large,
        market_cap_rank: item.market_cap_rank ?? fromMarkets?.market_cap_rank ?? null,
        current_price: fromMarkets?.current_price ?? null,
        price_change_percentage_24h: fromMarkets?.price_change_percentage_24h ?? null,
        score: entry.score ?? null,
      };
    });

  return {
    overview,
    markets: rows,
    highTrust,
    trending,
    disclaimer: 'This is not financial advice. DYOR.',
  };
}

function mapCoinDetail(coin) {
  const md = coin.market_data || {};
  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image?.large || coin.image?.small,
    description: (coin.description?.en || '').replace(/<[^>]+>/g, '').slice(0, 600),
    market_cap_rank: coin.market_cap_rank,
    current_price: md.current_price?.usd ?? null,
    market_cap: md.market_cap?.usd ?? null,
    total_volume: md.total_volume?.usd ?? null,
    high_24h: md.high_24h?.usd ?? null,
    low_24h: md.low_24h?.usd ?? null,
    price_change_percentage_24h: md.price_change_percentage_24h ?? null,
    price_change_percentage_7d: md.price_change_percentage_7d_in_currency?.usd ?? null,
    price_change_percentage_30d: md.price_change_percentage_30d_in_currency?.usd ?? null,
    ath: md.ath?.usd ?? null,
    ath_change_percentage: md.ath_change_percentage?.usd ?? null,
    circulating_supply: md.circulating_supply ?? null,
    total_supply: md.total_supply ?? null,
    homepage: coin.links?.homepage?.[0] || null,
    disclaimer: 'This is not financial advice. DYOR.',
  };
}

module.exports = {
  getMarkets,
  getMarketsForStats,
  searchCoins,
  getCoinById,
  getTrending,
  getGlobal,
  getGlobalMarketCapChart,
  buildMarketsPayload,
  mapCoinDetail,
};

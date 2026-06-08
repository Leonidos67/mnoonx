const express = require('express');
const router = express.Router();
const coingecko = require('../services/coingecko');
const aiAlpha = require('../services/aiAlpha');
const marketStats = require('../services/marketStats');

const marketsRouteCache = new Map();
const MARKETS_ROUTE_TTL_MS = 2 * 60 * 1000;

router.get('/markets', async (req, res) => {
  const vs = typeof req.query.vs_currency === 'string' ? req.query.vs_currency : 'usd';
  const perPage = Math.min(parseInt(req.query.per_page, 10) || 100, 250);
  const routeKey = `${vs}_${perPage}`;

  try {

    const cachedRoute = marketsRouteCache.get(routeKey);
    if (cachedRoute && Date.now() - cachedRoute.ts < MARKETS_ROUTE_TTL_MS) {
      return res.json(cachedRoute.data);
    }

    const markets = await coingecko.getMarkets({
      vs_currency: vs,
      per_page: perPage,
      sparkline: true,
      price_change_percentage: '1h,24h,7d,30d,200d',
    });

    const [trending, global, fearGreed] = await Promise.all([
      coingecko.getTrending().catch(() => ({ coins: [] })),
      coingecko.getGlobal().catch(() => null),
      marketStats.fetchFearGreed(),
    ]);

    const payload = coingecko.buildMarketsPayload(markets, trending, global);
    const body = {
      ...payload,
      marketStats: marketStats.buildMarketStats({
        coinsWithSparkline: (markets || []).slice(0, 50),
        global,
        globalCapChart: null,
        fearGreed,
      }),
    };

    marketsRouteCache.set(routeKey, { ts: Date.now(), data: body });
    res.json(body);
  } catch (err) {
    console.error('GET /api/ai/markets', err);
    const stale = marketsRouteCache.get(routeKey);
    if (err.status === 429 && stale) {
      return res.json(stale.data);
    }
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      message: err.message || 'Failed to load market data',
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (!q.trim()) {
      return res.json({ coins: [], disclaimer: 'This is not financial advice. DYOR.' });
    }

    const data = await coingecko.searchCoins(q);
    const coins = (data.coins || []).slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      thumb: c.thumb,
      large: c.large,
      market_cap_rank: c.market_cap_rank ?? null,
    }));

    res.json({
      coins,
      disclaimer: 'This is not financial advice. DYOR.',
    });
  } catch (err) {
    console.error('GET /api/ai/search', err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      message: err.message || 'Search failed',
    });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, mode, previousResponse, coinContext, locale } = req.body || {};
    const resolvedMode =
      mode === 'rewrite' ? 'rewrite' : mode === 'coin_analyze' ? 'coin_analyze' : 'analyze';
    const result = await aiAlpha.runChat({
      message,
      mode: resolvedMode,
      previousResponse,
      coinContext,
      locale: locale === 'ru' ? 'ru' : 'en',
    });
    res.json(result);
  } catch (err) {
    console.error('POST /api/ai/chat', err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      message: err.message || 'AI chat failed',
    });
  }
});

const pulseRouteCache = { data: null, ts: 0 };
const PULSE_ROUTE_TTL_MS = 90 * 1000;

router.get('/pulse', async (req, res) => {
  try {
    if (pulseRouteCache.data && Date.now() - pulseRouteCache.ts < PULSE_ROUTE_TTL_MS) {
      return res.json(pulseRouteCache.data);
    }
    const result = await aiAlpha.runPulse();
    pulseRouteCache.data = result;
    pulseRouteCache.ts = Date.now();
    res.json(result);
  } catch (err) {
    console.error('GET /api/ai/pulse', err);
    if (pulseRouteCache.data) {
      return res.json(pulseRouteCache.data);
    }
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      message: err.message || 'AI pulse failed',
    });
  }
});

router.get('/coins/:id', async (req, res) => {
  try {
    const coin = await coingecko.getCoinById(req.params.id);
    res.json(coingecko.mapCoinDetail(coin));
  } catch (err) {
    console.error('GET /api/ai/coins/:id', err);
    if (err.status === 400) {
      return res.status(400).json({ message: err.message });
    }
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      message: err.message || 'Failed to load coin',
    });
  }
});

module.exports = router;

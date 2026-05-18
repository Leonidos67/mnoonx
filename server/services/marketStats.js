const FNG_URL = 'https://api.alternative.me/fng/?limit=1';
const CMC20_DISPLAY_BASE = 157.76;

const FNG_LABEL_RU = {
  'Extreme Fear': 'Сильный страх',
  Fear: 'Страх',
  Neutral: 'Нейтрально',
  Greed: 'Жадность',
  'Extreme Greed': 'Сильная жадность',
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function downsampleSeries(values, targetPoints = 36) {
  if (!values.length) return [];
  if (values.length <= targetPoints) return values;
  const out = [];
  const step = (values.length - 1) / (targetPoints - 1);
  for (let i = 0; i < targetPoints; i += 1) {
    const idx = Math.round(i * step);
    out.push(values[Math.min(idx, values.length - 1)]);
  }
  return out;
}

function changeFromSeries(values, lookbackPoints = 24) {
  if (values.length < 2) return 0;
  const last = values[values.length - 1];
  const prevIdx = Math.max(0, values.length - 1 - lookbackPoints);
  const prev = values[prevIdx];
  if (!prev || !last) return 0;
  return ((last - prev) / prev) * 100;
}

function extractSparklinePrices(coin) {
  const raw = coin?.sparkline_in_7d?.price;
  if (!Array.isArray(raw)) return [];
  return raw.filter((p) => typeof p === 'number' && Number.isFinite(p) && p > 0);
}

/**
 * Estimate total market cap time series from top coins' 7d price sparklines.
 * @param {object[]} coinsRaw
 */
function buildMarketCapSeriesFromCoins(coinsRaw) {
  const top = (coinsRaw || []).filter(
    (c) => c.market_cap_rank != null && c.market_cap_rank <= 50 && c.market_cap && c.market_cap > 0
  );
  if (!top.length) return [];

  const withPrices = top
    .map((c) => ({ coin: c, prices: extractSparklinePrices(c) }))
    .filter((x) => x.prices.length >= 8);
  if (!withPrices.length) return [];

  const len = Math.min(...withPrices.map((x) => x.prices.length));
  const totals = [];

  for (let i = 0; i < len; i += 1) {
    let sum = 0;
    for (const { coin, prices } of withPrices) {
      const last = prices[prices.length - 1];
      const cap = coin.market_cap || 0;
      sum += cap * (prices[i] / last);
    }
    totals.push(sum);
  }

  return totals;
}

function parseGlobalCapChart(chartData) {
  const pairs = chartData?.market_cap_chart?.market_cap;
  if (!Array.isArray(pairs) || !pairs.length) return null;
  const values = pairs
    .map((row) => (Array.isArray(row) ? row[1] : row))
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  return values.length >= 2 ? values : null;
}

/**
 * CMC20-style cap-weighted index from top 20 (scaled to ~$157 display).
 */
function buildCmc20Series(coinsRaw) {
  const top20 = (coinsRaw || [])
    .filter((c) => c.market_cap_rank != null && c.market_cap_rank <= 20)
    .sort((a, b) => (a.market_cap_rank ?? 99) - (b.market_cap_rank ?? 99));

  const weighted = top20
    .map((c) => ({
      weight: c.market_cap || 0,
      prices: extractSparklinePrices(c),
    }))
    .filter((x) => x.weight > 0 && x.prices.length >= 8);

  if (!weighted.length) {
    return { value: CMC20_DISPLAY_BASE, change24h: 0, sparkline: [] };
  }

  const len = Math.min(...weighted.map((x) => x.prices.length));
  const indexSeries = [];

  for (let i = 0; i < len; i += 1) {
    let wSum = 0;
    let pSum = 0;
    for (const { weight, prices } of weighted) {
      const anchor = prices[prices.length - 1];
      wSum += weight;
      pSum += weight * (prices[i] / anchor);
    }
    const normalized = wSum > 0 ? pSum / wSum : 1;
    indexSeries.push(normalized);
  }

  const lastNorm = indexSeries[indexSeries.length - 1] || 1;
  const scaled = indexSeries.map((n) => CMC20_DISPLAY_BASE * (n / lastNorm));
  const change24h = changeFromSeries(scaled, 24);

  return {
    value: scaled[scaled.length - 1] ?? CMC20_DISPLAY_BASE,
    change24h,
    sparkline: downsampleSeries(scaled),
  };
}

function computeRsi(prices, period = 14) {
  if (prices.length < period + 2) return null;

  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i += 1) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function buildAverageRsi(coinsRaw) {
  const top = (coinsRaw || []).filter((c) => c.market_cap_rank != null && c.market_cap_rank <= 50);
  const rsiValues = [];

  for (const coin of top) {
    const prices = extractSparklinePrices(coin);
    const rsi = computeRsi(prices);
    if (rsi != null) rsiValues.push(rsi);
  }

  if (!rsiValues.length) {
    return { value: 50, label: 'Neutral' };
  }

  const avg = rsiValues.reduce((a, b) => a + b, 0) / rsiValues.length;
  let label = 'Neutral';
  if (avg < 35) label = 'Oversold';
  else if (avg > 65) label = 'Overbought';

  return { value: Math.round(avg * 100) / 100, label };
}

function pctField(coin, key) {
  const flat = coin[`price_change_percentage_${key}`];
  const nested = coin[`price_change_percentage_${key}_in_currency`];
  if (typeof flat === 'number') return flat;
  if (nested && typeof nested.usd === 'number') return nested.usd;
  return null;
}

function buildAltseason(coinsRaw) {
  const btc = (coinsRaw || []).find((c) => c.symbol === 'btc');
  const btcPerf =
    pctField(btc, '200d') ?? pctField(btc, '30d') ?? btc?.price_change_percentage_24h ?? 0;

  const alts = (coinsRaw || []).filter(
    (c) => c.symbol !== 'btc' && c.market_cap_rank != null && c.market_cap_rank <= 100
  );

  const outperform = alts.filter((a) => {
    const altPerf =
      pctField(a, '200d') ?? pctField(a, '30d') ?? a.price_change_percentage_24h ?? 0;
    return altPerf > btcPerf;
  }).length;

  const score = alts.length ? Math.round((outperform / alts.length) * 100) : 50;

  return {
    score,
    label:
      score >= 75 ? 'Altcoin Season' : score <= 25 ? 'Bitcoin Season' : 'Neutral',
  };
}

async function fetchFearGreed() {
  try {
    const res = await fetch(FNG_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const row = data?.data?.[0];
    if (!row) return null;
    const en = row.value_classification || 'Neutral';
    return {
      value: parseInt(row.value, 10),
      label: FNG_LABEL_RU[en] || en,
    };
  } catch {
    return null;
  }
}

/**
 * @param {{ coinsWithSparkline: object[], global: object | null, globalCapChart: object | null, fearGreed: object | null }} input
 */
function buildMarketStats(input) {
  const { coinsWithSparkline, global, globalCapChart, fearGreed } = input;

  let capSeries = parseGlobalCapChart(globalCapChart);
  if (!capSeries) {
    capSeries = buildMarketCapSeriesFromCoins(coinsWithSparkline);
  }

  const totalMarketCap =
    global?.data?.total_market_cap?.usd ??
    (capSeries?.length ? capSeries[capSeries.length - 1] : 0);

  const marketCapChange24h =
    typeof global?.data?.market_cap_change_percentage_24h_usd === 'number'
      ? global.data.market_cap_change_percentage_24h_usd
      : changeFromSeries(capSeries || [], 24);

  const capSparkline = downsampleSeries(capSeries || []);

  const cmc20 = buildCmc20Series(coinsWithSparkline);

  return {
    marketCap: {
      value: totalMarketCap,
      change24h: marketCapChange24h,
      sparkline: capSparkline,
    },
    cmc20,
    fearGreed: fearGreed || { value: 50, label: 'Нейтрально' },
    altseason: buildAltseason(coinsWithSparkline),
    avgRsi: buildAverageRsi(coinsWithSparkline),
  };
}

module.exports = {
  fetchFearGreed,
  buildMarketStats,
};

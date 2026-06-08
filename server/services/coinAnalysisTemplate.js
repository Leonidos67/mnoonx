const LABELS = {
  en: {
    title: (name, symbol) => `Analysis — ${name} (${symbol})`,
    marketData: 'Market data',
    price: 'Price',
    rank: 'Market cap rank',
    change1h: '1h change',
    change24h: '24h change',
    change7d: '7d change',
    change30d: '30d change',
    marketCap: 'Market cap',
    volume24h: '24h volume',
    range24h: '24h range',
    volMcapRatio: 'Volume / market cap',
    supply: 'Circulating supply',
    totalSupply: 'Total supply',
    ath: 'All-time high',
    fromAth: 'From ATH',
    overview: 'Overview',
    disclaimer: 'Not financial advice. DYOR.',
  },
  ru: {
    title: (name, symbol) => `Анализ — ${name} (${symbol})`,
    marketData: 'Рыночные данные',
    price: 'Цена',
    rank: 'Рейтинг по капитализации',
    change1h: 'Изменение за 1ч',
    change24h: 'Изменение за 24ч',
    change7d: 'Изменение за 7д',
    change30d: 'Изменение за 30д',
    marketCap: 'Рыночная капитализация',
    volume24h: 'Объём за 24ч',
    range24h: 'Диапазон 24ч',
    volMcapRatio: 'Объём / капитализация',
    supply: 'В обращении',
    totalSupply: 'Всего',
    ath: 'Исторический максимум (ATH)',
    fromAth: 'От ATH',
    overview: 'Краткий обзор',
    disclaimer: 'Не является финансовой рекомендацией. DYOR.',
  },
};

function formatUsd(value, compact = false) {
  if (value == null || Number.isNaN(value)) return '—';
  if (compact) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  }
  if (value >= 1) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
}

function formatPct(value) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatSupply(value, symbol) {
  if (value == null || Number.isNaN(value)) return '—';
  const sym = symbol ? ` ${String(symbol).toUpperCase()}` : '';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T${sym}`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B${sym}`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M${sym}`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K${sym}`;
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}${sym}`;
}

function volMcapRatio(coin) {
  if (!coin.market_cap || !coin.total_volume || coin.market_cap <= 0) return '—';
  return `${((coin.total_volume / coin.market_cap) * 100).toFixed(2)}%`;
}

function range24h(coin) {
  if (coin.low_24h == null && coin.high_24h == null) return '—';
  return `${formatUsd(coin.low_24h)} – ${formatUsd(coin.high_24h)}`;
}

function buildCoinAnalysisTemplate(coin, locale = 'en') {
  const L = LABELS[locale === 'ru' ? 'ru' : 'en'];
  const sym = String(coin.symbol || '').toUpperCase();
  const lines = [
    `## ${L.title(coin.name, sym)}`,
    '',
    `### ${L.marketData}`,
    `- **${L.price}:** ${formatUsd(coin.current_price)}`,
    coin.market_cap_rank != null ? `- **${L.rank}:** #${coin.market_cap_rank}` : null,
    `- **${L.change1h}:** ${formatPct(coin.price_change_percentage_1h)}`,
    `- **${L.change24h}:** ${formatPct(coin.price_change_percentage_24h)}`,
    `- **${L.change7d}:** ${formatPct(coin.price_change_percentage_7d)}`,
    `- **${L.change30d}:** ${formatPct(coin.price_change_percentage_30d)}`,
    `- **${L.marketCap}:** ${formatUsd(coin.market_cap, true)}`,
    `- **${L.volume24h}:** ${formatUsd(coin.total_volume, true)}`,
    `- **${L.range24h}:** ${range24h(coin)}`,
    `- **${L.volMcapRatio}:** ${volMcapRatio(coin)}`,
    `- **${L.supply}:** ${formatSupply(coin.circulating_supply, coin.symbol)}`,
    coin.total_supply ? `- **${L.totalSupply}:** ${formatSupply(coin.total_supply, coin.symbol)}` : null,
    `- **${L.ath}:** ${formatUsd(coin.ath)} (${L.fromAth}: ${formatPct(coin.ath_change_percentage)})`,
    '',
  ];

  if (coin.description?.trim()) {
    lines.push(`### ${L.overview}`, coin.description.trim(), '');
  }

  return lines.filter(Boolean).join('\n');
}

module.exports = { buildCoinAnalysisTemplate };

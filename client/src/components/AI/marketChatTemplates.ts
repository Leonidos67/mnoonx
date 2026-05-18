import { formatPct, formatUsd } from './marketFormat';
import type { CoinMarketRow, MarketsResponse } from '../../types/ai';

const DISCLAIMER = 'Not financial advice. DYOR.';

const FEAR_GREED_EN: Record<string, string> = {
  'Сильный страх': 'Extreme Fear',
  Страх: 'Fear',
  Нейтрально: 'Neutral',
  Жадность: 'Greed',
  'Сильная жадность': 'Extreme Greed',
  'Extreme Fear': 'Extreme Fear',
  Fear: 'Fear',
  Neutral: 'Neutral',
  Greed: 'Greed',
  'Extreme Greed': 'Extreme Greed',
};

const ALTSEASON_EN: Record<string, string> = {
  'Altcoin Season': 'Altcoin season',
  'Bitcoin Season': 'Bitcoin season',
  Neutral: 'Neutral',
  'Сезон альткоинов': 'Altcoin season',
  'Сезон Bitcoin': 'Bitcoin season',
  Нейтрально: 'Neutral',
};

const RSI_EN: Record<string, string> = {
  Oversold: 'Oversold',
  Overbought: 'Overbought',
  Neutral: 'Neutral',
  Перепроданность: 'Oversold',
  Перекупленность: 'Overbought',
  Нейтрально: 'Neutral',
};

function fearGreedLabel(label: string): string {
  return FEAR_GREED_EN[label] ?? label;
}

function altseasonLabel(label: string): string {
  return ALTSEASON_EN[label] ?? label;
}

function rsiLabel(label: string): string {
  return RSI_EN[label] ?? label;
}

function pickGainers(data: MarketsResponse): CoinMarketRow[] {
  const fromApi = data.overview?.topGainers ?? [];
  if (fromApi.length >= 3) return fromApi.slice(0, 8);
  return [...(data.markets ?? [])]
    .filter((c) => c.price_change_percentage_24h != null)
    .sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
    .slice(0, 8);
}

function pickLosers(data: MarketsResponse): CoinMarketRow[] {
  const fromApi = data.overview?.topLosers ?? [];
  if (fromApi.length >= 3) return fromApi.slice(0, 8);
  return [...(data.markets ?? [])]
    .filter((c) => c.price_change_percentage_24h != null)
    .sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0))
    .slice(0, 8);
}

function coinLines(coins: CoinMarketRow[]): string {
  if (!coins.length) return '_No data available._\n';
  return coins
    .map((c, i) => {
      const sym = c.symbol?.toUpperCase() ?? '—';
      return `${i + 1}. **${c.name}** (\`${sym}\`) — ${formatUsd(c.current_price)} · ${formatPct(c.price_change_percentage_24h)}`;
    })
    .join('\n');
}

export type MarketChatTemplateId = 'gainers' | 'losers' | 'overview';

export function buildMarketChatTemplate(
  id: MarketChatTemplateId,
  data: MarketsResponse
): string {
  const disclaimer = data.disclaimer?.includes('financial advice')
    ? data.disclaimer
    : DISCLAIMER;

  if (id === 'gainers') {
    const coins = pickGainers(data);
    return `## Top growth (24h)

Leading gainers among tracked assets right now. Momentum can fade quickly — check volume and broader market context before acting.

${coinLines(coins)}

---
_${disclaimer}_`;
  }

  if (id === 'losers') {
    const coins = pickLosers(data);
    return `## Top of the fall (24h)

Largest 24h declines in the tracked universe. Sharp drops may reflect profit-taking, news, or liquidity — not necessarily a long-term trend.

${coinLines(coins)}

---
_${disclaimer}_`;
  }

  const stats = data.marketStats;
  const ov = data.overview;
  const trending = (data.trending ?? []).slice(0, 6);

  const capLine = stats
    ? `**Market cap:** ${formatUsd(stats.marketCap.value, true)} (${formatPct(stats.marketCap.change24h)} 24h)`
    : `**Market cap (estimate):** ${formatUsd(ov?.totalMarketCap, true)}`;

  const extras = stats
    ? [
        `**Fear & Greed:** ${stats.fearGreed.value} — ${fearGreedLabel(stats.fearGreed.label)}`,
        `**Altseason index:** ${stats.altseason.score}/100 (${altseasonLabel(stats.altseason.label)})`,
        `**Average RSI:** ${stats.avgRsi.value.toFixed(1)} (${rsiLabel(stats.avgRsi.label)})`,
      ].join('\n')
    : `**Average 24h change:** ${formatPct(ov?.avgChange24h)}`;

  const trendingBlock =
    trending.length > 0
      ? `### Trending on CoinGecko\n${coinLines(trending)}`
      : '';

  return `## Market overview

High-level snapshot from live market data (CoinGecko). Use it for context — not as a trade signal.

${capLine}
${extras}
**24h volume:** ${formatUsd(ov?.totalVolume24h, true)}
**Coins tracked:** ${ov?.trackedCount ?? data.markets?.length ?? '—'}

${trendingBlock}

---
_${disclaimer}_`;
}

export const MARKET_CHAT_QUICK_ACTIONS: { id: MarketChatTemplateId; label: string }[] = [
  { id: 'gainers', label: 'Top growth' },
  { id: 'losers', label: 'Top of the fall' },
  { id: 'overview', label: 'Market overview' },
];

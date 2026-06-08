import { formatPct, formatSupply, formatUsd } from './marketFormat';
import type { CoinDetail } from '../../types/ai';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

function volMcapRatio(coin: CoinDetail): string {
  if (!coin.market_cap || !coin.total_volume || coin.market_cap <= 0) return '—';
  return `${((coin.total_volume / coin.market_cap) * 100).toFixed(2)}%`;
}

function range24h(coin: CoinDetail): string {
  if (coin.low_24h == null && coin.high_24h == null) return '—';
  return `${formatUsd(coin.low_24h)} – ${formatUsd(coin.high_24h)}`;
}

export function buildCoinChatTemplate(coin: CoinDetail, t: TranslateFn): string {
  const sym = coin.symbol.toUpperCase();
  const prefix = 'discover.coinPage.aiTemplate';

  const lines = [
    `## ${t(`${prefix}.title`, { name: coin.name, symbol: sym })}`,
    '',
    `### ${t(`${prefix}.marketData`)}`,
    `- **${t(`${prefix}.price`)}:** ${formatUsd(coin.current_price)}`,
    coin.market_cap_rank != null
      ? `- **${t(`${prefix}.rank`)}:** #${coin.market_cap_rank}`
      : null,
    `- **${t(`${prefix}.change1h`)}:** ${formatPct(coin.price_change_percentage_1h)}`,
    `- **${t(`${prefix}.change24h`)}:** ${formatPct(coin.price_change_percentage_24h)}`,
    `- **${t(`${prefix}.change7d`)}:** ${formatPct(coin.price_change_percentage_7d)}`,
    `- **${t(`${prefix}.change30d`)}:** ${formatPct(coin.price_change_percentage_30d)}`,
    `- **${t(`${prefix}.marketCap`)}:** ${formatUsd(coin.market_cap, true)}`,
    `- **${t(`${prefix}.volume24h`)}:** ${formatUsd(coin.total_volume, true)}`,
    `- **${t(`${prefix}.range24h`)}:** ${range24h(coin)}`,
    `- **${t(`${prefix}.volMcapRatio`)}:** ${volMcapRatio(coin)}`,
    `- **${t(`${prefix}.supply`)}:** ${formatSupply(coin.circulating_supply, coin.symbol)}`,
    coin.total_supply
      ? `- **${t(`${prefix}.totalSupply`)}:** ${formatSupply(coin.total_supply, coin.symbol)}`
      : null,
    `- **${t(`${prefix}.ath`)}:** ${formatUsd(coin.ath)} (${t(`${prefix}.fromAth`)}: ${formatPct(coin.ath_change_percentage)})`,
    '',
  ];

  if (coin.description?.trim()) {
    lines.push(
      `### ${t(`${prefix}.overview`)}`,
      coin.description.trim(),
      ''
    );
  }

  lines.push(`_${coin.disclaimer || t(`${prefix}.disclaimer`)}_`);

  return lines.filter((line) => line != null).join('\n');
}

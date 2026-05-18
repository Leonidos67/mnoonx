import React, { useMemo } from 'react';
import type { CoinMarketRow } from '../../types/ai';
import { formatPct } from '../AI/marketFormat';
import { heatmapChangeBg, heatmapTextOnBg } from './heatmapColors';

interface CoinHeatmapProps {
  coins: CoinMarketRow[];
  limit?: number;
  onSelect: (id: string, symbol: string, name: string) => void;
}

const CoinHeatmap: React.FC<CoinHeatmapProps> = ({ coins, limit = 40, onSelect }) => {
  const tiles = useMemo(() => {
    return [...coins]
      .filter((c) => c.market_cap != null && c.market_cap > 0)
      .sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0))
      .slice(0, limit);
  }, [coins, limit]);

  if (!tiles.length) {
    return <p className="py-8 text-center text-sm text-neutral-500">Нет данных для карты</p>;
  }

  const maxFlex = Math.sqrt(tiles[0]?.market_cap ?? 1);

  return (
    <div className="space-y-3">
      <div className="flex min-h-[280px] flex-wrap gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1">
        {tiles.map((coin) => {
          const change = coin.price_change_percentage_24h;
          const flexGrow = Math.max(1, Math.sqrt(coin.market_cap ?? 1) / maxFlex);
          const minW = coin.market_cap_rank != null && coin.market_cap_rank <= 3 ? 140 : 88;
          const minH =
            coin.market_cap_rank === 1
              ? 100
              : coin.market_cap_rank != null && coin.market_cap_rank <= 5
                ? 72
                : 56;

          return (
            <button
              key={coin.id}
              type="button"
              onClick={() => onSelect(coin.id, coin.symbol, coin.name)}
              style={{ flex: `${flexGrow} 1 ${minW}px`, minHeight: minH }}
              className={`relative flex flex-col justify-between overflow-hidden rounded-lg p-2 text-left transition hover:ring-2 hover:ring-black/20 ${heatmapChangeBg(change)} ${heatmapTextOnBg(change)}`}
              title={`${coin.name} — ${formatPct(change)}`}
            >
              <div className="flex items-center gap-1.5">
                <img src={coin.image} alt="" className="h-5 w-5 rounded-full bg-white/20 object-cover" />
                <span className="truncate text-xs font-bold uppercase">{coin.symbol}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatPct(change)}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-6 rounded bg-red-600" /> &lt; −5%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-6 rounded bg-neutral-500" /> 0%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-6 rounded bg-emerald-600" /> &gt; +5%
        </span>
        <span>Размер плитки ≈ рыночная капитализация · цвет = изменение 24ч</span>
      </div>
    </div>
  );
};

export default CoinHeatmap;

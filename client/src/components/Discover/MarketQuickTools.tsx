import React from 'react';
import {
  BarChart3,
  Flame,
  LayoutGrid,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import CoinHeatmap from './CoinHeatmap';
import { formatPct, formatUsd, pctClass } from '../AI/marketFormat';
import type { CoinMarketRow } from '../../types/ai';
import { useTranslation } from '../../i18n/useTranslation';

export type MarketQuickToolId = 'heatmap' | 'gainers' | 'losers' | 'trending' | 'volume';

interface TokenRowProps {
  coin: CoinMarketRow;
  onSelect: (id: string, symbol: string, name: string) => void;
  metric?: 'change' | 'volume';
}

const MarketTokenRow: React.FC<TokenRowProps> = ({ coin, onSelect, metric = 'change' }) => {
  const change = coin.price_change_percentage_24h;

  return (
    <button
      type="button"
      onClick={() => onSelect(coin.id, coin.symbol, coin.name)}
      className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50"
    >
      <span className="w-5 shrink-0 text-center text-xs font-medium tabular-nums text-slate-400">
        {coin.market_cap_rank ?? '—'}
      </span>
      <img src={coin.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{coin.name}</p>
        <p className="text-xs uppercase text-slate-500">{coin.symbol}</p>
      </div>
      <div className="shrink-0 text-right">
        {coin.current_price != null ? (
          <p className="text-sm font-medium tabular-nums text-slate-900">{formatUsd(coin.current_price)}</p>
        ) : null}
        {metric === 'volume' ? (
          <p className="text-xs font-semibold tabular-nums text-blue-700">
            {formatUsd(coin.total_volume ?? 0, true)}
          </p>
        ) : (
          <p className={`text-xs font-semibold tabular-nums ${pctClass(change)}`}>{formatPct(change)}</p>
        )}
      </div>
    </button>
  );
};

function panelTitle(id: MarketQuickToolId, t: (key: string) => string): string {
  switch (id) {
    case 'heatmap':
      return t('discover.marketTab.panelHeatmapTitle');
    case 'gainers':
      return t('discover.marketTab.panelGainersTitle');
    case 'losers':
      return t('discover.marketTab.panelLosersTitle');
    case 'trending':
      return t('discover.marketTab.panelTrendingTitle');
    case 'volume':
      return t('discover.marketTab.panelVolumeTitle');
  }
}

function panelDesc(id: MarketQuickToolId, t: (key: string) => string): string | null {
  switch (id) {
    case 'heatmap':
      return t('discover.marketTab.heatmapLegendDesc');
    case 'gainers':
    case 'losers':
      return t('discover.marketTab.panelListDesc24h');
    case 'trending':
      return t('discover.marketTab.panelTrendingDesc');
    case 'volume':
      return t('discover.marketTab.panelVolumeDesc');
  }
}

interface MarketQuickToolsSectionProps {
  activeTool: MarketQuickToolId;
  onSelectTool: (id: MarketQuickToolId) => void;
  onAskAlpha: () => void;
  allMarkets: CoinMarketRow[];
  gainers: CoinMarketRow[];
  losers: CoinMarketRow[];
  trending: CoinMarketRow[];
  topVolume: CoinMarketRow[];
  onSelectCoin: (id: string, symbol: string, name: string) => void;
}

const MarketQuickToolsSection: React.FC<MarketQuickToolsSectionProps> = ({
  activeTool,
  onSelectTool,
  onAskAlpha,
  allMarkets,
  gainers,
  losers,
  trending,
  topVolume,
  onSelectCoin,
}) => {
  const { t } = useTranslation();

  const tabs: { id: MarketQuickToolId; label: string }[] = [
    { id: 'heatmap', label: t('discover.marketTab.toolHeatmap') },
    { id: 'gainers', label: t('discover.marketTab.toolGainers') },
    { id: 'losers', label: t('discover.marketTab.toolLosers') },
    { id: 'trending', label: t('discover.marketTab.toolTrending') },
    { id: 'volume', label: t('discover.marketTab.toolVolume') },
  ];

  const renderContent = () => {
    if (activeTool === 'heatmap') {
      return <CoinHeatmap coins={allMarkets} onSelect={onSelectCoin} />;
    }

    const listMap: Record<Exclude<MarketQuickToolId, 'heatmap'>, CoinMarketRow[]> = {
      gainers,
      losers,
      trending,
      volume: topVolume,
    };

    const coins = listMap[activeTool];
    if (coins.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-slate-500">
          {activeTool === 'trending' ? t('discover.marketTab.panelEmptyList') : t('discover.marketTab.noData')}
        </p>
      );
    }

    return (
      <div className="grid gap-1 sm:grid-cols-2">
        {coins.map((coin) => (
          <MarketTokenRow
            key={coin.id}
            coin={coin}
            onSelect={onSelectCoin}
            metric={activeTool === 'volume' ? 'volume' : 'change'}
          />
        ))}
      </div>
    );
  };

  const desc = panelDesc(activeTool, t);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">{t('discover.marketTab.quickExploreTitle')}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t('discover.marketTab.quickExploreDesc')}</p>
        </div>
        <button
          type="button"
          onClick={onAskAlpha}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-100"
        >
          <Sparkles className="h-4 w-4 text-violet-600" />
          {t('discover.marketTab.toolAskAI')}
        </button>
      </div>

      <div className="border-b border-slate-100">
        <div
          className="flex gap-1 overflow-x-auto px-2 py-1 sm:px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t('discover.marketTab.quickExploreTitle')}
        >
          {tabs.map(({ id, label }) => {
            const selected = activeTool === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onSelectTool(id)}
                className={`relative flex shrink-0 items-center gap-2 text-black border border-slate-100 rounded-2xl py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
                  selected
                    ? 'bg-slate-100 shadow-sm'
                    : 'hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5" role="tabpanel">
        <div className="mb-4 flex items-start gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{panelTitle(activeTool, t)}</h3>
            {desc ? <p className="mt-0.5 text-xs text-slate-500">{desc}</p> : null}
          </div>
        </div>
        {renderContent()}
      </div>
    </section>
  );
};

export default MarketQuickToolsSection;

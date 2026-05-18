import React from 'react';
import {
  BarChart3,
  Flame,
  LayoutGrid,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Volume2,
  X,
} from 'lucide-react';
import CoinHeatmap from './CoinHeatmap';
import type { CoinMarketRow } from '../../types/ai';

export type MarketQuickToolId = 'heatmap' | 'movers' | 'trending' | 'volume';

interface TokenRowProps {
  coin: CoinMarketRow;
  onSelect: (id: string, symbol: string, name: string) => void;
}

const MiniTokenRow: React.FC<TokenRowProps> = ({ coin, onSelect }) => {
  const change = coin.price_change_percentage_24h;
  const changeClass =
    change == null ? 'text-neutral-500' : change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-neutral-600';

  return (
    <button
      type="button"
      onClick={() => onSelect(coin.id, coin.symbol, coin.name)}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-neutral-50"
    >
      <img src={coin.image} alt="" className="h-7 w-7 rounded-full object-cover" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{coin.name}</span>
      <span className={`text-xs font-semibold tabular-nums ${changeClass}`}>
        {change != null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
      </span>
    </button>
  );
};

interface ToolPanelShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ToolPanelShell: React.FC<ToolPanelShellProps> = ({ title, onClose, children }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
    {children}
  </div>
);

const actionBtnBase =
  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition';

interface MarketQuickToolsBarProps {
  activeTool: MarketQuickToolId | null;
  onToggleTool: (id: MarketQuickToolId) => void;
  onAskAlpha: () => void;
}

export const MarketQuickToolsBar: React.FC<MarketQuickToolsBarProps> = ({
  activeTool,
  onToggleTool,
  onAskAlpha,
}) => {
  const chip = (id: MarketQuickToolId) =>
    activeTool === id
      ? 'border-violet-300 bg-violet-50 text-violet-900'
      : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50';

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onAskAlpha}
        className={`${actionBtnBase} border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50`}
      >
        <Sparkles className="h-4 w-4 text-violet-600" />
        Спросить MNOONX AI
      </button>
      <button
        type="button"
        onClick={() => onToggleTool('heatmap')}
        className={`${actionBtnBase} ${chip('heatmap')}`}
      >
        <LayoutGrid className="h-4 w-4" />
        Coin Heatmap
      </button>
      <button
        type="button"
        onClick={() => onToggleTool('movers')}
        className={`${actionBtnBase} ${chip('movers')}`}
      >
        <TrendingUp className="h-4 w-4 text-emerald-600" />
        <TrendingDown className="h-4 w-4 text-red-600" />
        Top Gainers / Losers
      </button>
      <button
        type="button"
        onClick={() => onToggleTool('trending')}
        className={`${actionBtnBase} ${chip('trending')}`}
      >
        <Flame className="h-4 w-4 text-orange-500" />
        Trending
      </button>
      <button
        type="button"
        onClick={() => onToggleTool('volume')}
        className={`${actionBtnBase} ${chip('volume')}`}
      >
        <Volume2 className="h-4 w-4 text-blue-600" />
        Top Volume 24h
      </button>
    </div>
  );
};

interface MarketQuickToolPanelProps {
  activeTool: MarketQuickToolId | null;
  onClose: () => void;
  allMarkets: CoinMarketRow[];
  gainers: CoinMarketRow[];
  losers: CoinMarketRow[];
  trending: CoinMarketRow[];
  topVolume: CoinMarketRow[];
  onSelectCoin: (id: string, symbol: string, name: string) => void;
}

export const MarketQuickToolPanel: React.FC<MarketQuickToolPanelProps> = ({
  activeTool,
  onClose,
  allMarkets,
  gainers,
  losers,
  trending,
  topVolume,
  onSelectCoin,
}) => {
  if (!activeTool) return null;

  if (activeTool === 'heatmap') {
    return (
      <ToolPanelShell title="Coin Heatmap — топ по капитализации" onClose={onClose}>
        <CoinHeatmap coins={allMarkets} onSelect={onSelectCoin} />
      </ToolPanelShell>
    );
  }

  if (activeTool === 'movers') {
    return (
      <ToolPanelShell title="Top Gainers / Top Losers (24h)" onClose={onClose}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" /> Gainers
            </p>
            {gainers.length === 0 ? (
              <p className="text-sm text-neutral-500">Нет данных</p>
            ) : (
              gainers.map((c) => <MiniTokenRow key={c.id} coin={c} onSelect={onSelectCoin} />)
            )}
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-700">
              <TrendingDown className="h-3.5 w-3.5" /> Losers
            </p>
            {losers.length === 0 ? (
              <p className="text-sm text-neutral-500">Нет данных</p>
            ) : (
              losers.map((c) => <MiniTokenRow key={c.id} coin={c} onSelect={onSelectCoin} />)
            )}
          </div>
        </div>
      </ToolPanelShell>
    );
  }

  if (activeTool === 'trending') {
    return (
      <ToolPanelShell title="Trending — поиск CoinGecko" onClose={onClose}>
        {trending.length === 0 ? (
          <p className="text-sm text-neutral-500">Список пуст</p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {trending.map((c) => (
              <MiniTokenRow key={c.id} coin={c} onSelect={onSelectCoin} />
            ))}
          </div>
        )}
      </ToolPanelShell>
    );
  }

  return (
    <ToolPanelShell title="Top Volume 24h" onClose={onClose}>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-neutral-500">
        <BarChart3 className="h-3.5 w-3.5" />
        Крупнейший торговый объём за сутки среди отслеживаемых монет
      </p>
      {topVolume.length === 0 ? (
        <p className="text-sm text-neutral-500">Нет данных</p>
      ) : (
        topVolume.map((c) => <MiniTokenRow key={c.id} coin={c} onSelect={onSelectCoin} />)
      )}
    </ToolPanelShell>
  );
};

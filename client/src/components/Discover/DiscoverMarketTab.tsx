import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import DiscoverTabHeader from './DiscoverTabHeader';
import MarketStatsStrip from './MarketStatsStrip';
import MarketCoinTable, { type MarketSortKey } from './MarketCoinTable';
import MarketQuickToolsSection, { type MarketQuickToolId } from './MarketQuickTools';
import TradingViewChart from '../AI/TradingViewChart';
import type { CoinMarketRow, MarketsResponse, SearchCoinResult } from '../../types/ai';
import { useAIChatPanel } from '../../context/AIChatPanelContext';
import { useTranslation } from '../../i18n/useTranslation';
import { formatPct, formatUsd, pctClass } from '../AI/marketFormat';
import { marketCoinPath } from '../../constants/marketRoutes';

import { AI_API as API_AI } from '../../config/api';

const TABLE_PAGE_SIZE = 50;

interface TokenRowProps {
  coin: CoinMarketRow | SearchCoinResult;
  onSelect: (id: string, symbol: string, name: string) => void;
  showRank?: boolean;
}

const TokenRow: React.FC<TokenRowProps> = ({ coin, onSelect, showRank = true }) => {
  const image = 'image' in coin ? coin.image : coin.thumb || coin.large;
  const change = 'price_change_percentage_24h' in coin ? coin.price_change_percentage_24h : null;
  const price = 'current_price' in coin ? coin.current_price : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(coin.id, coin.symbol, coin.name)}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50"
    >
      <img src={image} alt="" className="h-8 w-8 rounded-full bg-slate-100 object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{coin.name}</p>
        <p className="text-xs uppercase text-slate-500">{coin.symbol}</p>
      </div>
      <div className="text-right">
        {price != null && <p className="text-sm font-medium text-slate-900">{formatUsd(price)}</p>}
        {change != null && (
          <p className={`text-xs font-medium ${pctClass(change)}`}>{formatPct(change)}</p>
        )}
        {showRank && coin.market_cap_rank != null && price == null && (
          <p className="text-xs text-slate-500">#{coin.market_cap_rank}</p>
        )}
      </div>
    </button>
  );
};

const DiscoverMarketTab: React.FC = () => {
  const navigate = useNavigate();
  const { askAI, openPanel } = useAIChatPanel();
  const { t } = useTranslation();

  const [marketsData, setMarketsData] = useState<MarketsResponse | null>(null);
  const [allMarkets, setAllMarkets] = useState<CoinMarketRow[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCoinResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [tablePage, setTablePage] = useState(0);
  const [sortKey, setSortKey] = useState<MarketSortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [activeTool, setActiveTool] = useState<MarketQuickToolId>('heatmap');

  const loadMarkets = useCallback(async () => {
    setMarketsLoading(true);
    setMarketsError(null);
    try {
      const res = await fetch(`${API_AI}/markets?per_page=100`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || t('discover.marketTab.loadMarketsFailed'));
      }
      const data = (await res.json()) as MarketsResponse & { markets: CoinMarketRow[] };
      setMarketsData(data);
      setAllMarkets(data.markets ?? []);
    } catch (e) {
      setMarketsError(e instanceof Error ? e.message : t('discover.marketTab.loadMarketDataFailed'));
    } finally {
      setMarketsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadMarkets();
  }, [loadMarkets]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`${API_AI}/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error(t('discover.marketTab.searchFailed'));
        const data = await res.json();
        setSearchResults(Array.isArray(data.coins) ? data.coins : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery, t]);

  const onAskAboutToken = useCallback(
    (prompt: string) => {
      askAI(prompt);
      openPanel();
    },
    [askAI, openPanel]
  );

  const openCoinPage = useCallback(
    (id: string) => {
      navigate(marketCoinPath(id));
    },
    [navigate]
  );

  const showSearchDropdown = searchQuery.trim().length >= 2;

  const topGainers = useMemo(() => {
    const fromApi = marketsData?.overview?.topGainers ?? [];
    if (fromApi.length >= 8) return fromApi;
    return [...allMarkets]
      .filter((c) => c.price_change_percentage_24h != null)
      .sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
      .slice(0, 12);
  }, [marketsData?.overview?.topGainers, allMarkets]);

  const topLosers = useMemo(() => {
    const fromApi = marketsData?.overview?.topLosers ?? [];
    if (fromApi.length >= 8) return fromApi;
    return [...allMarkets]
      .filter((c) => c.price_change_percentage_24h != null)
      .sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0))
      .slice(0, 12);
  }, [marketsData?.overview?.topLosers, allMarkets]);

  const topVolume = useMemo(
    () =>
      [...allMarkets]
        .filter((c) => c.total_volume != null && c.total_volume > 0)
        .sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0))
        .slice(0, 15),
    [allMarkets]
  );

  const sortedTableRows = useMemo(() => {
    const rows = [...allMarkets];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortKey) {
        case 'price':
          return ((a.current_price ?? 0) - (b.current_price ?? 0)) * dir;
        case 'change1h':
          return ((a.price_change_percentage_1h ?? 0) - (b.price_change_percentage_1h ?? 0)) * dir;
        case 'change24h':
          return ((a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0)) * dir;
        case 'change7d':
          return ((a.price_change_percentage_7d ?? 0) - (b.price_change_percentage_7d ?? 0)) * dir;
        case 'change30d':
          return ((a.price_change_percentage_30d ?? 0) - (b.price_change_percentage_30d ?? 0)) * dir;
        case 'marketCap':
          return ((a.market_cap ?? 0) - (b.market_cap ?? 0)) * dir;
        case 'volume':
          return ((a.total_volume ?? 0) - (b.total_volume ?? 0)) * dir;
        case 'supply':
          return ((a.circulating_supply ?? 0) - (b.circulating_supply ?? 0)) * dir;
        case 'rank':
        default:
          return ((a.market_cap_rank ?? 9999) - (b.market_cap_rank ?? 9999)) * dir;
      }
    });
    return rows;
  }, [allMarkets, sortKey, sortDir]);

  const toggleSort = (key: MarketSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
    setTablePage(0);
  };

  return (
    <div className="w-full pb-12">
      <DiscoverTabHeader
        title={t('discover.market')}
        tagline={t('discover.marketTab.tagline')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('discover.marketTab.searchPlaceholder')}
        clearSearchAriaLabel={t('discover.marketTab.clearSearch')}
        onClearSearch={() => setSearchResults([])}
        searchDropdown={
          showSearchDropdown ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
              {searchLoading && (
                <p className="px-4 py-3 text-sm text-gray-500">{t('discover.marketTab.searching')}</p>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500">{t('discover.marketTab.noTokensFound')}</p>
              )}
              {!searchLoading &&
                searchResults.map((coin) => (
                  <TokenRow key={coin.id} coin={coin} onSelect={(id) => openCoinPage(id)} showRank />
                ))}
            </div>
          ) : null
        }
      />

      <MarketStatsStrip
        stats={marketsData?.marketStats ?? null}
        globalMetrics={marketsData?.globalMetrics}
        overview={marketsData?.overview}
        loading={marketsLoading}
      />

      <MarketQuickToolsSection
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onAskAlpha={() => onAskAboutToken(t('discover.marketTab.aiMarketOverviewPrompt'))}
        allMarkets={allMarkets}
        gainers={topGainers}
        losers={topLosers}
        trending={marketsData?.trending ?? []}
        topVolume={topVolume}
        onSelectCoin={(id) => openCoinPage(id)}
      />

      {marketsLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        </div>
      )}

      {marketsError && !marketsLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {marketsError}
          <button type="button" onClick={() => void loadMarkets()} className="ml-2 font-semibold underline">
            {t('discover.marketTab.retry')}
          </button>
        </div>
      )}

      {marketsData && !marketsLoading && (
        <div className="space-y-6">
          <MarketCoinTable
            rows={sortedTableRows}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            page={tablePage}
            pageSize={TABLE_PAGE_SIZE}
            onPageChange={setTablePage}
            onSelectCoin={(id) => openCoinPage(id)}
          />

          <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:items-stretch">
            <div className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="shrink-0 border-b border-slate-100 px-4 py-3">
                <h3 className="text-base font-bold text-slate-900">
                  {t('discover.marketTab.chartTitle', { symbol: 'BTC' })}
                </h3>
              </div>
              <TradingViewChart symbol="BTC" fillParent className="min-h-0 flex-1" />
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {t('discover.marketTab.highTrust')}
                </h3>
                {marketsData.highTrust.map((c) => (
                  <TokenRow key={c.id} coin={c} onSelect={(id) => openCoinPage(id)} />
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-bold text-slate-900">{t('discover.marketTab.trending')}</h3>
                {marketsData.trending.map((c) => (
                  <TokenRow key={c.id} coin={c} onSelect={(id) => openCoinPage(id)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverMarketTab;

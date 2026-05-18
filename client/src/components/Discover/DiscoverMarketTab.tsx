import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
// import AlphaPulse from '../AI/AlphaPulse';
import MarketStatsStrip from './MarketStatsStrip';
import {
  MarketQuickToolPanel,
  MarketQuickToolsBar,
  type MarketQuickToolId,
} from './MarketQuickTools';
import TradingViewChart from '../AI/TradingViewChart';
import { formatPct, formatUsd, pctClass } from '../AI/marketFormat';
import type { CoinDetail, CoinMarketRow, MarketsResponse, SearchCoinResult } from '../../types/ai';
import { useAIChatPanel } from '../../context/AIChatPanelContext';

const API_AI = 'http://localhost:5000/api/ai';
const TABLE_PAGE_SIZE = 20;

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
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-black/5"
    >
      <img src={image} alt="" className="h-8 w-8 rounded-full bg-neutral-100 object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900">{coin.name}</p>
        <p className="text-xs uppercase text-neutral-500">{coin.symbol}</p>
      </div>
      <div className="text-right">
        {price != null && <p className="text-sm font-medium text-neutral-900">{formatUsd(price)}</p>}
        {change != null && (
          <p className={`text-xs font-medium ${pctClass(change)}`}>{formatPct(change)}</p>
        )}
        {showRank && coin.market_cap_rank != null && price == null && (
          <p className="text-xs text-neutral-500">#{coin.market_cap_rank}</p>
        )}
      </div>
    </button>
  );
};

const DiscoverMarketTab: React.FC = () => {
  const { askAI, openPanel } = useAIChatPanel();

  const [marketsData, setMarketsData] = useState<MarketsResponse | null>(null);
  const [allMarkets, setAllMarkets] = useState<CoinMarketRow[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCoinResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedCoin, setSelectedCoin] = useState<CoinDetail | null>(null);
  const [chartSymbol, setChartSymbol] = useState('BTC');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [tablePage, setTablePage] = useState(0);
  const [sortKey, setSortKey] = useState<'rank' | 'price' | 'change24h' | 'change7d' | 'marketCap'>(
    'rank'
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [activeTool, setActiveTool] = useState<MarketQuickToolId | null>(null);

  const loadMarkets = useCallback(async () => {
    setMarketsLoading(true);
    setMarketsError(null);
    try {
      const res = await fetch(`${API_AI}/markets?per_page=100`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || 'Failed to load markets');
      }
      const data = (await res.json()) as MarketsResponse & { markets: CoinMarketRow[] };
      setMarketsData(data);
      setAllMarkets(data.markets ?? []);
    } catch (e) {
      setMarketsError(e instanceof Error ? e.message : 'Failed to load market data');
    } finally {
      setMarketsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setMarketsLoading(true);
      setMarketsError(null);
      try {
        const res = await fetch(`${API_AI}/markets?per_page=100`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message || 'Failed to load markets');
        }
        const data = (await res.json()) as MarketsResponse & { markets: CoinMarketRow[] };
        if (cancelled) return;
        setMarketsData(data);
        setAllMarkets(data.markets ?? []);
      } catch (e) {
        if (!cancelled) {
          setMarketsError(e instanceof Error ? e.message : 'Failed to load market data');
        }
      } finally {
        if (!cancelled) setMarketsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

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
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setSearchResults(Array.isArray(data.coins) ? data.coins : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const onAskAboutToken = useCallback(
    (prompt: string) => {
      askAI(prompt);
      openPanel();
    },
    [askAI, openPanel]
  );

  const loadCoinDetail = useCallback(
    async (id: string, symbol: string, name: string) => {
      setDetailLoading(true);
      setDetailError(null);
      setSelectedCoin(null);
      setChartSymbol(symbol);
      onAskAboutToken(`Analyze $${symbol.toUpperCase()} (${name})`);
      try {
        const res = await fetch(`${API_AI}/coins/${encodeURIComponent(id)}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message || 'Failed to load token');
        }
        const data = (await res.json()) as CoinDetail;
        setSelectedCoin(data);
      } catch (e) {
        setDetailError(e instanceof Error ? e.message : 'Failed to load token');
      } finally {
        setDetailLoading(false);
      }
    },
    [onAskAboutToken]
  );

  const showSearchDropdown = searchQuery.trim().length >= 2;

  const topGainers = useMemo(() => {
    const fromApi = marketsData?.overview?.topGainers ?? [];
    if (fromApi.length >= 8) return fromApi;
    return [...allMarkets]
      .filter((c) => c.price_change_percentage_24h != null)
      .sort(
        (a, b) =>
          (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
      )
      .slice(0, 12);
  }, [marketsData?.overview?.topGainers, allMarkets]);

  const topLosers = useMemo(() => {
    const fromApi = marketsData?.overview?.topLosers ?? [];
    if (fromApi.length >= 8) return fromApi;
    return [...allMarkets]
      .filter((c) => c.price_change_percentage_24h != null)
      .sort(
        (a, b) =>
          (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0)
      )
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

  const toggleTool = useCallback((id: MarketQuickToolId) => {
    setActiveTool((current) => (current === id ? null : id));
  }, []);

  const sortedTableRows = useMemo(() => {
    const rows = [...allMarkets];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortKey) {
        case 'price':
          return ((a.current_price ?? 0) - (b.current_price ?? 0)) * dir;
        case 'change24h':
          return (
            ((a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0)) * dir
          );
        case 'change7d':
          return (
            ((a.price_change_percentage_7d ?? 0) - (b.price_change_percentage_7d ?? 0)) * dir
          );
        case 'marketCap':
          return ((a.market_cap ?? 0) - (b.market_cap ?? 0)) * dir;
        case 'rank':
        default:
          return ((a.market_cap_rank ?? 9999) - (b.market_cap_rank ?? 9999)) * dir;
      }
    });
    return rows;
  }, [allMarkets, sortKey, sortDir]);

  const tablePageCount = Math.max(1, Math.ceil(sortedTableRows.length / TABLE_PAGE_SIZE));
  const tableSlice = sortedTableRows.slice(
    tablePage * TABLE_PAGE_SIZE,
    tablePage * TABLE_PAGE_SIZE + TABLE_PAGE_SIZE
  );

  const toggleSort = (key: typeof sortKey) => {
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
      <div className="mb-2 mt-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Market</h1>
        <p className="mt-1 text-gray-600">
          Track prices, market momentum, and AI-powered crypto insights
        </p>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens, symbols, or contract addresses..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-14 pr-12 focus:border-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {showSearchDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
              {searchLoading && <p className="px-4 py-3 text-sm text-gray-500">Searching…</p>}
              {!searchLoading && searchResults.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500">No tokens found</p>
              )}
              {!searchLoading &&
                searchResults.map((coin) => (
                  <TokenRow key={coin.id} coin={coin} onSelect={loadCoinDetail} showRank />
                ))}
            </div>
          )}
        </div>
      </div>

      <MarketStatsStrip stats={marketsData?.marketStats ?? null} loading={marketsLoading} />

      <MarketQuickToolsBar
        activeTool={activeTool}
        onToggleTool={toggleTool}
        onAskAlpha={() =>
          onAskAboutToken(
            'Give me a concise market overview for the top cryptocurrencies right now.'
          )
        }
      />

      <div className="mb-6">
        <MarketQuickToolPanel
          activeTool={activeTool}
          onClose={() => setActiveTool(null)}
          allMarkets={allMarkets}
          gainers={topGainers}
          losers={topLosers}
          trending={marketsData?.trending ?? []}
          topVolume={topVolume}
          onSelectCoin={loadCoinDetail}
        />
      </div>

      {(detailLoading || selectedCoin || detailError) && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          {detailLoading && (
            <div className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
            </div>
          )}
          {detailError && !detailLoading && <p className="text-center text-sm text-red-600">{detailError}</p>}
          {selectedCoin && !detailLoading && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedCoin.image && (
                    <img src={selectedCoin.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{selectedCoin.name}</h2>
                    <p className="text-sm uppercase text-neutral-500">{selectedCoin.symbol}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setSelectedCoin(null); setDetailError(null); }} className="rounded-full p-2 hover:bg-neutral-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onAskAboutToken(`Analyze $${selectedCoin.symbol.toUpperCase()} (${selectedCoin.name})`)}
                className="mt-4 w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white"
              >
                AI-анализ — {selectedCoin.symbol.toUpperCase()}
              </button>
            </>
          )}
        </div>
      )}

      {marketsLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      )}

      {marketsError && !marketsLoading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {marketsError}
          <button type="button" onClick={() => void loadMarkets()} className="ml-2 font-semibold underline">
            Повторить
          </button>
        </div>
      )}

      {marketsData && !marketsLoading && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-100 px-4 py-3">
                <h2 className="text-base font-bold text-neutral-900">Криптовалюты</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/90 text-xs font-semibold text-neutral-500">
                      <th className="px-4 py-3 text-left">
                        <button type="button" onClick={() => toggleSort('rank')}>#</button>
                      </th>
                      <th className="px-4 py-3 text-left">Имя</th>
                      <th className="px-4 py-3 text-right">
                        <button type="button" onClick={() => toggleSort('price')}>Цена</button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button type="button" onClick={() => toggleSort('change24h')}>24ч %</button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button type="button" onClick={() => toggleSort('change7d')}>7дн %</button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button type="button" onClick={() => toggleSort('marketCap')}>Рын. кап.</button>
                      </th>
                      <th className="px-4 py-3 text-right">Объём</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableSlice.map((coin) => (
                      <tr
                        key={coin.id}
                        className="cursor-pointer border-b border-neutral-50 hover:bg-neutral-50/80"
                        onClick={() => loadCoinDetail(coin.id, coin.symbol, coin.name)}
                      >
                        <td className="px-4 py-3 text-neutral-500">{coin.market_cap_rank ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={coin.image} alt="" className="h-8 w-8 rounded-full" />
                            <div>
                              <p className="font-semibold">{coin.name}</p>
                              <p className="text-xs uppercase text-neutral-500">{coin.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatUsd(coin.current_price)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${pctClass(coin.price_change_percentage_24h)}`}>
                          {formatPct(coin.price_change_percentage_24h)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${pctClass(coin.price_change_percentage_7d)}`}>
                          {formatPct(coin.price_change_percentage_7d)}
                        </td>
                        <td className="px-4 py-3 text-right">{formatUsd(coin.market_cap, true)}</td>
                        <td className="px-4 py-3 text-right">{formatUsd(coin.total_volume, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm">
                <button type="button" disabled={tablePage === 0} onClick={() => setTablePage((p) => p - 1)} className="disabled:opacity-40">
                  <ChevronLeft className="inline h-4 w-4" /> Назад
                </button>
                <span className="text-neutral-500">{tablePage + 1} / {tablePageCount}</span>
                <button type="button" disabled={tablePage >= tablePageCount - 1} onClick={() => setTablePage((p) => p + 1)} className="disabled:opacity-40">
                  Далее <ChevronRight className="inline h-4 w-4" />
                </button>
              </div>
            </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-stretch">
            <div className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
                <h3 className="text-base font-bold text-neutral-900">
                  График — {chartSymbol.toUpperCase()}
                </h3>
              </div>
              <TradingViewChart symbol={chartSymbol} fillParent className="min-h-0 flex-1" />
            </div>
            <div className="space-y-4">
            {/* <AlphaPulse variant="light" /> */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> High trust
              </h3>
              {marketsData.highTrust.map((c) => (
                <TokenRow key={c.id} coin={c} onSelect={loadCoinDetail} />
              ))}
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 font-bold">Trending</h3>
              {marketsData.trending.map((c) => (
                <TokenRow key={c.id} coin={c} onSelect={loadCoinDetail} />
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

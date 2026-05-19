import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import type { CoinDetail, CoinMarketRow, MarketsResponse, SearchCoinResult } from '../../types/ai';

import { AI_API as API_AI } from '../../config/api';

function formatUsd(value: number | null | undefined, compact = false): string {
  if (value == null || Number.isNaN(value)) return '—';
  if (compact) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  }
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function pctClass(value: number | null | undefined): string {
  if (value == null) return 'text-neutral-500';
  if (value > 0) return 'text-emerald-600';
  if (value < 0) return 'text-red-600';
  return 'text-neutral-600';
}

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

interface AIMarketsPanelProps {
  onAskAboutToken: (prompt: string) => void;
  title?: string;
  subtitle?: string;
  showHeaderIcon?: boolean;
}

const AIMarketsPanel: React.FC<AIMarketsPanelProps> = ({
  onAskAboutToken,
  title = 'AI Alpha',
  subtitle = 'Market intelligence — search tokens, spot momentum, ask AI on the right.',
  showHeaderIcon = true,
}) => {
  const [marketsData, setMarketsData] = useState<MarketsResponse | null>(null);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCoinResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedCoin, setSelectedCoin] = useState<CoinDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadMarkets = useCallback(async () => {
    setMarketsLoading(true);
    setMarketsError(null);
    try {
      const res = await fetch(`${API_AI}/markets`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || 'Failed to load markets');
      }
      const data = (await res.json()) as MarketsResponse;
      setMarketsData(data);
    } catch (e) {
      setMarketsError(e instanceof Error ? e.message : 'Failed to load market data');
    } finally {
      setMarketsLoading(false);
    }
  }, []);

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

  const loadCoinDetail = useCallback(
    async (id: string, symbol: string, name: string) => {
      setDetailLoading(true);
      setDetailError(null);
      setSelectedCoin(null);
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

  const overview = marketsData?.overview;
  const showSearchDropdown = searchQuery.trim().length >= 2;

  const avgChangeLabel = useMemo(() => {
    if (!overview) return '—';
    return formatPct(overview.avgChange24h);
  }, [overview]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-full">
        <div className="mb-6 text-center">
          {showHeaderIcon && (
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
              <Brain className="h-7 w-7" />
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">{subtitle}</p>
        </div>

        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens (bitcoin, eth, sol)…"
            className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-14 pr-12 text-base shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {showSearchDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
              {searchLoading && <p className="px-4 py-3 text-sm text-neutral-500">Searching…</p>}
              {!searchLoading && searchResults.length === 0 && (
                <p className="px-4 py-3 text-sm text-neutral-500">No tokens found.</p>
              )}
              {!searchLoading &&
                searchResults.map((coin) => (
                  <TokenRow key={coin.id} coin={coin} onSelect={loadCoinDetail} showRank />
                ))}
            </div>
          )}
        </div>

        {(detailLoading || selectedCoin || detailError) && (
          <div className="mb-8 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            {detailLoading && (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
              </div>
            )}
            {detailError && !detailLoading && (
              <p className="text-center text-sm text-red-600">{detailError}</p>
            )}
            {selectedCoin && !detailLoading && (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedCoin.image && (
                      <img
                        src={selectedCoin.image}
                        alt=""
                        className="h-14 w-14 rounded-2xl bg-neutral-100 object-cover"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">{selectedCoin.name}</h2>
                      <p className="text-sm uppercase text-neutral-500">{selectedCoin.symbol}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCoin(null);
                      setDetailError(null);
                    }}
                    className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Price</p>
                    <p className="text-lg font-bold">{formatUsd(selectedCoin.current_price)}</p>
                    <p className={`text-sm ${pctClass(selectedCoin.price_change_percentage_24h)}`}>
                      24h {formatPct(selectedCoin.price_change_percentage_24h)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Market cap</p>
                    <p className="text-lg font-bold">{formatUsd(selectedCoin.market_cap, true)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onAskAboutToken(`Analyze $${selectedCoin.symbol.toUpperCase()} (${selectedCoin.name})`)
                  }
                  className="mt-4 w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  Ask AI about {selectedCoin.symbol.toUpperCase()}
                </button>
              </>
            )}
          </div>
        )}

        {marketsLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
          </div>
        )}

        {marketsError && !marketsLoading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {marketsError}
            <button type="button" onClick={() => void loadMarkets()} className="ml-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {marketsData && !marketsLoading && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#315efb]" />
                  <h3 className="font-bold text-neutral-900">Market Overview</h3>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-neutral-50 p-2.5">
                    <p className="text-xs text-neutral-500">Market cap</p>
                    <p className="font-bold">{formatUsd(overview?.totalMarketCap, true)}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-2.5">
                    <p className="text-xs text-neutral-500">24h volume</p>
                    <p className="font-bold">{formatUsd(overview?.totalVolume24h, true)}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-2.5">
                    <p className="text-xs text-neutral-500">Avg 24h</p>
                    <p className={`font-bold ${pctClass(overview?.avgChange24h)}`}>{avgChangeLabel}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-2.5">
                    <p className="text-xs text-neutral-500">Tracked</p>
                    <p className="font-bold">{overview?.trackedCount ?? 0}</p>
                  </div>
                </div>
                <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Top gainers</p>
                {(overview?.topGainers ?? []).map((coin) => (
                  <TokenRow key={coin.id} coin={coin} onSelect={loadCoinDetail} />
                ))}
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-neutral-900">High Trust</h3>
                </div>
                <p className="mb-2 text-xs text-neutral-500">Large-cap, stable momentum</p>
                {marketsData.highTrust.map((coin) => (
                  <TokenRow key={coin.id} coin={coin} onSelect={loadCoinDetail} />
                ))}
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-600" />
                  <h3 className="font-bold text-neutral-900">Trending</h3>
                </div>
                {marketsData.trending.map((coin) => (
                  <TokenRow key={coin.id} coin={coin} onSelect={loadCoinDetail} />
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-bold text-neutral-900">Watchlist</h3>
              <div className="divide-y divide-neutral-100">
                {marketsData.markets.slice(0, 25).map((coin) => (
                  <TokenRow key={coin.id} coin={coin} onSelect={loadCoinDetail} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIMarketsPanel;

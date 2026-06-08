import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import TradingViewChart from '../components/AI/TradingViewChart';
import { formatPct, formatSupply, formatUsd, pctClass } from '../components/AI/marketFormat';
import type { CoinDetail, CoinMarketRow } from '../types/ai';
import { useAIChatPanel } from '../context/AIChatPanelContext';
import { useTranslation } from '../i18n/useTranslation';
import { AI_API as API_AI } from '../config/api';
import { MARKET_TAB_PATH, marketCoinPath } from '../constants/marketRoutes';

const MOBILE_BOTTOM_NAV_PX = 60;
const COIN_BOTTOM_BAR_HEIGHT_PX = 64;

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function StatBox({
  label,
  value,
  sub,
  valueClass = '',
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums text-gray-900 ${valueClass}`}>{value}</p>
      {sub ? <div className="mt-0.5 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}

const MarketCoinPage: React.FC = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const { t, locale } = useTranslation();
  const { askAI } = useAIChatPanel();

  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [related, setRelated] = useState<CoinMarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [barVisible, setBarVisible] = useState(false);
  const [barLayout, setBarLayout] = useState({ left: 0, width: 0, bottom: 0 });
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!coinId) return;
    setLoading(true);
    setError(null);
    setCoin(null);
    setBarVisible(false);
    try {
      const [coinRes, marketsRes] = await Promise.all([
        fetch(`${API_AI}/coins/${encodeURIComponent(coinId)}`),
        fetch(`${API_AI}/markets?per_page=100`),
      ]);

      if (!coinRes.ok) {
        const body = await coinRes.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || t('discover.marketTab.loadTokenFailed'));
      }

      const coinData = (await coinRes.json()) as CoinDetail;
      setCoin(coinData);

      if (marketsRes.ok) {
        const marketsData = await marketsRes.json();
        const markets: CoinMarketRow[] = marketsData.markets ?? [];
        const rank = coinData.market_cap_rank;
        const nearby =
          rank != null
            ? markets
                .filter((c) => c.market_cap_rank != null && Math.abs(c.market_cap_rank - rank) <= 3)
                .sort((a, b) => (a.market_cap_rank ?? 0) - (b.market_cap_rank ?? 0))
            : markets.slice(0, 6);
        setRelated(nearby.filter((c) => c.id !== coinData.id).slice(0, 5));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('discover.marketTab.loadTokenFailed'));
    } finally {
      setLoading(false);
    }
  }, [coinId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !coin) return undefined;

    let observer: IntersectionObserver | null = null;
    let scrollParent: HTMLElement | null = null;
    let ro: ResizeObserver | null = null;
    let rafId = 0;
    let sync: (() => void) | null = null;

    const setup = () => {
      const page = pageRef.current;
      const hero = heroRef.current;
      if (!page || !hero) {
        rafId = requestAnimationFrame(setup);
        return;
      }

      scrollParent = getScrollParent(page);

      const syncBarLayout = () => {
        const rect = page.getBoundingClientRect();
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
        setBarLayout({
          left: rect.left,
          width: rect.width,
          bottom: isDesktop ? 0 : MOBILE_BOTTOM_NAV_PX,
        });
      };

      const syncHeroVisibility = () => {
        const heroRect = hero.getBoundingClientRect();
        if (scrollParent) {
          const parentRect = scrollParent.getBoundingClientRect();
          setBarVisible(heroRect.bottom <= parentRect.top + 1);
        } else {
          setBarVisible(heroRect.bottom <= 0);
        }
      };

      sync = () => {
        syncBarLayout();
        syncHeroVisibility();
      };

      sync();

      observer = new IntersectionObserver(
        ([entry]) => setBarVisible(!entry.isIntersecting),
        { root: scrollParent, threshold: 0, rootMargin: '0px' }
      );
      observer.observe(hero);

      scrollParent?.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);

      ro = new ResizeObserver(sync);
      ro.observe(page);
      ro.observe(hero);
      if (scrollParent) ro.observe(scrollParent);
    };

    rafId = requestAnimationFrame(setup);

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      if (sync) {
        scrollParent?.removeEventListener('scroll', sync);
        window.removeEventListener('resize', sync);
      }
      ro?.disconnect();
    };
  }, [coin?.id, loading]);

  const scrollToChart = useCallback(() => {
    chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const onAskAI = useCallback(() => {
    if (!coin) return;
    askAI(
      t('discover.marketTab.aiAnalyzePrompt', {
        symbol: `$${coin.symbol.toUpperCase()}`,
        name: coin.name,
      }),
      { autoSend: true, coinContext: coin, locale }
    );
  }, [askAI, coin, locale, t]);

  const volMcapRatio = useMemo(() => {
    if (!coin?.market_cap || !coin.total_volume || coin.market_cap <= 0) return null;
    return (coin.total_volume / coin.market_cap) * 100;
  }, [coin]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-sm text-red-600">{error ?? t('discover.marketTab.loadTokenFailed')}</p>
        <Link
          to={MARKET_TAB_PATH}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('discover.coinPage.backToMarket')}
        </Link>
      </div>
    );
  }

  const bottomBar =
    barLayout.width > 0
      ? createPortal(
          <div
            className={`fixed z-[80] border-t border-gray-200 bg-white/98 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md transition-transform duration-300 ease-out ${
              barVisible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
            }`}
            style={{
              bottom: barLayout.bottom,
              left: barLayout.left,
              width: barLayout.width,
            }}
            aria-hidden={!barVisible}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                {coin.image && (
                  <img src={coin.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{coin.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold tabular-nums text-gray-900">
                      {formatUsd(coin.current_price)}
                    </span>
                    <span
                      className={`text-xs font-semibold tabular-nums ${pctClass(coin.price_change_percentage_24h)}`}
                    >
                      {formatPct(coin.price_change_percentage_24h)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={scrollToChart}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 sm:px-3 sm:py-1.5"
                  aria-label={t('discover.coinPage.scrollToChart')}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden text-xs font-semibold sm:inline">
                    {t('discover.coinPage.scrollToChart')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onAskAI}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 sm:px-3 sm:py-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden text-xs font-semibold sm:inline">AI</span>
                </button>
                {/* {coin.homepage && (
                  <a
                    href={coin.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 sm:px-3 sm:py-1.5"
                    aria-label={t('discover.marketTab.website')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )} */}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={pageRef}
      className={`w-full px-4 py-4 sm:px-6 lg:px-8 ${barVisible ? 'pb-28' : 'pb-12'}`}
    >
      {bottomBar}
      <div ref={heroRef}>
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <Link to={MARKET_TAB_PATH} className="hover:text-gray-900">
          {t('discover.market')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">{coin.name}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {coin.image && (
            <img src={coin.image} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{coin.name}</h1>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-sm font-bold uppercase text-gray-600">
                {coin.symbol}
              </span>
              {coin.market_cap_rank != null && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  #{coin.market_cap_rank}
                </span>
              )}
            </div>
            <p className="mt-2 text-4xl font-bold tabular-nums text-gray-900">
              {formatUsd(coin.current_price)}
            </p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${pctClass(coin.price_change_percentage_24h)}`}>
              {formatPct(coin.price_change_percentage_24h)} {t('discover.marketTab.period24h')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAskAI}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            {t('discover.marketTab.aiAnalysis', { symbol: coin.symbol.toUpperCase() })}
          </button>
          {coin.homepage && (
            <a
              href={coin.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              {t('discover.marketTab.website')}
            </a>
          )}
        </div>
      </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <div
            ref={chartRef}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            style={{ scrollMarginBottom: COIN_BOTTOM_BAR_HEIGHT_PX + barLayout.bottom }}
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-base font-bold text-gray-900">
                {t('discover.coinPage.priceChart', { symbol: coin.symbol.toUpperCase() })}
              </h2>
            </div>
            <div className="h-[480px] min-h-[360px]">
              <TradingViewChart symbol={coin.symbol} fillParent className="h-full" />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-base font-bold text-gray-900">{t('discover.coinPage.marketStats')}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatBox label={t('discover.marketTab.colMarketCap')} value={formatUsd(coin.market_cap, true)} />
              <StatBox label={t('discover.marketTab.colVolume')} value={formatUsd(coin.total_volume, true)} />
              <StatBox
                label={t('discover.coinPage.volMcapRatio')}
                value={volMcapRatio != null ? `${volMcapRatio.toFixed(2)}%` : '—'}
              />
              <StatBox
                label={t('discover.marketTab.colSupply')}
                value={formatSupply(coin.circulating_supply, coin.symbol)}
                sub={
                  coin.total_supply
                    ? `${t('discover.coinPage.totalSupply')}: ${formatSupply(coin.total_supply, coin.symbol)}`
                    : undefined
                }
              />
              <StatBox label={t('discover.marketTab.high24h')} value={formatUsd(coin.high_24h)} />
              <StatBox label={t('discover.marketTab.low24h')} value={formatUsd(coin.low_24h)} />
              <StatBox
                label={t('discover.marketTab.ath')}
                value={formatUsd(coin.ath)}
                valueClass={pctClass(coin.ath_change_percentage)}
                sub={formatPct(coin.ath_change_percentage)}
              />
            </div>
          </div>

          {coin.description && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-base font-bold text-gray-900">
                {t('discover.coinPage.about', { name: coin.name })}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600">{coin.description}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-gray-900">{t('discover.coinPage.pricePerformance')}</h3>
            <dl className="space-y-2 text-sm">
              {[
                [t('discover.marketTab.period1h'), coin.price_change_percentage_1h],
                [t('discover.marketTab.period24h'), coin.price_change_percentage_24h],
                [t('discover.marketTab.period7d'), coin.price_change_percentage_7d],
                [t('discover.marketTab.period30d'), coin.price_change_percentage_30d],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex items-center justify-between gap-2">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className={`font-semibold tabular-nums ${pctClass(val as number | null)}`}>
                    {formatPct(val as number | null)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {related.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-gray-900">{t('discover.coinPage.nearbyRank')}</h3>
              <ul className="space-y-1">
                {related.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={marketCoinPath(c.id)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50"
                    >
                      <img src={c.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                        {c.name}
                      </span>
                      <span className={`text-xs font-semibold ${pctClass(c.price_change_percentage_24h)}`}>
                        {formatPct(c.price_change_percentage_24h)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-gray-400">{coin.disclaimer}</p>
        </aside>
      </div>
    </div>
  );
};

export default MarketCoinPage;

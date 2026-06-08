import React from 'react';
import { Activity, BarChart3, Bitcoin, Coins, Globe2, Layers, TrendingUp } from 'lucide-react';
import MiniSparkline from './MiniSparkline';
import { formatDominance, formatPct, formatUsd, pctClass } from '../AI/marketFormat';
import type { GlobalMetrics, MarketStats, MarketsOverview } from '../../types/ai';
import { useTranslation } from '../../i18n/useTranslation';

interface MarketStatsStripProps {
  stats: MarketStats | null;
  globalMetrics?: GlobalMetrics | null;
  overview?: MarketsOverview | null;
  loading?: boolean;
}

function FearGreedGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const angle = -90 + (v / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 50;
  const cy = 52;
  const r = 36;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  return (
    <svg viewBox="0 0 100 64" className="h-16 w-[110px] shrink-0" aria-hidden>
      <defs>
        <linearGradient id="fngGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path
        d="M 14 52 A 36 36 0 0 1 86 52"
        fill="none"
        stroke="url(#fngGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill="#374151" />
    </svg>
  );
}

function AltseasonBar({
  score,
  bitcoinLabel,
  altcoinLabel,
}: {
  score: number;
  bitcoinLabel: string;
  altcoinLabel: string;
}) {
  const s = Math.max(0, Math.min(100, score));
  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-[10px] font-medium text-slate-500">
        <span>{bitcoinLabel}</span>
        <span>{altcoinLabel}</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-400 via-violet-500 to-emerald-500"
          style={{ width: `${s}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-slate-800 shadow"
          style={{ left: `calc(${s}% - 8px)` }}
        />
      </div>
      <p className="mt-1.5 text-center text-sm font-bold text-slate-800">{s}/100</p>
    </div>
  );
}

const StatCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`flex flex-col rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const SubMetric: React.FC<{ label: string; value: string; valueClass?: string }> = ({
  label,
  value,
  valueClass = 'text-slate-800',
}) => (
  <div className="flex items-center justify-between gap-2 text-xs">
    <span className="text-slate-500">{label}</span>
    <span className={`font-semibold tabular-nums ${valueClass}`}>{value}</span>
  </div>
);

const MarketStatsStrip: React.FC<MarketStatsStripProps> = ({
  stats,
  globalMetrics,
  overview,
  loading,
}) => {
  const { t } = useTranslation();

  if (loading || !stats) {
    return (
      <div className="mb-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
        <div className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      </div>
    );
  }

  const mcPositive = (stats.marketCap.change24h ?? 0) >= 0;
  const hasMcChart = stats.marketCap.sparkline.length >= 2;

  const mcap = globalMetrics?.totalMarketCap ?? stats.marketCap.value;
  const vol = globalMetrics?.totalVolume24h ?? overview?.totalVolume24h ?? 0;
  const mcapChange = globalMetrics?.marketCapChange24h ?? stats.marketCap.change24h;
  const btcDom = globalMetrics?.btcDominance ?? 0;
  const ethDom = globalMetrics?.ethDominance ?? 0;
  const altDom = Math.max(0, 100 - btcDom - ethDom);
  const volMcapRatio = mcap > 0 ? (vol / mcap) * 100 : 0;
  const avgChange = overview?.avgChange24h ?? 0;
  const cryptos = globalMetrics?.activeCryptocurrencies ?? overview?.trackedCount ?? 0;
  const exchanges = globalMetrics?.markets ?? 0;

  const altseasonLabel =
    stats.altseason.label === 'Altcoin Season'
      ? t('discover.marketTab.altseasonAltcoin')
      : stats.altseason.label === 'Bitcoin Season'
        ? t('discover.marketTab.altseasonBitcoin')
        : t('discover.marketTab.altseasonNeutral');

  const rsiLabel =
    stats.avgRsi.label === 'Oversold'
      ? t('discover.marketTab.rsiOversold')
      : stats.avgRsi.label === 'Overbought'
        ? t('discover.marketTab.rsiOverbought')
        : t('discover.marketTab.rsiNeutral');

  const fearGreedLabel =
    stats.fearGreed.label === 'Extreme Fear'
      ? t('discover.marketTab.fearExtreme')
      : stats.fearGreed.label === 'Fear'
        ? t('discover.marketTab.fear')
        : stats.fearGreed.label === 'Greed'
          ? t('discover.marketTab.greed')
          : stats.fearGreed.label === 'Extreme Greed'
            ? t('discover.marketTab.greedExtreme')
            : t('discover.marketTab.rsiNeutral');

  return (
    <div className="mb-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard className="sm:col-span-2 xl:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('discover.marketTab.statMarketCap')}
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tabular-nums text-slate-900">{formatUsd(mcap, true)}</p>
              <p className={`mt-0.5 text-sm font-semibold tabular-nums ${pctClass(mcapChange)}`}>
                {formatPct(mcapChange)} {t('discover.marketTab.change24hShort')}
              </p>
            </div>
            {hasMcChart ? (
              <MiniSparkline points={stats.marketCap.sparkline} positive={mcPositive} width={110} height={44} />
            ) : (
              <div className="h-11 w-28 rounded bg-slate-100" />
            )}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            {mcPositive
              ? t('discover.marketTab.mcapDescUp')
              : t('discover.marketTab.mcapDescDown')}
          </p>
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            <SubMetric label={t('discover.marketTab.globalVolume24h')} value={formatUsd(vol, true)} />
            <SubMetric
              label={t('discover.marketTab.volMcapRatio')}
              value={`${volMcapRatio.toFixed(2)}%`}
            />
            <SubMetric label={t('discover.marketTab.altDominance')} value={formatDominance(altDom)} />
          </div>
        </StatCard>

        <StatCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('discover.marketTab.statFearGreed')}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-3xl font-bold tabular-nums text-slate-900">{stats.fearGreed.value}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">{fearGreedLabel}</p>
            </div>
            <FearGreedGauge value={stats.fearGreed.value} />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            {t('discover.marketTab.fearGreedDesc')}
          </p>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-[10px] font-medium text-slate-400">
            <span>0 {t('discover.marketTab.fear')}</span>
            <span>50</span>
            <span>100 {t('discover.marketTab.greed')}</span>
          </div>
        </StatCard>

        <StatCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('discover.marketTab.statAltseason')}
          </p>
          <div className="mt-3">
            <AltseasonBar
              score={stats.altseason.score}
              bitcoinLabel={t('discover.marketTab.bitcoin')}
              altcoinLabel={t('discover.marketTab.altcoin')}
            />
            <p className="mt-2 text-center text-sm font-semibold text-slate-700">{altseasonLabel}</p>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            {t('discover.marketTab.altseasonDesc')}
          </p>
        </StatCard>

        <StatCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('discover.marketTab.statAvgRsi')}
          </p>
          <div className="mt-2">
            <p className="text-3xl font-bold tabular-nums text-slate-900">{stats.avgRsi.value.toFixed(2)}</p>
            <span
              className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                stats.avgRsi.label === 'Oversold'
                  ? 'bg-emerald-100 text-emerald-800'
                  : stats.avgRsi.label === 'Overbought'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {rsiLabel}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${stats.avgRsi.value}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
            <span>0</span>
            <span>30</span>
            <span>70</span>
            <span>100</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{t('discover.marketTab.rsiDesc')}</p>
        </StatCard>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              icon: <Coins className="h-4 w-4 text-blue-600" />,
              label: t('discover.marketTab.globalCryptos'),
              value: cryptos.toLocaleString(),
              sub: t('discover.marketTab.globalCryptosDesc'),
            },
            {
              icon: <Globe2 className="h-4 w-4 text-violet-600" />,
              label: t('discover.marketTab.globalExchanges'),
              value: exchanges > 0 ? exchanges.toLocaleString() : '—',
              sub: t('discover.marketTab.globalExchangesDesc'),
            },
            {
              icon: <BarChart3 className="h-4 w-4 text-emerald-600" />,
              label: t('discover.marketTab.globalMarketCap'),
              value: formatUsd(mcap, true),
              sub: (
                <span className={`font-semibold ${pctClass(mcapChange)}`}>{formatPct(mcapChange)}</span>
              ),
            },
            {
              icon: <Activity className="h-4 w-4 text-orange-600" />,
              label: t('discover.marketTab.globalVolume24h'),
              value: formatUsd(vol, true),
              sub: t('discover.marketTab.globalVolumeDesc'),
            },
            {
              icon: <Bitcoin className="h-4 w-4 text-amber-600" />,
              label: t('discover.marketTab.globalBtcDominance'),
              value: formatDominance(btcDom),
              sub: t('discover.marketTab.btcDominanceDesc'),
            },
            {
              icon: <Layers className="h-4 w-4 text-indigo-600" />,
              label: t('discover.marketTab.avgChange24h'),
              value: formatPct(avgChange),
              sub: (
                <span className={`inline-flex items-center gap-1 font-semibold ${pctClass(avgChange)}`}>
                  <TrendingUp className="h-3 w-3" />
                  {t('discover.marketTab.trackedCoins', { count: overview?.trackedCount ?? 0 })}
                </span>
              ),
            },
          ].map((item) => (
            <div key={item.label} className="bg-white px-4 py-3">
              <div className="flex items-center gap-1.5">
                {item.icon}
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </span>
              </div>
              <p className="mt-1 text-base font-bold tabular-nums text-slate-900">{item.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketStatsStrip;

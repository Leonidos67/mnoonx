import React from 'react';
import MiniSparkline from './MiniSparkline';
import { formatPct, formatUsd, pctClass } from '../AI/marketFormat';
import type { MarketStats } from '../../types/ai';

interface MarketStatsStripProps {
  stats: MarketStats | null;
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
    <svg viewBox="0 0 100 64" className="h-14 w-[100px] shrink-0" aria-hidden>
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

function AltseasonBar({ score }: { score: number }) {
  const s = Math.max(0, Math.min(100, score));
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-[10px] font-medium text-neutral-500">
        <span>Bitcoin</span>
        <span>Altcoin</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-400 via-violet-500 to-emerald-500"
          style={{ width: `${s}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-800 shadow"
          style={{ left: `calc(${s}% - 7px)` }}
        />
      </div>
      <p className="mt-1 text-center text-xs font-bold text-neutral-800">{s}/100</p>
    </div>
  );
}

const StatCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`flex min-w-[200px] max-w-[240px] shrink-0 flex-col justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const MarketStatsStrip: React.FC<MarketStatsStripProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[108px] min-w-[200px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
          />
        ))}
      </div>
    );
  }

  const mcPositive = (stats.marketCap.change24h ?? 0) >= 0;
  const cmcPositive = (stats.cmc20.change24h ?? 0) >= 0;
  const hasMcChart = stats.marketCap.sparkline.length >= 2;
  const hasCmcChart = stats.cmc20.sparkline.length >= 2;

  return (
    <div className="mb-6 -mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-min gap-3 px-1">
        <StatCard>
          <p className="text-xs font-semibold text-neutral-500">Рын. капитализация</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-bold leading-tight text-neutral-900">
                {formatUsd(stats.marketCap.value, true)}
              </p>
              <p className={`text-xs font-semibold ${pctClass(stats.marketCap.change24h)}`}>
                {formatPct(stats.marketCap.change24h)}
              </p>
            </div>
            {hasMcChart ? (
              <MiniSparkline points={stats.marketCap.sparkline} positive={mcPositive} />
            ) : (
              <div className="h-10 w-24 rounded bg-neutral-100" />
            )}
          </div>
        </StatCard>

        <StatCard>
          <p className="text-xs font-semibold text-neutral-500">CMC20</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-bold leading-tight text-neutral-900">
                ${stats.cmc20.value.toFixed(2)}
              </p>
              <p className={`text-xs font-semibold ${pctClass(stats.cmc20.change24h)}`}>
                {formatPct(stats.cmc20.change24h)}
              </p>
            </div>
            {hasCmcChart ? (
              <MiniSparkline points={stats.cmc20.sparkline} positive={cmcPositive} />
            ) : (
              <div className="h-10 w-24 rounded bg-neutral-100" />
            )}
          </div>
        </StatCard>

        <StatCard className="min-w-[220px]">
          <p className="text-xs font-semibold text-neutral-500">Страх и жадность</p>
          <div className="mt-0 flex items-center justify-between gap-2">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{stats.fearGreed.value}</p>
              <p className="text-xs font-medium text-neutral-600">{stats.fearGreed.label}</p>
            </div>
            <FearGreedGauge value={stats.fearGreed.value} />
          </div>
        </StatCard>

        <StatCard className="min-w-[220px]">
          <p className="text-xs font-semibold text-neutral-500">Альтсезон</p>
          <div className="mt-2">
            <AltseasonBar score={stats.altseason.score} />
            <p className="mt-1 text-center text-[11px] text-neutral-500">
              {stats.altseason.label === 'Altcoin Season'
                ? 'Сезон альткоинов'
                : stats.altseason.label === 'Bitcoin Season'
                  ? 'Сезон Bitcoin'
                  : 'Нейтрально'}
            </p>
          </div>
        </StatCard>

        <StatCard>
          <p className="text-xs font-semibold text-neutral-500">Средний RSI</p>
          <div className="mt-2">
            <p className="text-2xl font-bold text-neutral-900">{stats.avgRsi.value.toFixed(2)}</p>
            <span
              className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                stats.avgRsi.label === 'Oversold'
                  ? 'bg-emerald-100 text-emerald-800'
                  : stats.avgRsi.label === 'Overbought'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {stats.avgRsi.label === 'Oversold'
                ? 'Перепроданность'
                : stats.avgRsi.label === 'Overbought'
                  ? 'Перекупленность'
                  : 'Нейтрально'}
            </span>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{ width: `${stats.avgRsi.value}%` }}
              />
            </div>
          </div>
        </StatCard>
      </div>
    </div>
  );
};

export default MarketStatsStrip;

import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface ActivityCoinsMobileBlockProps {
  coinsLabel: string;
  balance: number;
  levelName: string;
  levelProgress: number;
  levelProgressLabel: string;
}

const ActivityCoinsMobileBlock: React.FC<ActivityCoinsMobileBlockProps> = ({
  coinsLabel,
  balance,
  levelName,
  levelProgress,
  levelProgressLabel,
}) => (
  <div className="relative mx-2 mt-3 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] via-violet-500/[0.04] to-fuchsia-500/[0.06]"
      aria-hidden
    />
    <div className="relative px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{coinsLabel}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-4xl font-bold tabular-nums tracking-tight text-neutral-900">
          {balance.toLocaleString()}
        </span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-md shadow-rose-500/25">
          <Heart className="h-5 w-5 fill-white text-white" aria-hidden />
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 px-3 py-3 ring-1 ring-neutral-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
          <span className="text-sm font-semibold text-neutral-800">{levelName}</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">{levelProgressLabel}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>
    </div>
  </div>
);

export default ActivityCoinsMobileBlock;

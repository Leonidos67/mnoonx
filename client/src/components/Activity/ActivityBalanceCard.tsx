import React from 'react';
import { Heart, HelpCircle, History, ShoppingBag, Sparkles } from 'lucide-react';
import { activityPage } from './activityUi';

interface ActivityBalanceCardProps {
  balance: number;
  levelName: string;
  levelProgress: number;
  levelProgressLabel: string;
  coinsLabel: string;
  mySafeLabel: string;
  historyLabel: string;
  onHistory: () => void;
  onSafe?: () => void;
}

const ActivityBalanceCard: React.FC<ActivityBalanceCardProps> = ({
  balance,
  levelName,
  levelProgress,
  levelProgressLabel,
  coinsLabel,
  mySafeLabel,
  historyLabel,
  onHistory,
  onSafe,
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50">
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.07] via-violet-500/[0.05] to-fuchsia-500/[0.08]"
      aria-hidden
    />
    <div
      className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl"
      aria-hidden
    />

    <div className="relative p-5 sm:p-6">
      <button
        type="button"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label={coinsLabel}
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
      </button>

      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{coinsLabel}</p>

      <div className="mt-2 flex flex-wrap items-end gap-3">
        <span className="text-5xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-6xl">
          {balance.toLocaleString()}
        </span>
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-500/30">
          <Heart className="h-6 w-6 fill-white text-white" aria-hidden />
        </span>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50/90 p-4 ring-1 ring-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden />
          <span className="text-sm font-semibold text-slate-800">{levelName}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{levelProgressLabel}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onSafe}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
        >
          <ShoppingBag className="h-4 w-4 text-indigo-500" aria-hidden />
          {mySafeLabel}
        </button>
        <button
          type="button"
          onClick={onHistory}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
        >
          <History className="h-4 w-4 text-indigo-500" aria-hidden />
          {historyLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ActivityBalanceCard;

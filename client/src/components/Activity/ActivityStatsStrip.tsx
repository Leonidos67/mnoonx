import React from 'react';
import { Flame, Heart, ListTodo, TrendingUp } from 'lucide-react';
import { activityPage } from './activityUi';

export interface ActivityStatItem {
  id: string;
  label: string;
  value: string;
  hint?: string;
  accent?: 'rose' | 'amber' | 'indigo' | 'emerald';
  highlight?: boolean;
}

const accentMap = {
  rose: 'from-rose-500/10 to-pink-500/5 text-rose-600',
  amber: 'from-amber-500/10 to-orange-500/5 text-amber-600',
  indigo: 'from-indigo-500/10 to-violet-500/5 text-indigo-600',
  emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-600',
};

const iconMap = {
  balance: Heart,
  week: TrendingUp,
  streak: Flame,
  missions: ListTodo,
};

interface ActivityStatsStripProps {
  items: ActivityStatItem[];
  variant?: 'grid' | 'scroll';
}

const ActivityStatsStrip: React.FC<ActivityStatsStripProps> = ({ items, variant = 'grid' }) => (
  <div
    className={
      variant === 'scroll'
        ? 'flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        : 'grid grid-cols-2 gap-3 sm:grid-cols-4'
    }
  >
    {items.map((item) => {
      const Icon =
        item.id === 'balance'
          ? iconMap.balance
          : item.id === 'week'
            ? iconMap.week
            : item.id === 'streak'
              ? iconMap.streak
              : iconMap.missions;
      const accent = item.accent ?? 'indigo';
      return (
        <div
          key={item.id}
          className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ${
            variant === 'scroll' ? 'min-w-[148px] shrink-0' : ''
          } ${item.highlight ? 'ring-2 ring-indigo-500/20' : ''}`}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentMap[accent]}`}
            aria-hidden
          />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
              {item.value}
            </p>
            {item.hint ? <p className={`mt-0.5 text-xs ${activityPage.muted}`}>{item.hint}</p> : null}
          </div>
        </div>
      );
    })}
  </div>
);

export default ActivityStatsStrip;

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityRuleCategory } from '../../constants/activityPoints';

interface ActivityRuleCardProps {
  category: ActivityRuleCategory;
  icon: LucideIcon;
  title: string;
  description: string;
  points: number;
  categoryLabel: string;
  maxPoints: number;
}

const categoryAccent: Record<ActivityRuleCategory, string> = {
  content: 'bg-violet-500/10 text-violet-700 ring-violet-500/20',
  social: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  community: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  daily: 'bg-amber-500/10 text-amber-800 ring-amber-500/20',
};

const ActivityRuleCard: React.FC<ActivityRuleCardProps> = ({
  category,
  icon: Icon,
  title,
  description,
  points,
  categoryLabel,
  maxPoints,
}) => (
  <li className="group rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md">
    <div className="flex items-start gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${categoryAccent[category]}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-neutral-900">{title}</p>
          <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            {categoryLabel}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{description}</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-neutral-700 to-neutral-900 transition-all duration-500 group-hover:from-amber-600 group-hover:to-amber-500"
            style={{ width: `${Math.max(12, Math.round((points / maxPoints) * 100))}%` }}
          />
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-neutral-900 px-3 py-1.5 text-sm font-bold tabular-nums text-white shadow-sm">
        +{points}
      </span>
    </div>
  </li>
);

export default ActivityRuleCard;

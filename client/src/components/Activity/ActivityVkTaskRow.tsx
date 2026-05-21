import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Heart } from 'lucide-react';
import type { ActivityRuleCategory } from '../../constants/activityPoints';
import { activityPage } from './activityUi';

const categoryBg: Record<ActivityRuleCategory, string> = {
  content: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  social: 'bg-rose-50 text-rose-600 ring-rose-100',
  community: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  daily: 'bg-amber-50 text-amber-600 ring-amber-100',
};

interface ActivityVkTaskRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  points: number;
  category: ActivityRuleCategory;
  completed: boolean;
  claimable: boolean;
  completedLabel: string;
  claimLabel: string;
  onClaim?: () => void;
  progress?: number;
  progressHint?: string;
}

const ActivityVkTaskRow: React.FC<ActivityVkTaskRowProps> = ({
  icon: Icon,
  title,
  description,
  points,
  category,
  completed,
  claimable,
  completedLabel,
  claimLabel,
  onClaim,
  progress,
  progressHint,
}) => (
  <div
    className={`group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 ${activityPage.cardHover}`}
  >
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${categoryBg[category]}`}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </div>
    <div className="min-w-0 flex-1">
      {completed ? (
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">{completedLabel}</p>
      ) : (
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      )}
      <p className="mt-0.5 text-sm leading-snug text-slate-500">{description}</p>
      {!completed && progress !== undefined && progress > 0 ? (
        <>
          {progressHint ? <p className="mt-1.5 text-xs text-slate-400">{progressHint}</p> : null}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </>
      ) : null}
    </div>
    {claimable ? (
      <button type="button" onClick={onClaim} className={activityPage.claimBtn}>
        {claimLabel}
        <Heart className="h-3.5 w-3.5 fill-white" aria-hidden />
      </button>
    ) : completed ? null : (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800">
        +{points}
        <Heart className="h-4 w-4 fill-rose-500 text-rose-500" aria-hidden />
      </span>
    )}
  </div>
);

export default ActivityVkTaskRow;

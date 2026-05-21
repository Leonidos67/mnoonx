import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityRuleCategory } from '../../constants/activityPoints';

const categoryGradients: Record<ActivityRuleCategory, string> = {
  content: 'from-violet-500 to-indigo-600',
  social: 'from-[#5181b8] to-[#6a8fd4]',
  community: 'from-emerald-400 to-cyan-500',
  daily: 'from-amber-400 to-orange-500',
};

interface ActivityMissionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  points: number;
  category: ActivityRuleCategory;
  completed: boolean;
  doneLabel: string;
  onClick?: () => void;
}

const ActivityMissionCard: React.FC<ActivityMissionCardProps> = ({
  icon: Icon,
  title,
  description,
  points,
  category,
  completed,
  doneLabel,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full items-center gap-3 rounded-xl bg-white p-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.99] ${
      completed ? 'ring-2 ring-emerald-400/40' : 'ring-1 ring-black/[0.04]'
    }`}
  >
    <div
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner ${categoryGradients[category]} text-white`}
    >
      <Icon className="h-6 w-6" aria-hidden />
      {completed ? (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
          <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-[#222]">{title}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#818c99]">{description}</p>
    </div>
    {completed ? (
      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        {doneLabel}
      </span>
    ) : (
      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-b from-[#ffe566] to-[#ffcc00] px-2.5 py-1.5 shadow-[0_2px_0_rgba(230,160,0,0.35)]">
        <span className="text-sm font-extrabold tabular-nums text-[#5c3d00]">+{points}</span>
      </span>
    )}
    <ChevronRight
      className="h-4 w-4 shrink-0 text-[#aeb7c2] opacity-0 transition-opacity group-hover:opacity-100"
      aria-hidden
    />
  </button>
);

export default ActivityMissionCard;

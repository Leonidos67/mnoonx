import React, { useMemo } from 'react';
import { Flame, Heart, PenLine, Star, Trophy, Users } from 'lucide-react';
import {
  ACTIVITY_AWARDS,
  type ActivityAwardDef,
  isActivityAwardUnlocked,
} from '../../constants/activityAwards';
import type { ActivityLevelId, ActivityRuleId } from '../../constants/activityPoints';
import { activityPage } from './activityUi';

const awardIconMap = {
  coin: Star,
  flame: Flame,
  chart: Trophy,
  pen: PenLine,
  users: Users,
  heart: Heart,
  trophy: Trophy,
  star: Star,
  torch: Flame,
} as const;

interface ActivityAwardsPanelProps {
  balance: number;
  streak: number;
  weekPoints: number;
  completedRuleIds: Set<ActivityRuleId>;
  levelId: ActivityLevelId;
  t: (key: string) => string;
}

const AwardTile: React.FC<{
  award: ActivityAwardDef;
  unlocked: boolean;
  title: string;
  subtitle?: string;
  isNew?: boolean;
}> = ({ award, unlocked, title, subtitle, isNew }) => {
  const Icon = awardIconMap[award.icon];
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex aspect-square w-full items-center justify-center rounded-2xl border transition-all ${
          unlocked
            ? 'border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm'
            : 'border-slate-200 bg-slate-50'
        }`}
      >
        <Icon
          className={`h-9 w-9 sm:h-10 sm:w-10 ${unlocked ? 'text-indigo-600' : 'text-slate-300'}`}
          aria-hidden
        />
        {isNew && unlocked ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            new
          </span>
        ) : null}
        {!unlocked ? (
          <span className="absolute inset-0 rounded-2xl bg-white/50 backdrop-blur-[1px]" />
        ) : null}
      </div>
      <p className="mt-2.5 line-clamp-2 text-center text-xs font-semibold text-slate-800">{title}</p>
      {subtitle ? (
        <p className={`mt-0.5 text-center text-[10px] ${activityPage.muted}`}>{subtitle}</p>
      ) : null}
    </div>
  );
};

const ActivityAwardsPanel: React.FC<ActivityAwardsPanelProps> = ({
  balance,
  streak,
  weekPoints,
  completedRuleIds,
  levelId,
  t,
}) => {
  const ctx = useMemo(
    () => ({ balance, streak, weekPoints, completedRuleIds, levelId }),
    [balance, streak, weekPoints, completedRuleIds, levelId]
  );

  const records = ACTIVITY_AWARDS.filter((a) => a.section === 'records');
  const achievements = ACTIVITY_AWARDS.filter((a) => a.section === 'achievements');

  const unlockedIds = useMemo(
    () =>
      new Set(
        ACTIVITY_AWARDS.filter((a) => isActivityAwardUnlocked(a.id, ctx)).map((a) => a.id)
      ),
    [ctx]
  );

  const renderGrid = (items: ActivityAwardDef[]) => (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
      {items.map((award) => (
        <AwardTile
          key={award.id}
          award={award}
          unlocked={unlockedIds.has(award.id)}
          title={t(`activity.awards.${award.id}.title`)}
          subtitle={
            unlockedIds.has(award.id) ? t(`activity.awards.${award.id}.date`) : undefined
          }
          isNew={award.id === 'challenge3' && unlockedIds.has(award.id)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className={`mb-4 text-lg font-bold ${activityPage.title}`}>
          {t('activity.awards.recordsTitle')}
        </h2>
        {renderGrid(records)}
      </section>
      <div className="h-px bg-slate-200" aria-hidden />
      <section>
        <h2 className={`mb-4 text-lg font-bold ${activityPage.title}`}>
          {t('activity.awards.achievementsTitle')}
        </h2>
        {renderGrid(achievements)}
      </section>
    </div>
  );
};

export default ActivityAwardsPanel;

import React from 'react';
import { Link } from 'react-router-dom';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ActivityLogEntry, ActivityRuleId } from '../../constants/activityPoints';
import { formatRelativeTime } from './activityPageUtils';
import { activityPage } from './activityUi';

interface ActivityFeedPanelProps {
  log: ActivityLogEntry[];
  weekPoints: number;
  weekActions: number;
  streak: number;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  ruleTitle: (id: ActivityRuleId) => string;
}

const ActivityFeedPanel: React.FC<ActivityFeedPanelProps> = ({
  log,
  weekPoints,
  weekActions,
  streak,
  locale,
  t,
  ruleTitle,
}) => {
  const recent = log.slice(0, 8);

  const feedActions = (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
      >
        <ThumbsUp className="h-4 w-4" aria-hidden />
        {t('activity.feed.interesting')}
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
      >
        <ThumbsDown className="h-4 w-4" aria-hidden />
        {t('activity.feed.useless')}
      </button>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className={`${activityPage.card} p-5 lg:col-span-2`}>
        <p className="text-base leading-relaxed text-slate-800 sm:text-lg">
          {t('activity.feed.weekSummary', {
            points: weekPoints.toLocaleString(),
            actions: weekActions,
            streak,
          })}
        </p>
        <p className={`mt-2 text-sm ${activityPage.muted}`}>{t('activity.feed.weekHint')}</p>
        {feedActions}
      </article>

      <article className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/80 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">{t('activity.feed.promoTitle')}</h3>
        <p className="mt-2 text-sm text-slate-600">{t('activity.feed.promoText')}</p>
        <Link
          to="/plan"
          className="mt-4 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-200/80 transition-all hover:ring-indigo-200"
        >
          {t('activity.feed.promoCta')}
        </Link>
      </article>

      {recent.length === 0 ? (
        <div className={`${activityPage.card} px-4 py-12 text-center lg:col-span-2`}>
          <p className="font-semibold text-slate-900">{t('activity.feed.empty')}</p>
          <p className={`mt-1 text-sm ${activityPage.muted}`}>{t('activity.feed.emptyHint')}</p>
        </div>
      ) : (
        recent.map((entry) => (
          <article key={entry.id} className={`${activityPage.card} ${activityPage.cardHover} p-5`}>
            <p className="text-sm leading-relaxed text-slate-800">
              {t('activity.feed.entry', {
                title: ruleTitle(entry.ruleId),
                points: entry.points,
              })}
            </p>
            <p className={`mt-2 text-xs ${activityPage.muted}`}>
              {formatRelativeTime(entry.createdAt, locale)}
            </p>
            {feedActions}
          </article>
        ))
      )}
    </div>
  );
};

export default ActivityFeedPanel;

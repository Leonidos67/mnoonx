import React from 'react';
import {
  ArrowRight,
  ChevronRight,
  Heart,
  ShoppingBag,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { ActivityLogEntry, ActivityRuleId } from '../../constants/activityPoints';
import { formatRelativeTime } from './activityPageUtils';
import ActivityStatsStrip, { type ActivityStatItem } from './ActivityStatsStrip';
import { activityPage } from './activityUi';

type OverviewTab = 'missions' | 'store' | 'feed' | 'awards' | 'history' | 'levels';

interface ActivityOverviewPanelProps {
  balance: number;
  levelName: string;
  levelProgress: number;
  levelProgressLabel: string;
  weekPoints: number;
  weekActions: number;
  streak: number;
  unclaimedCount: number;
  missionsDone: number;
  missionsTotal: number;
  purchasedCount: number;
  recentLog: ActivityLogEntry[];
  onGoTab: (tab: OverviewTab) => void;
  onClaimAll: () => void;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  ruleTitle: (id: ActivityRuleId) => string;
}

const ActivityOverviewPanel: React.FC<ActivityOverviewPanelProps> = ({
  balance,
  levelName,
  levelProgress,
  levelProgressLabel,
  weekPoints,
  weekActions,
  streak,
  unclaimedCount,
  missionsDone,
  missionsTotal,
  purchasedCount,
  recentLog,
  onGoTab,
  onClaimAll,
  locale,
  t,
  ruleTitle,
}) => {
  const stats: ActivityStatItem[] = [
    {
      id: 'balance',
      label: t('activity.coinsLabel'),
      value: balance.toLocaleString(),
      hint: levelName,
      accent: 'rose',
      highlight: true,
    },
    {
      id: 'week',
      label: t('activity.stats.weekPoints'),
      value: weekPoints.toLocaleString(),
      hint: t('activity.overview.weekActionsHint', { count: weekActions }),
      accent: 'indigo',
    },
    {
      id: 'streak',
      label: t('activity.streakTitle'),
      value: String(streak),
      hint: t('activity.streakDays', { count: streak }),
      accent: 'amber',
    },
    {
      id: 'missions',
      label: t('activity.overview.readyToClaim'),
      value: String(unclaimedCount),
      hint: t('activity.missionsProgress', { done: missionsDone, total: missionsTotal }),
      accent: 'emerald',
    },
  ];

  const loopSteps = [
    {
      id: 'earn',
      title: t('activity.overview.loopEarn'),
      desc: t('activity.overview.loopEarnDesc'),
      tab: 'missions' as const,
      icon: Sparkles,
      gradient: 'from-violet-500 to-indigo-600',
    },
    {
      id: 'collect',
      title: t('activity.overview.loopCollect'),
      desc: t('activity.overview.loopCollectDesc'),
      tab: 'missions' as const,
      icon: Heart,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      id: 'level',
      title: t('activity.overview.loopLevel'),
      desc: t('activity.overview.loopLevelDesc'),
      tab: 'levels' as const,
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      id: 'spend',
      title: t('activity.overview.loopSpend'),
      desc: t('activity.overview.loopSpendDesc'),
      tab: 'store' as const,
      icon: ShoppingBag,
      gradient: 'from-emerald-500 to-teal-600',
    },
  ];

  const quickLinks = [
    {
      tab: 'missions' as const,
      label: t('activity.tabs.missions'),
      desc: t('activity.overview.quickMissions'),
      badge: unclaimedCount > 0 ? String(unclaimedCount) : undefined,
    },
    {
      tab: 'store' as const,
      label: t('activity.tabs.store'),
      desc: t('activity.overview.quickStore', { count: purchasedCount }),
      badge: undefined,
    },
    {
      tab: 'awards' as const,
      label: t('activity.tabs.awards'),
      desc: t('activity.overview.quickAwards'),
      badge: undefined,
    },
    {
      tab: 'feed' as const,
      label: t('activity.tabs.feed'),
      desc: t('activity.overview.quickFeed'),
      badge: undefined,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className={`${activityPage.heroCard} overflow-hidden p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {t('activity.bankTitle')}
            </p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
                {balance.toLocaleString()}
              </span>
              <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Heart className="h-5 w-5 fill-white text-white" aria-hidden />
              </span>
            </div>
            <p className="mt-2 text-sm text-white/80">{t('activity.overview.heroHint')}</p>
          </div>
          {unclaimedCount > 0 ? (
            <button
              type="button"
              onClick={onClaimAll}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50 active:scale-[0.98]"
            >
              {t('activity.claimAll')}
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                {unclaimedCount}
              </span>
            </button>
          ) : null}
        </div>
        <div className="mt-5 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">{levelName}</span>
            <span className="text-xs text-white/70">{levelProgressLabel}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      <ActivityStatsStrip items={stats} />

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          {t('activity.overview.loopTitle')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {loopSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onGoTab(step.tab)}
                className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md ${activityPage.cardHover}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${step.gradient}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-indigo-600">
                      {t('activity.overview.step', { n: index + 1 })}
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-900">{step.title}</p>
                    <p className={`mt-1 text-sm leading-snug ${activityPage.muted}`}>{step.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          {t('activity.overview.quickTitle')}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <button
              key={link.tab}
              type="button"
              onClick={() => onGoTab(link.tab)}
              className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30 ${activityPage.cardHover}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{link.label}</p>
                <p className={`text-sm ${activityPage.muted}`}>{link.desc}</p>
              </div>
              {link.badge ? (
                <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">
                  {link.badge}
                </span>
              ) : null}
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            </button>
          ))}
        </div>
      </section>

      {recentLog.length > 0 ? (
        <section className={`${activityPage.card} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">{t('activity.overview.recentTitle')}</h3>
            <button
              type="button"
              onClick={() => onGoTab('history')}
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              {t('activity.overview.recentAll')}
            </button>
          </div>
          <ul className="space-y-3">
            {recentLog.slice(0, 4).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {ruleTitle(entry.ruleId)}
                  </p>
                  <p className={`text-xs ${activityPage.muted}`}>
                    {formatRelativeTime(entry.createdAt, locale)}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-sm font-bold text-rose-700">
                  +{entry.points}
                  <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

export default ActivityOverviewPanel;

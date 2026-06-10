import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart2,
  CalendarCheck,
  ChevronRight,
  Clock,
  Heart,
  Layout,
  LayoutGrid,
  ListTodo,
  MessageSquare,
  PenLine,
  Repeat2,
  Rss,
  Send,
  ShoppingBag,
  Star,
  Trophy,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profilePath } from '../constants/paths';
import ActivityAwardsPanel from '../components/Activity/ActivityAwardsPanel';
import ActivityBalanceCard from '../components/Activity/ActivityBalanceCard';
import ActivityCoinsMobileBlock from '../components/Activity/ActivityCoinsMobileBlock';
import ActivityFeedPanel from '../components/Activity/ActivityFeedPanel';
import ActivityOverviewPanel from '../components/Activity/ActivityOverviewPanel';
import ActivityStorePanel from '../components/Activity/ActivityStorePanel';
import ActivityVkTaskRow from '../components/Activity/ActivityVkTaskRow';
import { activityPage } from '../components/Activity/activityUi';
import { formatRelativeTime } from '../components/Activity/activityPageUtils';
import {
  ACTIVITY_LEVEL_IDS,
  ACTIVITY_LEVEL_STYLES,
  ACTIVITY_LEVEL_THRESHOLDS,
  ACTIVITY_POINTS,
  ACTIVITY_RULE_CATEGORY,
  ACTIVITY_RULE_IDS,
  type ActivityRuleCategory,
  type ActivityRuleId,
} from '../constants/activityPoints';
import { useActivityPurchases } from '../hooks/useActivityPurchases';
import { useActivityPoints } from '../hooks/useActivityPoints';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useTranslation } from '../i18n/useTranslation';

const RULE_ICONS: Record<ActivityRuleId, LucideIcon> = {
  post: PenLine,
  comment: MessageSquare,
  likeReceived: Heart,
  repost: Repeat2,
  follow: UserPlus,
  follower: Users,
  message: Send,
  communityJoin: UsersRound,
  communityPost: Layout,
  dailyVisit: CalendarCheck,
};

type TabId = 'overview' | 'missions' | 'store' | 'history' | 'levels' | 'feed' | 'awards';
type CategoryFilter = 'all' | ActivityRuleCategory;

const TAB_ICONS: Record<TabId, LucideIcon> = {
  overview: LayoutGrid,
  missions: ListTodo,
  store: ShoppingBag,
  history: Clock,
  levels: BarChart2,
  feed: Rss,
  awards: Trophy,
};

function formatSectionDate(iso: string, locale: string): string {
  const d = new Date(iso);
  const today = new Date();
  const key = d.toISOString().slice(0, 10);
  const todayKey = today.toISOString().slice(0, 10);
  if (key === todayKey) return locale.startsWith('ru') ? 'СЕГОДНЯ' : 'TODAY';
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

const Activity: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const {
    balance,
    log,
    level,
    weekPoints,
    weekActions,
    completedRuleIds,
    unclaimedRuleIds,
    claimRules,
    streak,
    refresh,
  } = useActivityPoints();
  const { purchasedIds, purchaseItem } = useActivityPurchases(refresh);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [tab, setTab] = useState<TabId>('overview');
  const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const profileBack = user?.username ? profilePath(user.username) : '/';

  useEffect(() => {
    if (isDesktop) setMobileView('menu');
  }, [isDesktop]);

  const rules = useMemo(
    () =>
      ACTIVITY_RULE_IDS.map((id) => ({
        id,
        category: ACTIVITY_RULE_CATEGORY[id],
        points: ACTIVITY_POINTS[id],
        icon: RULE_ICONS[id],
        title: t(`activity.rules.${id}.title`),
        description: t(`activity.rules.${id}.description`),
        completed: completedRuleIds.has(id),
        claimable: unclaimedRuleIds.includes(id),
      })),
    [t, completedRuleIds, unclaimedRuleIds]
  );

  const activeRules = useMemo(
    () =>
      rules.filter((r) => {
        if (category !== 'all' && r.category !== category) return false;
        return !r.completed || r.claimable;
      }),
    [rules, category]
  );

  const inProgressRules = useMemo(
    () => activeRules.filter((r) => !r.completed),
    [activeRules]
  );

  const claimableRules = useMemo(
    () => activeRules.filter((r) => r.claimable),
    [activeRules]
  );

  type RuleRow = (typeof rules)[number];

  const claimableByDate = useMemo(() => {
    const groups = new Map<string, RuleRow[]>();
    claimableRules.forEach((rule) => {
      const entry = log.find((e) => e.ruleId === rule.id);
      const label = entry
        ? formatSectionDate(entry.createdAt, locale)
        : locale.startsWith('ru')
          ? 'СЕГОДНЯ'
          : 'TODAY';
      const list = groups.get(label) ?? [];
      list.push(rule);
      groups.set(label, list);
    });
    return Array.from(groups.entries());
  }, [claimableRules, log, locale]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: t('activity.tabs.overview') },
    { id: 'missions', label: t('activity.tabs.missions') },
    { id: 'store', label: t('activity.tabs.store') },
    { id: 'feed', label: t('activity.tabs.feed') },
    { id: 'awards', label: t('activity.tabs.awards') },
    { id: 'history', label: t('activity.tabs.history') },
    { id: 'levels', label: t('activity.tabs.levels') },
  ];

  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0];

  const selectTab = (id: TabId) => {
    setTab(id);
    if (!isDesktop) setMobileView('content');
  };

  const categoryFilters: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: t('activity.categories.all') },
    { id: 'content', label: t('activity.categories.content') },
    { id: 'social', label: t('activity.categories.social') },
    { id: 'community', label: t('activity.categories.community') },
    { id: 'daily', label: t('activity.categories.daily') },
  ];

  const handleClaimAll = useCallback(() => {
    claimRules(unclaimedRuleIds);
  }, [claimRules, unclaimedRuleIds]);

  const levelProgressLabel = level.next
    ? t('activity.levelProgress', {
        points: level.pointsToNext.toLocaleString(),
        next: t(`activity.levels.${level.next}.name`),
      })
    : t('activity.maxLevel');

  const showMenu = isDesktop || mobileView === 'menu';
  const showContent = isDesktop || mobileView === 'content';

  const missionsDone = rules.filter((r) => r.completed).length;
  const missionsTotal = rules.length;
  const purchasedCount = purchasedIds.size;

  const renderContent = () => {
    switch (tab) {
      case 'overview':
        return (
          <ActivityOverviewPanel
            balance={balance}
            levelName={t(`activity.levels.${level.id}.name`)}
            levelProgress={level.progress}
            levelProgressLabel={levelProgressLabel}
            weekPoints={weekPoints}
            weekActions={weekActions}
            streak={streak}
            unclaimedCount={unclaimedRuleIds.length}
            missionsDone={missionsDone}
            missionsTotal={missionsTotal}
            purchasedCount={purchasedCount}
            recentLog={log}
            onGoTab={selectTab}
            onClaimAll={handleClaimAll}
            locale={locale}
            t={t}
            ruleTitle={(id) => t(`activity.rules.${id}.title`)}
          />
        );
      case 'store':
        return (
          <ActivityStorePanel
            balance={balance}
            purchasedIds={purchasedIds}
            onPurchase={purchaseItem}
            t={t}
          />
        );
      case 'missions':
        return (
          <div className="mx-auto w-full max-w-3xl space-y-5">
            <div className={`${activityPage.card} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t('activity.overview.missionsHeader')}</h2>
                  <p className={`mt-1 text-sm ${activityPage.muted}`}>
                    {t('activity.overview.missionsHeaderHint')}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-indigo-600">
                    {t('activity.missionsProgress', { done: missionsDone, total: missionsTotal })}
                  </p>
                </div>
                {unclaimedRuleIds.length > 0 ? (
                  <button type="button" onClick={handleClaimAll} className={activityPage.claimBtn}>
                    {t('activity.claimAll')}
                    <Heart className="h-3.5 w-3.5 fill-white" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
                        {categoryFilters.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setCategory(f.id)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                              category === f.id ? activityPage.chipActive : activityPage.chipIdle
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {claimableByDate.map(([dateLabel, group]) => (
                        <section key={dateLabel}>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              {dateLabel}
                            </p>
                            {dateLabel !== (locale.startsWith('ru') ? 'СЕГОДНЯ' : 'TODAY') ? (
                              <span className="text-xs font-semibold text-rose-500">
                                {t('activity.expiresSoon')}
                              </span>
                            ) : null}
                          </div>
                          <ul className="space-y-2.5">
                    {group.map((rule) => (
                      <li key={rule.id}>
                        <ActivityVkTaskRow
                          icon={rule.icon}
                          title={rule.title}
                          description={rule.description}
                          points={rule.points}
                          category={rule.category}
                          completed
                          claimable
                          completedLabel={t('activity.statusCompleted')}
                          claimLabel={t('activity.claim', { points: rule.points })}
                          onClaim={() => claimRules([rule.id])}
                        />
                      </li>
                    ))}
                          </ul>
                        </section>
                      ))}

                      {inProgressRules.length > 0 ? (
                        <section>
                          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {t('activity.today')}
                          </p>
                          <ul className="space-y-2.5">
                    {inProgressRules.map((rule, index) => (
                      <motion.li
                        key={rule.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <ActivityVkTaskRow
                          icon={rule.icon}
                          title={rule.title}
                          description={rule.description}
                          points={rule.points}
                          category={rule.category}
                          completed={false}
                          claimable={false}
                          completedLabel={t('activity.statusCompleted')}
                          claimLabel={t('activity.claim', { points: rule.points })}
                          progress={rule.id === 'dailyVisit' ? Math.min(100, streak * 14) : 0}
                          progressHint={
                            rule.id === 'dailyVisit'
                              ? t('activity.streakDays', { count: streak })
                              : undefined
                          }
                        />
                      </motion.li>
                    ))}
                          </ul>
                        </section>
                      ) : null}

                      {inProgressRules.length === 0 && claimableRules.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
                          <p className="font-semibold text-slate-900">{t('activity.missionsAllDone')}</p>
                          <p className={`mt-1 text-sm ${activityPage.muted}`}>
                            {t('activity.missionsAllDoneHint')}
                          </p>
                        </div>
                      ) : null}
                    </div>
        );
      case 'history':
        return (
          <section className="mx-auto w-full max-w-2xl">
                      <div className="mb-5 border-b border-slate-100 pb-4">
                        <h2 className="text-xl font-bold text-slate-900">{t('activity.historyTitle')}</h2>
                        <p className={`mt-1 text-sm ${activityPage.muted}`}>
                          {t('activity.historySubtitle')}
                        </p>
                      </div>
                      {log.length === 0 ? (
                        <div className="py-12 text-center">
                          <Star className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
                          <p className="mt-3 font-semibold text-slate-900">{t('activity.historyEmpty')}</p>
                          <p className={`mt-1 text-sm ${activityPage.muted}`}>
                            {t('activity.historyEmptyHint')}
                          </p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {log.map((entry) => {
                            const Icon = RULE_ICONS[entry.ruleId];
                            const cat = ACTIVITY_RULE_CATEGORY[entry.ruleId];
                            return (
                              <li key={entry.id} className="flex items-center gap-4 py-3.5 first:pt-0">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                  <Icon className="h-5 w-5" aria-hidden />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {t(`activity.rules.${entry.ruleId}.title`)}
                                  </p>
                                  <p className={`text-xs ${activityPage.muted}`}>
                                    {formatRelativeTime(entry.createdAt, locale)} ·{' '}
                                    {t(`activity.categories.${cat}`)}
                                  </p>
                                </div>
                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">
                                  +{entry.points}
                                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500" aria-hidden />
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
        );
      case 'levels':
        return (
          <section className="mx-auto w-full max-w-2xl space-y-3">
                      <p className={`text-sm ${activityPage.muted}`}>{t('activity.levelsHint')}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {ACTIVITY_LEVEL_IDS.map((id, index) => {
                          const styles = ACTIVITY_LEVEL_STYLES[id];
                          const threshold = ACTIVITY_LEVEL_THRESHOLDS[id];
                          const unlocked = balance >= threshold;
                          const isCurrent = level.id === id;
                          return (
                            <div
                              key={id}
                              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                                isCurrent
                                  ? 'border-indigo-200 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                                  : 'border-slate-200/80 bg-white'
                              } ${!unlocked ? 'opacity-45' : ''}`}
                            >
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${styles.gradient}`}
                              >
                                <span className="text-lg font-extrabold">{index + 1}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900">
                                  {t(`activity.levels.${id}.name`)}
                                </p>
                                <p className={`text-xs ${activityPage.muted}`}>
                                  {t('activity.levelFrom', { points: threshold.toLocaleString() })}
                                </p>
                              </div>
                              {isCurrent ? (
                                <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white">
                                  {t('activity.currentLevel')}
                                </span>
                              ) : unlocked ? (
                                <span className="text-emerald-500">✓</span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </section>
        );
      case 'feed':
        return (
                    <ActivityFeedPanel
                      log={log}
                      weekPoints={weekPoints}
                      weekActions={weekActions}
                      streak={streak}
                      locale={locale}
                      t={t}
                      ruleTitle={(id) => t(`activity.rules.${id}.title`)}
                    />
        );
      case 'awards':
        return (
                    <ActivityAwardsPanel
                      balance={balance}
                      streak={streak}
                      weekPoints={weekPoints}
                      completedRuleIds={completedRuleIds}
                      levelId={level.id}
                      t={t}
                    />
        );
      default:
        return null;
    }
  };

  return (
    <div className={activityPage.shell}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px]">
      <div className="flex h-full min-h-0 w-full flex-1">
        <aside
          className={`flex h-full min-h-0 flex-col border-slate-200/80 bg-white/60 backdrop-blur-sm lg:w-72 lg:shrink-0 lg:border-r ${
            showMenu ? 'w-full max-lg:flex' : 'max-lg:hidden'
          }`}
        >
          <nav className="flex min-h-0 flex-1 flex-col p-2">
            <div className="shrink-0 space-y-2 px-2 pt-2">
              <div className="flex items-center gap-2">
                <Link
                  to={profileBack}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-black/5 lg:hidden"
                  aria-label={t('activity.backToProfile')}
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </Link>
                <h1 className="min-w-0 text-xl font-semibold text-neutral-800">
                  {t('activity.bankTitle')}
                </h1>
              </div>
              <p className="hidden text-sm text-neutral-500 lg:block">{t('activity.subtitleVk')}</p>
            </div>

            <div className="hidden px-2 lg:block lg:mt-4">
              <ActivityBalanceCard
                balance={balance}
                levelName={t(`activity.levels.${level.id}.name`)}
                levelProgress={level.progress}
                levelProgressLabel={levelProgressLabel}
                coinsLabel={t('activity.coinsLabel')}
                mySafeLabel={t('activity.mySafe')}
                historyLabel={t('activity.tabs.history')}
                onHistory={() => selectTab('history')}
                onSafe={() => selectTab('store')}
              />
            </div>

            <div className="lg:hidden">
              <ActivityCoinsMobileBlock
                coinsLabel={t('activity.coinsLabel')}
                balance={balance}
                levelName={t(`activity.levels.${level.id}.name`)}
                levelProgress={level.progress}
                levelProgressLabel={levelProgressLabel}
              />
            </div>

            <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto lg:mt-3">
              {tabs.map((item) => {
                const Icon = TAB_ICONS[item.id];
                const isActive = tab === item.id;
                const badge =
                  item.id === 'missions' && unclaimedRuleIds.length > 0
                    ? unclaimedRuleIds.length
                    : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all active:scale-[0.99] lg:py-2.5 ${
                      isActive && isDesktop ? activityPage.navActive : activityPage.navIdle
                    } ${isActive && !isDesktop ? 'bg-slate-100 font-medium' : ''}`}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-neutral-700" aria-hidden />
                    <span className="min-w-0 flex-1 font-medium text-neutral-900">{item.label}</span>
                    {badge ? (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {badge}
                      </span>
                    ) : null}
                    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400 lg:hidden" aria-hidden />
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <main
          className={`min-h-0 flex-1 overflow-y-auto bg-white ${
            showContent ? 'max-lg:flex max-lg:flex-col' : 'max-lg:hidden'
          }`}
        >
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white/90 px-3 py-3 backdrop-blur-md lg:hidden">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileView('menu')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-black/5 active:scale-95"
                aria-label={t('activity.backToProfile')}
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
              <h2 className="min-w-0 truncate text-lg font-semibold text-neutral-900">
                {activeTab.label}
              </h2>
            </div>
            <span className="shrink-0 text-sm font-bold tabular-nums text-neutral-900">
              {balance.toLocaleString()} ★
            </span>
          </div>

          <div className="flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:p-8">
            <h2
              className={`mb-2 hidden text-2xl font-bold text-neutral-900 lg:block ${
                tab === 'store' || tab === 'overview' ? 'lg:hidden' : ''
              }`}
            >
              {activeTab.label}
            </h2>
            {renderContent()}
            <p className="mt-8 text-center text-xs text-neutral-400">{t('activity.footerNote')}</p>
          </div>
        </main>
      </div>
      </div>
    </div>
  );
};

export default Activity;

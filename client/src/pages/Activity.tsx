import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profilePath } from '../constants/paths';
import {
  ACTIVITY_POINTS,
  ACTIVITY_RULE_IDS,
  loadActivityPointsBalance,
} from '../constants/activityPoints';
import { useTranslation } from '../i18n/useTranslation';

const Activity: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const balance = useMemo(() => loadActivityPointsBalance(), []);

  const profileBack = user?.username ? profilePath(user.username) : '/';

  const rules = useMemo(
    () =>
      ACTIVITY_RULE_IDS.map((id) => ({
        id,
        points: ACTIVITY_POINTS[id],
        title: t(`activity.rules.${id}.title`),
        description: t(`activity.rules.${id}.description`),
      })),
    [t]
  );

  const maxPoints = Math.max(...rules.map((r) => r.points), 1);

  return (
    <div className="mx-auto h-full min-h-0 w-full max-w-[640px] overflow-y-auto border-x border-neutral-200 bg-white">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <Link
          to={profileBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-neutral-100"
          aria-label={t('activity.backToProfile')}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">{t('activity.title')}</h1>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        <section className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/70">{t('activity.balanceLabel')}</p>
              <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
                {balance.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-white/75">{t('activity.balanceHint')}</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Trophy className="h-6 w-6 text-amber-300" aria-hidden />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neutral-700" aria-hidden />
            <h2 className="text-base font-semibold text-neutral-900">{t('activity.howItWorksTitle')}</h2>
          </div>
          <ol className="space-y-3 text-sm leading-relaxed text-neutral-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-800">
                1
              </span>
              <span>{t('activity.howStep1')}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-800">
                2
              </span>
              <span>{t('activity.howStep2')}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-800">
                3
              </span>
              <span>{t('activity.howStep3')}</span>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-1 text-base font-semibold text-neutral-900">{t('activity.rulesTitle')}</h2>
          <p className="mb-4 text-sm text-neutral-500">{t('activity.rulesSubtitle')}</p>
          <ul className="space-y-3">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 transition-colors hover:bg-neutral-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">{rule.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{rule.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-black px-2.5 py-1 text-xs font-bold text-white tabular-nums">
                    +{rule.points}
                  </span>
                </div>
                <div
                  className="mt-3 h-1 overflow-hidden rounded-full bg-neutral-200"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-neutral-800 transition-all"
                    style={{ width: `${Math.round((rule.points / maxPoints) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="pb-6 text-center text-xs text-neutral-400">{t('activity.footerNote')}</p>
      </div>
    </div>
  );
};

export default Activity;

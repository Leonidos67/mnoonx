import React, { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PricingCard from '../components/Plan/PricingCard';
import {
  DEFAULT_PLAN_TIER,
  PLAN_FEATURE_KEYS,
  PLAN_TIER_ORDER,
  type PlanBillingPeriod,
  type PlanTierId,
  planPriceUsd,
  planTierRank,
} from '../constants/planTiers';
import { useTranslation } from '../i18n/useTranslation';

const CURRENT_PLAN_KEY = 'mnoonx-plan-tier';

function readStoredPlanTier(): PlanTierId {
  try {
    const raw = localStorage.getItem(CURRENT_PLAN_KEY);
    if (raw && PLAN_TIER_ORDER.includes(raw as PlanTierId)) return raw as PlanTierId;
  } catch {
    /* ignore */
  }
  return DEFAULT_PLAN_TIER;
}

const Plan: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [billing, setBilling] = useState<PlanBillingPeriod>('monthly');
  const [currentTier] = useState<PlanTierId>(readStoredPlanTier);

  const featureLabel = useCallback((key: string) => t(`plan.features.${key}`), [t]);

  const handleSelect = useCallback(
    (tier: PlanTierId) => {
      if (tier === currentTier) return;
      if (!isAuthenticated) {
        window.dispatchEvent(new CustomEvent('openLogin'));
        return;
      }
      if (planTierRank(tier) < planTierRank(currentTier)) {
        showToast(t('plan.downgradeSoon'), 'info');
        return;
      }
      showToast(t('plan.comingSoon'), 'info');
    },
    [currentTier, isAuthenticated, showToast, t]
  );

  const cards = useMemo(
    () =>
      PLAN_TIER_ORDER.map((tier) => (
        <PricingCard
          key={tier}
          tier={tier}
          billing={billing}
          featureKeys={PLAN_FEATURE_KEYS[tier]}
          isPopular={tier === 'creator'}
          isCurrent={tier === currentTier}
          popularLabel={t('plan.popular')}
          name={t(`plan.tiers.${tier}.name`)}
          subtitle={t(`plan.tiers.${tier}.subtitle`)}
          perMonthLabel={t('plan.perMonth')}
          yearlyBilledNote={
            billing === 'yearly' && planPriceUsd(tier, billing) > 0
              ? t('plan.yearlyBilled', { total: planPriceUsd(tier, billing) })
              : undefined
          }
          priceFromLabel={t('plan.priceFrom')}
          currentPlanLabel={t('plan.currentPlan')}
          ctaLabel={t('plan.upgradeTo', { name: t(`plan.tiers.${tier}.name`) })}
          featureLabel={featureLabel}
          onSelect={() => handleSelect(tier)}
        />
      )),
    [billing, currentTier, featureLabel, handleSelect, t]
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-10 pb-16 lg:px-8 lg:py-14">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {t('plan.pageTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600 sm:text-base">
          {t('plan.pageSubtitle')}
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 p-1">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              billing === 'monthly'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t('plan.billingMonthly')}
          </button>
          <button
            type="button"
            onClick={() => setBilling('yearly')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              billing === 'yearly'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t('plan.billingYearly')}
            <span className="ml-1.5 text-xs font-medium text-emerald-600">{t('plan.billingYearlySave')}</span>
          </button>
        </div>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{cards}</div>
    </div>
  );
};

export default Plan;

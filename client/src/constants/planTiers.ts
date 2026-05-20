export const PLAN_TIER_IDS = ['free', 'pro', 'creator', 'community'] as const;

export type PlanTierId = (typeof PLAN_TIER_IDS)[number];

export type PlanBillingPeriod = 'monthly' | 'yearly';

/** Monthly prices in USD */
export const PLAN_MONTHLY_USD: Record<PlanTierId, number> = {
  free: 0,
  pro: 12,
  creator: 25,
  community: 79,
};

export const PLAN_TIER_ORDER: PlanTierId[] = [...PLAN_TIER_IDS];

/** Feature translation keys under plan.features.* */
export const PLAN_FEATURE_KEYS: Record<PlanTierId, string[]> = {
  free: [
    'profilePosts',
    'publicCommunities',
    'basicFeed',
    'oneCommunity',
    'aiBasic',
  ],
  pro: [
    'higherLimits',
    'smartFeed',
    'postTemplates',
    'profileAnalytics',
    'threeCommunities',
  ],
  creator: [
    'allPro',
    'tenCommunities',
    'communityMonetization',
    'customBranding',
    'postBoost',
    'exclusiveAi',
    'communityAnalytics',
    'payouts',
  ],
  community: [
    'allCreator',
    'unlimitedCommunities',
    'whiteLabel',
    'prioritySupport',
    'apiAccess',
    'higherStorage',
  ],
};

export function planPriceUsd(tier: PlanTierId, billing: PlanBillingPeriod): number {
  const monthly = PLAN_MONTHLY_USD[tier];
  if (billing === 'monthly' || monthly === 0) return monthly;
  return Math.round(monthly * 12 * 0.8);
}

export function planDisplayMonthlyUsd(tier: PlanTierId, billing: PlanBillingPeriod): number {
  const monthly = PLAN_MONTHLY_USD[tier];
  if (billing === 'monthly' || monthly === 0) return monthly;
  return Math.round((monthly * 12 * 0.8) / 12);
}

export function planTierRank(tier: PlanTierId): number {
  return PLAN_TIER_ORDER.indexOf(tier);
}

export const DEFAULT_PLAN_TIER: PlanTierId = 'free';

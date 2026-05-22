import {
  DEFAULT_PLAN_TIER,
  PLAN_TIER_ORDER,
  planTierRank,
  type PlanTierId,
} from '../constants/planTiers';

export const CURRENT_PLAN_KEY = 'mnoonx-plan-tier';

export function readStoredPlanTier(): PlanTierId {
  try {
    const raw = localStorage.getItem(CURRENT_PLAN_KEY);
    if (raw && PLAN_TIER_ORDER.includes(raw as PlanTierId)) return raw as PlanTierId;
  } catch {
    /* ignore */
  }
  return DEFAULT_PLAN_TIER;
}

export function saveStoredPlanTier(tier: PlanTierId): void {
  try {
    localStorage.setItem(CURRENT_PLAN_KEY, tier);
    window.dispatchEvent(new CustomEvent('planTierChanged'));
  } catch {
    /* ignore */
  }
}

/** Pro, Creator, or Community */
export function hasProSubscription(): boolean {
  return planTierRank(readStoredPlanTier()) >= planTierRank('pro');
}

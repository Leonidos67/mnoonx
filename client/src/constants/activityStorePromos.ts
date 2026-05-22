import type { ActivityStoreCategory, ActivityStoreItem } from './activityStore';

export const ACTIVITY_STORE_PROMO_CODE_IDS = ['PROMO100'] as const;
export type ActivityStorePromoCodeId = (typeof ACTIVITY_STORE_PROMO_CODE_IDS)[number];

export interface ActivityStorePromoDefinition {
  id: ActivityStorePromoCodeId;
  /** Case-insensitive match */
  code: string;
  discountPercent: number;
  unlimitedUses: boolean;
  /** Omit = all categories */
  categories?: ActivityStoreCategory[];
}

export const ACTIVITY_STORE_PROMOS: ActivityStorePromoDefinition[] = [
  {
    id: 'PROMO100',
    code: 'PROMO100',
    discountPercent: 100,
    unlimitedUses: true,
    categories: ['stickers'],
  },
];

export function normalizePromoCodeInput(raw: string): string {
  return raw.trim().toUpperCase();
}

export function findStorePromoByInput(raw: string): ActivityStorePromoDefinition | undefined {
  const normalized = normalizePromoCodeInput(raw);
  if (!normalized) return undefined;
  return ACTIVITY_STORE_PROMOS.find((p) => p.code.toUpperCase() === normalized);
}

export function getDiscountedStorePrice(price: number, discountPercent: number): number {
  const pct = Math.min(100, Math.max(0, discountPercent));
  return Math.max(0, Math.round(price * (1 - pct / 100)));
}

export type StorePromoResolveError = 'invalid' | 'category';

export function resolveStorePromoForItem(
  rawCode: string,
  item: ActivityStoreItem
):
  | {
      ok: true;
      promo: ActivityStorePromoDefinition;
      originalPrice: number;
      finalPrice: number;
    }
  | { ok: false; error: StorePromoResolveError } {
  const promo = findStorePromoByInput(rawCode);
  if (!promo) return { ok: false, error: 'invalid' };
  if (promo.categories && !promo.categories.includes(item.category)) {
    return { ok: false, error: 'category' };
  }
  return {
    ok: true,
    promo,
    originalPrice: item.price,
    finalPrice: getDiscountedStorePrice(item.price, promo.discountPercent),
  };
}

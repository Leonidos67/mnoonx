export const ACTIVITY_STORE_PURCHASES_KEY = 'mnoonx-activity-store-purchases';

export const ACTIVITY_STORE_CATEGORIES = ['statuses', 'coupons', 'stickers'] as const;
export type ActivityStoreCategory = (typeof ACTIVITY_STORE_CATEGORIES)[number];

export const ACTIVITY_STORE_ITEM_IDS = [
  'status-promo-cat',
  'status-level-80',
  'status-hamster',
  'status-scarf-cat',
  'coupon-welcome-10',
  'coupon-feed-boost',
  'sticker-ham-pack',
] as const;

export type ActivityStoreItemId = (typeof ACTIVITY_STORE_ITEM_IDS)[number];

export interface ActivityStoreItem {
  id: ActivityStoreItemId;
  category: ActivityStoreCategory;
  price: number;
  preview: 'cat-coupon' | 'level-80' | 'hamster' | 'scarf-cat' | 'coupon' | 'chameleon';
  bgClass: string;
}

export const ACTIVITY_STORE_ITEMS: ActivityStoreItem[] = [
  {
    id: 'status-promo-cat',
    category: 'statuses',
    price: 100,
    preview: 'cat-coupon',
    bgClass: 'from-amber-100 via-orange-50 to-amber-50',
  },
  {
    id: 'status-level-80',
    category: 'statuses',
    price: 150,
    preview: 'level-80',
    bgClass: 'from-amber-50 via-yellow-50 to-orange-50',
  },
  {
    id: 'status-hamster',
    category: 'statuses',
    price: 120,
    preview: 'hamster',
    bgClass: 'from-stone-100 via-amber-50 to-stone-50',
  },
  {
    id: 'status-scarf-cat',
    category: 'statuses',
    price: 100,
    preview: 'scarf-cat',
    bgClass: 'from-orange-50 via-amber-50 to-rose-50',
  },
  {
    id: 'coupon-welcome-10',
    category: 'coupons',
    price: 50,
    preview: 'coupon',
    bgClass: 'from-sky-50 via-blue-50 to-indigo-50',
  },
  {
    id: 'coupon-feed-boost',
    category: 'coupons',
    price: 80,
    preview: 'coupon',
    bgClass: 'from-cyan-50 via-sky-50 to-blue-50',
  },
  {
    id: 'sticker-ham-pack',
    category: 'stickers',
    price: 2800,
    preview: 'chameleon',
    bgClass: 'from-pink-50 via-rose-50 to-pink-100',
  },
];

export function loadPurchasedStoreIds(): Set<ActivityStoreItemId> {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORE_PURCHASES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((id): id is ActivityStoreItemId =>
        (ACTIVITY_STORE_ITEM_IDS as readonly string[]).includes(id)
      )
    );
  } catch {
    return new Set();
  }
}

function savePurchasedStoreIds(ids: Set<ActivityStoreItemId>): void {
  try {
    localStorage.setItem(ACTIVITY_STORE_PURCHASES_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* ignore */
  }
}

export function getStoreItemsByCategory(category: ActivityStoreCategory): ActivityStoreItem[] {
  return ACTIVITY_STORE_ITEMS.filter((i) => i.category === category);
}

export function getStoreItem(id: ActivityStoreItemId): ActivityStoreItem | undefined {
  return ACTIVITY_STORE_ITEMS.find((i) => i.id === id);
}

export function markStoreItemPurchased(id: ActivityStoreItemId): Set<ActivityStoreItemId> {
  const ids = loadPurchasedStoreIds();
  ids.add(id);
  savePurchasedStoreIds(ids);
  return ids;
}

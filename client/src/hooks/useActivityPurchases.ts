import { useCallback, useState } from 'react';
import { MESSAGES_API } from '../config/api';
import {
  getStoreItem,
  loadPurchasedStoreIds,
  markStoreItemPurchased,
  type ActivityStoreItemId,
} from '../constants/activityStore';
import { ACTIVITY_STORE_STICKER_INSTALL } from '../constants/activityStoreStickers';
import { resolveStorePromoForItem } from '../constants/activityStorePromos';
import { spendActivityPoints } from '../constants/activityPoints';
import { useAuth } from '../context/AuthContext';

async function installMessengerStickerPack(token: string, slug: string) {
  try {
    await fetch(`${MESSAGES_API}/sticker-packs/${slug}/install`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* ignore */
  }
}

export function useActivityPurchases(onBalanceChange: () => void) {
  const { token } = useAuth();
  const [purchasedIds, setPurchasedIds] = useState(() => loadPurchasedStoreIds());

  const purchaseItem = useCallback(
    (itemId: ActivityStoreItemId, promoCode?: string): 'ok' | 'owned' | 'insufficient' => {
      const item = getStoreItem(itemId);
      if (!item) return 'insufficient';
      if (purchasedIds.has(itemId)) return 'owned';

      let price = item.price;
      if (promoCode?.trim()) {
        const resolved = resolveStorePromoForItem(promoCode, item);
        if (resolved.ok) price = resolved.finalPrice;
      }

      const spend = spendActivityPoints(price);
      if (!spend.ok) return 'insufficient';

      setPurchasedIds(markStoreItemPurchased(itemId));
      onBalanceChange();
      const packSlug = ACTIVITY_STORE_STICKER_INSTALL[itemId];
      if (packSlug && token) {
        void installMessengerStickerPack(token, packSlug);
      }
      return 'ok';
    },
    [purchasedIds, onBalanceChange, token]
  );

  return { purchasedIds, purchaseItem };
}

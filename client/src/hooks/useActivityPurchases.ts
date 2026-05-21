import { useCallback, useState } from 'react';
import { MESSAGES_API } from '../config/api';
import {
  getStoreItem,
  loadPurchasedStoreIds,
  markStoreItemPurchased,
  type ActivityStoreItemId,
} from '../constants/activityStore';
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
    (itemId: ActivityStoreItemId): 'ok' | 'owned' | 'insufficient' => {
      const item = getStoreItem(itemId);
      if (!item) return 'insufficient';
      if (purchasedIds.has(itemId)) return 'owned';

      const spend = spendActivityPoints(item.price);
      if (!spend.ok) return 'insufficient';

      setPurchasedIds(markStoreItemPurchased(itemId));
      onBalanceChange();
      if (itemId === 'sticker-ham-pack' && token) {
        void installMessengerStickerPack(token, 'kawaii');
      }
      return 'ok';
    },
    [purchasedIds, onBalanceChange, token]
  );

  return { purchasedIds, purchaseItem };
}

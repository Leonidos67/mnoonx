import { useCallback, useState } from 'react';
import {
  getStoreItem,
  loadPurchasedStoreIds,
  markStoreItemPurchased,
  type ActivityStoreItemId,
} from '../constants/activityStore';
import { spendActivityPoints } from '../constants/activityPoints';

export function useActivityPurchases(onBalanceChange: () => void) {
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
      return 'ok';
    },
    [purchasedIds, onBalanceChange]
  );

  return { purchasedIds, purchaseItem };
}

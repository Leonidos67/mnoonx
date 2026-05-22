import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import {
  ACTIVITY_STORE_CATEGORIES,
  getStoreItemsByCategory,
  getStoreItem,
  type ActivityStoreCategory,
  type ActivityStoreItem,
  type ActivityStoreItemId,
} from '../../constants/activityStore';
import { getStickerStoreMeta } from '../../constants/activityStoreStickers';
import {
  resolveStorePromoForItem,
  type ActivityStorePromoDefinition,
} from '../../constants/activityStorePromos';
import ActivityCoinBadge from './ActivityCoinBadge';

type StoreView = 'home' | ActivityStoreCategory | 'detail';

interface ActivityStorePanelProps {
  balance: number;
  purchasedIds: Set<ActivityStoreItemId>;
  onPurchase: (id: ActivityStoreItemId, promoCode?: string) => 'ok' | 'owned' | 'insufficient';
  t: (key: string, params?: Record<string, string | number>) => string;
}

const categoryGradients: Record<ActivityStoreCategory, string> = {
  statuses: 'from-teal-400 via-emerald-400 to-green-500',
  coupons: 'from-sky-400 via-blue-400 to-indigo-400',
  stickers: 'from-orange-300 via-amber-400 to-orange-500',
};

function StorePreviewArt({
  item,
}: {
  item: ActivityStoreItem;
}) {
  const stickerMeta = getStickerStoreMeta(item.id);
  if (stickerMeta) {
    return (
      <img
        src={stickerMeta.cardImageUrl}
        alt=""
        className="h-[72%] w-[72%] max-h-32 max-w-32 object-contain drop-shadow-md sm:max-h-40 sm:max-w-40"
        draggable={false}
      />
    );
  }

  const map: Record<ActivityStoreItem['preview'], string> = {
    'cat-coupon': '🐱',
    'level-80': '80',
    hamster: '🐹',
    'scarf-cat': '😺',
    coupon: '%',
    chameleon: '🦎',
  };
  const label = map[item.preview];
  if (item.preview === 'level-80') {
    return (
      <span className="bg-gradient-to-b from-amber-300 to-amber-600 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
        {label}
      </span>
    );
  }
  return <span className="text-5xl sm:text-6xl drop-shadow-sm">{label}</span>;
}

const ActivityStorePanel: React.FC<ActivityStorePanelProps> = ({
  balance,
  purchasedIds,
  onPurchase,
  t,
}) => {
  const [view, setView] = useState<StoreView>('home');
  const [detailId, setDetailId] = useState<ActivityStoreItemId | null>(null);
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<ActivityStorePromoDefinition | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const detailItem = detailId ? getStoreItem(detailId) : undefined;

  const openCategory = (cat: ActivityStoreCategory) => {
    setView(cat);
    setDetailId(null);
    setPurchaseMsg(null);
  };

  const openDetail = (id: ActivityStoreItemId) => {
    setDetailId(id);
    setView('detail');
    setPurchaseMsg(null);
    setPromoInput('');
    setAppliedPromo(null);
    setPromoError(null);
  };

  const resetPromoState = () => {
    setPromoInput('');
    setAppliedPromo(null);
    setPromoError(null);
  };

  const goBack = () => {
    if (view === 'detail') {
      const cat = detailItem?.category;
      setView(cat ?? 'home');
      setDetailId(null);
      resetPromoState();
      return;
    }
    setView('home');
    setDetailId(null);
    setPurchaseMsg(null);
    resetPromoState();
  };

  const handleApplyPromo = () => {
    if (!detailItem) return;
    const resolved = resolveStorePromoForItem(promoInput, detailItem);
    if (!resolved.ok) {
      setAppliedPromo(null);
      setPromoError(
        resolved.error === 'category'
          ? t('activity.store.promo.categoryMismatch')
          : t('activity.store.promo.invalid')
      );
      return;
    }
    setAppliedPromo(resolved.promo);
    setPromoError(null);
    setPurchaseMsg(null);
  };

  const handlePurchase = () => {
    if (!detailId) return;
    const promoForPurchase = appliedPromo?.code ?? (promoInput.trim() || undefined);
    const result = onPurchase(detailId, promoForPurchase);
    if (result === 'ok') setPurchaseMsg(t('activity.store.purchaseSuccess'));
    else if (result === 'owned') setPurchaseMsg(t('activity.store.alreadyOwned'));
    else setPurchaseMsg(t('activity.store.insufficient'));
  };

  const categoryItems = useMemo(() => {
    if (view === 'home' || view === 'detail') return [];
    return getStoreItemsByCategory(view as ActivityStoreCategory).filter(
      (i) => !purchasedIds.has(i.id)
    );
  }, [view, purchasedIds]);

  const allCategoryPurchased = (cat: ActivityStoreCategory) =>
    getStoreItemsByCategory(cat).every((i) => purchasedIds.has(i.id));

  const headerTitle =
    view === 'home'
      ? t('activity.store.title')
      : view === 'detail' && detailItem
        ? t(`activity.store.detailTitle.${detailItem.category}`)
        : t(`activity.store.categories.${view}`);

  const storeItemCard = (item: ActivityStoreItem, compact?: boolean) => {
    const owned = purchasedIds.has(item.id);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => !owned && openDetail(item.id)}
        disabled={owned}
        className={`group flex w-full flex-col text-left transition-transform active:scale-[0.98] ${
          owned ? 'cursor-default opacity-50' : ''
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.bgClass} ${
            compact ? 'aspect-square' : 'aspect-[4/3] sm:aspect-square'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 16px)',
            }}
            aria-hidden
          />
          <div className="relative flex h-full items-center justify-center p-4">
            <StorePreviewArt item={item} />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <span className="text-sm font-bold text-neutral-900">{item.price.toLocaleString()}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-violet-500">
            <span className="text-[8px] text-white">★</span>
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600 group-hover:text-neutral-900">
          {t(`activity.store.items.${item.id}.title`)}
        </p>
      </button>
    );
  };

  if (view === 'detail' && detailItem) {
    const owned = purchasedIds.has(detailItem.id);
    const isStickerPack = detailItem.category === 'stickers';
    const promoResolved =
      appliedPromo && detailItem
        ? resolveStorePromoForItem(appliedPromo.code, detailItem)
        : null;
    const finalPrice =
      promoResolved?.ok === true ? promoResolved.finalPrice : detailItem.price;
    const hasDiscount = finalPrice < detailItem.price;
    const canBuy = !owned && (finalPrice === 0 || balance >= finalPrice);
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 transition-colors hover:bg-neutral-200"
            aria-label={t('activity.backToProfile')}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <h2 className="flex-1 text-center text-lg font-semibold text-neutral-900">{headerTitle}</h2>
          <ActivityCoinBadge balance={balance} />
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${detailItem.bgClass} aspect-[16/10] sm:aspect-[2/1]`}
        >
          <div className="flex h-full items-center justify-center p-6">
            <StorePreviewArt item={detailItem} />
          </div>
        </div>

        <h3 className="mt-6 text-2xl font-bold text-neutral-900">
          {t(`activity.store.items.${detailItem.id}.title`)}
        </h3>
        <p className="mt-2 text-neutral-600 leading-relaxed">
          {t(`activity.store.items.${detailItem.id}.description`)}
        </p>

        {detailItem.category === 'stickers' && getStickerStoreMeta(detailItem.id) ? (
          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3">
            {getStickerStoreMeta(detailItem.id)!.previewImageUrls.map((url, i) => (
              <div
                key={url}
                className="flex aspect-square items-center justify-center rounded-2xl bg-neutral-100 p-2"
              >
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-contain"
                  draggable={false}
                  loading={i < 3 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        ) : null}

        {isStickerPack && !owned ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
            <label className="text-sm font-medium text-neutral-800" htmlFor="store-promo-code">
              {t('activity.store.promo.label')}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="store-promo-code"
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  setPromoError(null);
                  if (appliedPromo) setAppliedPromo(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyPromo();
                  }
                }}
                placeholder={t('activity.store.promo.placeholder')}
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none ring-violet-500/0 transition-shadow placeholder:text-neutral-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="shrink-0 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
              >
                {t('activity.store.promo.apply')}
              </button>
            </div>
            {promoError ? (
              <p className="mt-2 text-sm text-rose-600">{promoError}</p>
            ) : appliedPromo ? (
              <p className="mt-2 text-sm font-medium text-emerald-700">
                {t('activity.store.promo.applied', {
                  code: appliedPromo.code,
                  percent: appliedPromo.discountPercent,
                })}
              </p>
            ) : null}
          </div>
        ) : null}

        {purchaseMsg ? (
          <p className="mt-4 text-center text-sm font-medium text-indigo-600">{purchaseMsg}</p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <span className="text-base font-medium tabular-nums text-neutral-400 line-through">
                  {detailItem.price.toLocaleString()}
                </span>
              ) : null}
              <span className="text-2xl font-bold tabular-nums text-neutral-900">
                {finalPrice === 0 ? t('activity.store.promo.free') : finalPrice.toLocaleString()}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-violet-500">
                <span className="text-xs text-white">★</span>
              </span>
            </div>
          </div>
          {owned ? (
            <span className="rounded-xl bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-800">
              {t('activity.store.owned')}
            </span>
          ) : (
            <button
              type="button"
              onClick={handlePurchase}
              disabled={!canBuy}
              className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t('activity.store.get')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view !== 'home' && view !== 'detail') {
    const cat = view;
    const items = categoryItems;
    const empty = items.length === 0;

    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 transition-colors hover:bg-neutral-200"
            aria-label={t('activity.backToProfile')}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <h2 className="flex-1 text-center text-lg font-semibold text-neutral-900">{headerTitle}</h2>
          <ActivityCoinBadge balance={balance} />
        </div>

        {empty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-7xl" aria-hidden>
              ⭐
            </span>
            <p className="mt-6 max-w-sm text-neutral-600">{t('activity.store.emptyCategory')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {getStoreItemsByCategory(cat).map((item) => storeItemCard(item))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <h2 className="text-2xl font-bold text-neutral-900 lg:hidden">{t('activity.store.title')}</h2>

      {/* Bento — category entry */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => openCategory('statuses')}
          className={`relative col-span-1 row-span-2 min-h-[220px] overflow-hidden rounded-2xl bg-gradient-to-br ${categoryGradients.statuses} p-5 text-left text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] sm:min-h-[280px]`}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl"
            aria-hidden
          />
          <span className="relative mt-auto block text-xl font-bold sm:text-2xl">
            {t('activity.store.categories.statuses')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => openCategory('coupons')}
          className={`relative min-h-[100px] overflow-hidden rounded-2xl bg-gradient-to-br ${categoryGradients.coupons} p-4 text-left text-white shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] sm:min-h-[130px]`}
        >
          <span className="relative text-lg font-bold sm:text-xl">
            {t('activity.store.categories.coupons')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => openCategory('stickers')}
          className={`relative min-h-[100px] overflow-hidden rounded-2xl bg-gradient-to-br ${categoryGradients.stickers} p-4 text-left text-white shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] sm:min-h-[130px]`}
        >
          <span className="relative text-lg font-bold sm:text-xl">
            {t('activity.store.categories.stickers')}
          </span>
        </button>
      </div>

      {/* Sections with horizontal scroll */}
      {ACTIVITY_STORE_CATEGORIES.map((cat) => {
        const items = getStoreItemsByCategory(cat).slice(0, 4);
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <button
              type="button"
              onClick={() => openCategory(cat)}
              className="mb-3 flex w-full items-center justify-between text-left"
            >
              <h3 className="text-lg font-bold text-neutral-900">
                {t(`activity.store.categories.${cat}`)}
              </h3>
              <ChevronRight className="h-5 w-5 text-neutral-400" aria-hidden />
            </button>
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
              {items.map((item) => (
                <div key={item.id} className="w-[140px] shrink-0 sm:w-[160px]">
                  {storeItemCard(item, true)}
                </div>
              ))}
            </div>
            {allCategoryPurchased(cat) ? (
              <p className="mt-2 text-sm text-neutral-500">{t('activity.store.sectionAllBought')}</p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
};

export default ActivityStorePanel;

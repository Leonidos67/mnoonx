import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import TradingViewChart from '../AI/TradingViewChart';
import { AI_API } from '../../config/api';
import { useTranslation } from '../../i18n/useTranslation';
import type { SearchCoinResult } from '../../types/ai';
import type { PostCoinAttachment } from '../../types/postCoin';

export interface PostCoinAttachmentFormProps {
  initialValue?: PostCoinAttachment | null;
  onSave: (coin: PostCoinAttachment) => void;
  onCancel: () => void;
  variant?: 'modal' | 'sheet';
}

export const PostCoinAttachmentForm: React.FC<PostCoinAttachmentFormProps> = ({
  initialValue,
  onSave,
  onCancel,
  variant = 'modal',
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<SearchCoinResult | null>(null);
  const [results, setResults] = useState<SearchCoinResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setQuery(initialValue?.name ?? '');
    setName(initialValue?.name ?? '');
    setSelected(
      initialValue
        ? {
            id: initialValue.coinId,
            name: initialValue.name,
            symbol: initialValue.symbol,
            thumb: '',
            market_cap_rank: null,
          }
        : null
    );
    setResults([]);
    setError(null);
  }, [initialValue]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`${AI_API}/search?q=${encodeURIComponent(q)}`);
          if (!res.ok) throw new Error('search failed');
          const data = await res.json();
          setResults(Array.isArray(data.coins) ? data.coins : []);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  const pickCoin = (coin: SearchCoinResult) => {
    setSelected(coin);
    setName(coin.name);
    setQuery(coin.name);
    setResults([]);
    setError(null);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!selected?.id) {
      setError(t('postCoin.coinRequired'));
      return;
    }
    if (!trimmedName) {
      setError(t('postCoin.nameRequired'));
      return;
    }
    onSave({
      coinId: selected.id,
      name: trimmedName,
      symbol: selected.symbol,
    });
  };

  const previewSymbol = selected?.symbol ?? initialValue?.symbol ?? 'BTC';
  const footerClass =
    variant === 'sheet'
      ? 'flex shrink-0 justify-end gap-2 border-t border-neutral-200 pt-4'
      : 'flex shrink-0 justify-end gap-2 border-t border-neutral-200 px-5 py-4';
  const bodyClass =
    variant === 'sheet'
      ? 'min-h-0 flex-1 space-y-4 overflow-y-auto'
      : 'min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4';

  return (
    <div className={variant === 'sheet' ? 'flex min-h-0 flex-col' : 'flex max-h-[min(90vh,720px)] flex-col overflow-hidden'}>
      <div className={bodyClass}>
        <div>
          <label htmlFor="post-coin-search" className="mb-1.5 block text-sm font-medium text-neutral-700">
            {t('postCoin.searchLabel')}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              id="post-coin-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('postCoin.searchPlaceholder')}
              className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
            />
          </div>
          {searching ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t('postCoin.searching')}
            </div>
          ) : null}
          {results.length > 0 ? (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-1">
              {results.map((coin) => (
                <li key={coin.id}>
                  <button
                    type="button"
                    onClick={() => pickCoin(coin)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
                  >
                    {coin.thumb ? (
                      <img src={coin.thumb} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold uppercase text-neutral-600">
                        {coin.symbol.slice(0, 2)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-neutral-900">{coin.name}</span>
                      <span className="block truncate text-xs uppercase text-neutral-500">{coin.symbol}</span>
                    </span>
                    {coin.market_cap_rank != null ? (
                      <span className="text-xs text-neutral-400">#{coin.market_cap_rank}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {selected ? (
          <>
            <div>
              <label htmlFor="post-coin-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
                {t('postCoin.nameLabel')}
              </label>
              <input
                id="post-coin-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder={t('postCoin.namePlaceholder')}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">{t('postCoin.chartPreview')}</p>
              <div className="h-[220px] overflow-hidden rounded-xl border border-neutral-200 bg-white sm:h-[280px]">
                <TradingViewChart symbol={previewSymbol} height={220} className="h-full w-full" />
              </div>
            </div>
          </>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className={footerClass}>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          {t('postComposer.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!selected}
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {t('postCoin.save')}
        </button>
      </div>
    </div>
  );
};

interface PostCoinAttachmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (coin: PostCoinAttachment) => void;
  initialValue?: PostCoinAttachment | null;
}

const PostCoinAttachmentModal: React.FC<PostCoinAttachmentModalProps> = ({
  open,
  onClose,
  onSave,
  initialValue,
}) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-coin-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 id="post-coin-modal-title" className="text-lg font-semibold text-neutral-900">
            {t('postCoin.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label={t('postComposer.cancel')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <PostCoinAttachmentForm
          initialValue={initialValue}
          onSave={(coin) => {
            onSave(coin);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default PostCoinAttachmentModal;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Search, X } from 'lucide-react';
import { AI_API } from '../../config/api';
import { useTranslation } from '../../i18n/useTranslation';
import type { SearchCoinResult } from '../../types/ai';
import type { PostCoinAttachment } from '../../types/postCoin';

interface MessengerCoinAttachPanelProps {
  onSelect: (coin: PostCoinAttachment) => void;
  onBack: () => void;
  onClose: () => void;
}

const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 32 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

const MessengerCoinAttachPanel: React.FC<MessengerCoinAttachPanelProps> = ({
  onSelect,
  onBack,
  onClose,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchCoinResult[]>([]);
  const [searching, setSearching] = useState(false);

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
    onSelect({
      coinId: coin.id,
      name: coin.name,
      symbol: coin.symbol,
    });
  };

  return (
    <motion.div
      role="dialog"
      aria-label={t('messenger.attachmentMenu.coin')}
      className="pointer-events-none absolute bottom-full left-0 z-[4] mb-1 w-[min(100vw-2rem,320px)] origin-bottom-left contain-layout"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-1 text-neutral-600 hover:bg-neutral-100"
            aria-label={t('messenger.attachmentMenu.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex-1 text-sm font-medium text-neutral-800">
            {t('messenger.attachmentMenu.coin')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
            aria-label={t('messenger.attachmentMenu.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-neutral-100 px-3 py-2">
          <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('messenger.coinSearchHint')}
              className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              autoFocus
            />
            {searching ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-neutral-400" /> : null}
          </div>
        </div>

        <div className="max-h-[min(50vh,280px)] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-2 py-6 text-center text-sm text-neutral-500">
              {t('messenger.coinSearchHint')}
            </p>
          ) : searching ? (
            <p className="px-2 py-6 text-center text-sm text-neutral-500">{t('postCoin.searching')}</p>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-neutral-500">{t('messenger.coinNoResults')}</p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((coin) => (
                <li key={coin.id}>
                  <button
                    type="button"
                    onClick={() => pickCoin(coin)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
                  >
                    {coin.thumb ? (
                      <img
                        src={coin.thumb}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-600">
                        {coin.symbol.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutral-900">
                        {coin.name}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {coin.symbol.toUpperCase()}
                        {coin.market_cap_rank != null ? ` · #${coin.market_cap_rank}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessengerCoinAttachPanel;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { MESSAGES_API } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import type { MessengerStickerItem, MessengerStickerPack } from '../../types/messengerStickers';

interface MessengerStickersAttachPanelProps {
  onSelect: (pack: MessengerStickerPack, sticker: MessengerStickerItem) => void;
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

const MessengerStickersAttachPanel: React.FC<MessengerStickersAttachPanelProps> = ({
  onSelect,
  onBack,
  onClose,
}) => {
  const { token } = useAuth();
  const [packs, setPacks] = useState<MessengerStickerPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPacks([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${MESSAGES_API}/sticker-packs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load stickers');
        const data = (await res.json()) as { packs: MessengerStickerPack[] };
        if (!cancelled) setPacks(data.packs || []);
      } catch {
        if (!cancelled) setError('Could not load sticker packs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <motion.div
      role="dialog"
      aria-label="Stickers"
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
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex-1 text-sm font-medium text-neutral-800">Stickers</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(50vh,320px)] overflow-y-auto p-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-500">Loading…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-rose-600">{error}</p>
          ) : packs.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              No sticker packs yet. Get one in the Activity store.
            </p>
          ) : (
            <div className="space-y-5">
              {packs.map((pack) => (
                <section key={pack.id}>
                  <h3 className="mb-2 px-0.5 text-sm font-bold text-neutral-900">{pack.name}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {pack.stickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => onSelect(pack, sticker)}
                        className="aspect-square overflow-hidden rounded-xl bg-neutral-50 transition-transform active:scale-95 hover:bg-neutral-100"
                      >
                        <img
                          src={sticker.imageUrl}
                          alt=""
                          className="h-full w-full object-contain p-1"
                          loading="lazy"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessengerStickersAttachPanel;

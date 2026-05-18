import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import MessengerAnimojiGrid from './MessengerAnimojiGrid';
import { MESSENGER_STATIC_EMOJIS, MessengerEmojiItem } from '../../constants/messengerEmojis';

interface MessengerEmojiPickerProps {
  onSelect: (item: MessengerEmojiItem) => void;
  onClose: () => void;
}

const panelVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 32 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: { duration: 0.14, ease: 'easeIn' },
  },
};

function StaticEmojiCell({
  item,
  onPick,
}: {
  item: MessengerEmojiItem;
  onPick: (item: MessengerEmojiItem) => void;
}) {
  return (
    <button
      type="button"
      title={item.emoji}
      onClick={() => onPick(item)}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl transition-colors hover:bg-neutral-100"
    >
      <span className="leading-none">{item.emoji}</span>
    </button>
  );
}

const MessengerEmojiPicker: React.FC<MessengerEmojiPickerProps> = ({ onSelect, onClose }) => {
  return (
    <motion.div
      role="dialog"
      aria-label="Emoji"
      className="absolute bottom-full right-0 z-[4] mb-2 w-[min(100vw-2rem,320px)] origin-bottom-right rounded-2xl border border-neutral-200 bg-white shadow-xl"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
        <span className="text-sm font-medium text-neutral-700">Emoji</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
          aria-label="Close emoji picker"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[280px] overflow-y-auto p-2">
        <p className="mb-1.5 px-1 text-xs font-medium text-neutral-500">Animated</p>
        <MessengerAnimojiGrid onSelect={onSelect} />
        <p className="mb-1.5 mt-3 px-1 text-xs font-medium text-neutral-500">Emoji</p>
        <div className="grid grid-cols-8 gap-0.5">
          {MESSENGER_STATIC_EMOJIS.map((item) => (
            <StaticEmojiCell key={`static-${item.emoji}`} item={item} onPick={onSelect} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MessengerEmojiPicker;

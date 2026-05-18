import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import MessengerAnimojiGrid from './MessengerAnimojiGrid';
import { MessengerEmojiItem } from '../../constants/messengerEmojis';

interface MessengerAnimojiAttachPanelProps {
  onSelect: (item: MessengerEmojiItem) => void;
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

const MessengerAnimojiAttachPanel: React.FC<MessengerAnimojiAttachPanelProps> = ({
  onSelect,
  onBack,
  onClose,
}) => {
  return (
    <motion.div
      role="dialog"
      aria-label="Animated emoji"
      className="pointer-events-none absolute bottom-full left-0 z-[4] mb-1 w-[min(100vw-2rem,288px)] origin-bottom-left contain-layout"
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
          <span className="flex-1 text-sm font-medium text-neutral-800">Animated emoji</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[260px] overflow-y-auto p-2">
          <MessengerAnimojiGrid onSelect={onSelect} columns={6} />
        </div>
      </div>
    </motion.div>
  );
};

export default MessengerAnimojiAttachPanel;

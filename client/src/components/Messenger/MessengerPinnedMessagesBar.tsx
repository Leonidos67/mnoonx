import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Pin } from 'lucide-react';
import { formatMessagePreview, getMessageBody } from '../../utils/messengerAnimoji';

export interface PinnedMessagePreview {
  id: string;
  text: string;
  sender: 'user' | 'support' | 'mnoonx' | 'peer';
  timestamp: string;
}

interface MessengerPinnedMessagesBarProps {
  messages: PinnedMessagePreview[];
  sectionLabel: string;
  formatTime: (dateStr: string) => string;
  onJumpTo: (messageId: string) => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 28 : -28,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -28 : 28,
    opacity: 0,
  }),
};

const MessengerPinnedMessagesBar: React.FC<MessengerPinnedMessagesBarProps> = ({
  messages,
  sectionLabel,
  formatTime,
  onJumpTo,
}) => {
  const lastIndex = Math.max(0, messages.length - 1);
  const [activeIndex, setActiveIndex] = useState(lastIndex);
  const [slideDirection, setSlideDirection] = useState(1);

  const pinKey = messages.map((m) => m.id).join(',');

  useEffect(() => {
    setActiveIndex(Math.max(0, messages.length - 1));
    setSlideDirection(1);
  }, [pinKey, messages.length]);

  if (messages.length === 0) return null;

  const active = messages[activeIndex] ?? messages[lastIndex];
  if (!active) return null;

  const preview = formatMessagePreview(getMessageBody(active.text));
  const hasMultiple = messages.length > 1;

  const handleClick = () => {
    onJumpTo(active.id);
    if (!hasMultiple) return;
    setSlideDirection(1);
    setActiveIndex((i) => (i + 1) % messages.length);
  };

  return (
    <div className="shrink-0 border-b bg-white">
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-stretch gap-2 p-2 text-left transition-colors hover:bg-black/5 active:bg-black/5"
        aria-label={sectionLabel}
      >
        <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-black" aria-hidden />
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-black">
              {sectionLabel}
            </span>
            {hasMultiple ? (
              <span className="text-[11px] tabular-nums text-black">
                {activeIndex + 1}/{messages.length}
              </span>
            ) : null}
          </div>
          <div className="relative mt-1 ">
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={active.id}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.75 }}
                className="min-w-0"
              >
                <p className="line-clamp-2 text-sm leading-snug text-neutral-800">{preview || '…'}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </button>
    </div>
  );
};

export default MessengerPinnedMessagesBar;

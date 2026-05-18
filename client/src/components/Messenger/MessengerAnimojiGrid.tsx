import React from 'react';
import AnimojiPlayer from './AnimojiPlayer';
import { MESSENGER_ANIMOJIS, MessengerEmojiItem } from '../../constants/messengerEmojis';

interface MessengerAnimojiGridProps {
  onSelect: (item: MessengerEmojiItem) => void;
  columns?: 6 | 8;
  className?: string;
}

const MessengerAnimojiGrid: React.FC<MessengerAnimojiGridProps> = ({
  onSelect,
  columns = 8,
  className = '',
}) => {
  return (
    <div
      className={`grid gap-0.5 ${columns === 6 ? 'grid-cols-6' : 'grid-cols-8'} ${className}`}
      role="list"
    >
      {MESSENGER_ANIMOJIS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="listitem"
          title={item.emoji}
          onClick={() => onSelect(item)}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100"
        >
          <AnimojiPlayer
            emoji={item.emoji}
            lottieUrl={item.lottieUrl!}
            animojiId={item.id}
            slug={item.slug}
            size={32}
          />
        </button>
      ))}
    </div>
  );
};

export default MessengerAnimojiGrid;

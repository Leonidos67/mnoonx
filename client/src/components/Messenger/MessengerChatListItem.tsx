import React, { useRef } from 'react';
import { useLongPress } from '../../hooks/useLongPress';
import MessengerChatRow from './MessengerChatRow';

export interface MessengerChatListItemData {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface MessengerChatListItemProps {
  chat: MessengerChatListItemData;
  selected: boolean;
  isPinned: boolean;
  formatListTime: (dateStr: string) => string;
  noMessagesLabel: string;
  menuOpenForThisChat: boolean;
  onOpen: () => void;
  onLongPress: (rect: DOMRect) => void;
}

const MessengerChatListItem: React.FC<MessengerChatListItemProps> = ({
  chat,
  selected,
  isPinned,
  formatListTime,
  noMessagesLabel,
  menuOpenForThisChat,
  onOpen,
  onLongPress,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { touchHandlers, consumeLongPress } = useLongPress(() => {
    if (buttonRef.current) {
      onLongPress(buttonRef.current.getBoundingClientRect());
    }
  });

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => {
        if (consumeLongPress()) return;
        onOpen();
      }}
      {...touchHandlers}
      className={`flex w-full border-b border-neutral-100 text-left transition-opacity hover:bg-neutral-50 active:bg-neutral-100 lg:active:bg-neutral-50 ${
        selected ? 'bg-neutral-50' : ''
      } ${menuOpenForThisChat ? 'opacity-0' : ''}`}
      aria-hidden={menuOpenForThisChat}
      tabIndex={menuOpenForThisChat ? -1 : 0}
    >
      <MessengerChatRow
        chat={chat}
        isPinned={isPinned}
        formatListTime={formatListTime}
        noMessagesLabel={noMessagesLabel}
      />
    </button>
  );
};

export default MessengerChatListItem;

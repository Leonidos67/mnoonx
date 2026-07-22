import React, { useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
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
  lastMessageFromMe?: boolean;
  lastMessageStatus?: 'sent' | 'delivered' | 'read' | null;
}

interface MessengerChatListItemProps {
  chat: MessengerChatListItemData;
  selected: boolean;
  isPinned: boolean;
  formatListTime: (dateStr: string) => string;
  noMessagesLabel: string;
  menuOpenForThisChat: boolean;
  actionsMenuLabel: string;
  statusLabels: {
    sent: string;
    delivered: string;
    read: string;
  };
  onOpen: () => void;
  onLongPress: (rect: DOMRect) => void;
  onOpenActionsMenu: (rect: DOMRect) => void;
}

const MessengerChatListItem: React.FC<MessengerChatListItemProps> = ({
  chat,
  selected,
  isPinned,
  formatListTime,
  noMessagesLabel,
  menuOpenForThisChat,
  actionsMenuLabel,
  statusLabels,
  onOpen,
  onLongPress,
  onOpenActionsMenu,
}) => {
  const rowRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLButtonElement>(null);

  const { touchHandlers, consumeLongPress } = useLongPress(() => {
    if (rowRef.current) {
      onLongPress(rowRef.current.getBoundingClientRect());
    }
  });

  const blockNativeSelection = (e: React.SyntheticEvent) => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const onSelectStart = (e: Event) => {
      if (window.matchMedia('(max-width: 1023px)').matches) {
        e.preventDefault();
      }
    };
    el.addEventListener('selectstart', onSelectStart);
    return () => el.removeEventListener('selectstart', onSelectStart);
  }, []);

  const showActions =
    menuOpenForThisChat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';

  const actionsRightClass = chat.unreadCount > 0 ? 'right-9' : 'right-2';

  const rowBgClass = selected
    ? 'bg-neutral-100'
    : isPinned
      ? 'bg-neutral-50'
      : '';
  const rowHoverClass = selected || isPinned ? 'hover:bg-neutral-100' : 'hover:bg-neutral-50';

  return (
    <div
      className={`group relative flex w-full items-stretch border-b border-neutral-100 ${rowBgClass} ${rowHoverClass}`}
    >
      <button
        ref={rowRef}
        type="button"
        onClick={() => {
          if (consumeLongPress()) return;
          onOpen();
        }}
        {...touchHandlers}
        onContextMenu={blockNativeSelection}
        className={`min-w-0 flex-1 text-left transition-opacity active:bg-neutral-100 max-lg:select-none max-lg:[-webkit-touch-callout:none] lg:active:bg-transparent ${
          menuOpenForThisChat ? 'max-lg:opacity-0' : ''
        }`}
        aria-hidden={menuOpenForThisChat}
        tabIndex={menuOpenForThisChat ? -1 : 0}
      >
        <MessengerChatRow
          chat={chat}
          isPinned={isPinned}
          formatListTime={formatListTime}
          noMessagesLabel={noMessagesLabel}
          statusLabels={statusLabels}
          reserveActionsSpace
        />
      </button>

      <button
        ref={actionsRef}
        type="button"
        aria-label={actionsMenuLabel}
        aria-expanded={menuOpenForThisChat}
        aria-haspopup="menu"
        className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 transition-[opacity,background-color,color] group-hover:bg-neutral-200/90 group-hover:text-neutral-800 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 lg:flex ${actionsRightClass} ${showActions} ${
          menuOpenForThisChat ? 'bg-neutral-200/90 text-neutral-800' : 'bg-transparent'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (actionsRef.current) {
            onOpenActionsMenu(actionsRef.current.getBoundingClientRect());
          }
        }}
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
};

export default MessengerChatListItem;

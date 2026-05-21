import React from 'react';
import { Pin } from 'lucide-react';
import { formatMessagePreview } from '../../utils/messengerAnimoji';
import MessengerMessageStatusIcon, {
  type MessengerMessageStatus,
} from './MessengerMessageStatusIcon';
import type { MessengerChatListItemData } from './MessengerChatListItem';

interface MessengerChatRowProps {
  chat: MessengerChatListItemData;
  isPinned: boolean;
  formatListTime: (dateStr: string) => string;
  noMessagesLabel: string;
  className?: string;
  statusLabels?: {
    sent: string;
    delivered: string;
    read: string;
  };
  reserveActionsSpace?: boolean;
}

const MessengerChatRow: React.FC<MessengerChatRowProps> = ({
  chat,
  isPinned,
  formatListTime,
  noMessagesLabel,
  className = '',
  statusLabels,
  reserveActionsSpace = false,
}) => (
  <div
    className={`flex w-full items-start gap-3 p-4 text-left ${className}`}
  >
    <div className="relative shrink-0">
      <img src={chat.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
      {chat.isOnline ? (
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
      ) : null}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-1.5 truncate font-semibold text-neutral-800">
          {isPinned ? <Pin className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden /> : null}
          <span className="truncate">{chat.name}</span>
        </h3>

        <div className="ml-1 flex shrink-0 items-center justify-end gap-0.5">
          {chat.lastMessageFromMe && chat.lastMessageStatus && statusLabels ? (
            <MessengerMessageStatusIcon
              status={chat.lastMessageStatus as MessengerMessageStatus}
              labels={statusLabels}
            />
          ) : null}
          <span className="shrink-0 text-xs tabular-nums text-neutral-400">
            {formatListTime(chat.lastMessageTime)}
          </span>
        </div>
      </div>
      <p
        className={`mt-1 truncate text-sm ${
          chat.unreadCount > 0 ? 'font-semibold text-neutral-800' : 'text-neutral-500'
        }`}
      >
        {chat.lastMessage ? formatMessagePreview(chat.lastMessage) : noMessagesLabel}
      </p>
    </div>
    {chat.unreadCount > 0 ? (
      <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#e5484d] px-1.5 text-xs font-bold text-white">
        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
      </span>
    ) : null}
  </div>
);

export default MessengerChatRow;

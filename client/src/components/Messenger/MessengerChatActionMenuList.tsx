import React from 'react';
import type { MessengerChatActionId } from './MessengerChatContextMenu';
import type { ChatActionRow } from './messengerChatActionRows';

interface MessengerChatActionMenuListProps {
  rows: ChatActionRow[];
  onAction: (action: MessengerChatActionId) => void;
  variant?: 'mobile' | 'desktop';
}

const MessengerChatActionMenuList: React.FC<MessengerChatActionMenuListProps> = ({
  rows,
  onAction,
  variant = 'mobile',
}) => {
  const isDesktop = variant === 'desktop';

  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            role="menuitem"
            className={`flex w-full items-center text-left font-medium transition-colors hover:bg-neutral-100 ${
              isDesktop ? 'gap-2.5 px-3 py-2 text-sm' : 'gap-3 px-4 py-3.5 text-[15px] active:bg-neutral-100'
            } ${row.destructive ? 'text-red-600' : 'text-neutral-900'}`}
            onClick={() => onAction(row.id)}
          >
            {row.icon}
            {row.label}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default MessengerChatActionMenuList;

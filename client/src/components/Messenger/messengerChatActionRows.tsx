import React from 'react';
import { Pin, PinOff, Sparkles, Flag, Ban, Trash2 } from 'lucide-react';
import type { MessengerChatActionId } from './MessengerChatContextMenu';

export interface ChatActionRow {
  id: MessengerChatActionId;
  label: string;
  icon: React.ReactNode;
  destructive?: boolean;
}

export interface ChatActionLabels {
  pin: string;
  unpin: string;
  markNew: string;
  report: string;
  blockUser: string;
  deleteChat: string;
}

export function buildMessengerChatActionRows(
  isPinned: boolean,
  isDm: boolean,
  labels: ChatActionLabels
): ChatActionRow[] {
  const list: ChatActionRow[] = [
    {
      id: 'pin',
      label: isPinned ? labels.unpin : labels.pin,
      icon: isPinned ? (
        <PinOff className="h-5 w-5 text-neutral-700" aria-hidden />
      ) : (
        <Pin className="h-5 w-5 text-neutral-700" aria-hidden />
      ),
    },
    {
      id: 'markNew',
      label: labels.markNew,
      icon: <Sparkles className="h-5 w-5 text-neutral-700" aria-hidden />,
    },
    {
      id: 'report',
      label: labels.report,
      icon: <Flag className="h-5 w-5 text-neutral-700" aria-hidden />,
    },
    {
      id: 'delete',
      label: labels.deleteChat,
      icon: <Trash2 className="h-5 w-5 text-red-600" aria-hidden />,
      destructive: true,
    },
  ];
  if (isDm) {
    list.splice(3, 0, {
      id: 'block',
      label: labels.blockUser,
      icon: <Ban className="h-5 w-5 text-neutral-700" aria-hidden />,
    });
  }
  return list;
}

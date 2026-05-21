import React from 'react';
import { Reply, Pencil, Pin, PinOff, Copy, Trash2 } from 'lucide-react';

export type MessengerMessageActionId = 'reply' | 'edit' | 'pin' | 'copy' | 'delete';

export interface MessageActionRow {
  id: MessengerMessageActionId;
  label: string;
  icon: React.ReactNode;
  destructive?: boolean;
}

export interface MessageActionLabels {
  reply: string;
  edit: string;
  pin: string;
  unpin: string;
  copy: string;
  delete: string;
}

export function buildMessengerMessageActionRows(
  options: {
    isPinned: boolean;
    canReply: boolean;
    canEdit: boolean;
    canDelete: boolean;
  },
  labels: MessageActionLabels
): MessageActionRow[] {
  const rows: MessageActionRow[] = [];

  if (options.canReply) {
    rows.push({
      id: 'reply',
      label: labels.reply,
      icon: <Reply className="h-5 w-5 text-neutral-700" aria-hidden />,
    });
  }
  if (options.canEdit) {
    rows.push({
      id: 'edit',
      label: labels.edit,
      icon: <Pencil className="h-5 w-5 text-neutral-700" aria-hidden />,
    });
  }
  rows.push({
    id: 'pin',
    label: options.isPinned ? labels.unpin : labels.pin,
    icon: options.isPinned ? (
      <PinOff className="h-5 w-5 text-neutral-700" aria-hidden />
    ) : (
      <Pin className="h-5 w-5 text-neutral-700" aria-hidden />
    ),
  });
  rows.push({
    id: 'copy',
    label: labels.copy,
    icon: <Copy className="h-5 w-5 text-neutral-700" aria-hidden />,
  });
  if (options.canDelete) {
    rows.push({
      id: 'delete',
      label: labels.delete,
      icon: <Trash2 className="h-5 w-5 text-red-600" aria-hidden />,
      destructive: true,
    });
  }
  return rows;
}

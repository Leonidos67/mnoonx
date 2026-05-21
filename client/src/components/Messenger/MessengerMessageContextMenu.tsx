import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  buildMessengerMessageActionRows,
  type MessageActionLabels,
  type MessengerMessageActionId,
} from './messengerMessageActionRows';

export interface MessageContextMenuAnchor {
  messageId: string;
  rect: DOMRect;
  isPinned: boolean;
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface MessengerMessageContextMenuProps {
  anchor: MessageContextMenuAnchor | null;
  onClose: () => void;
  onAction: (action: MessengerMessageActionId) => void;
  labels: MessageActionLabels & { menuTitle: string };
}

const MENU_GAP = 8;
const MENU_MIN_WIDTH = 200;
const VIEWPORT_PAD = 8;
/** Ignore dismiss right after open (long-press finger lift / context menu). */
const DISMISS_GRACE_MS = 450;

function computePosition(rect: DOMRect, menuHeight: number, menuWidth: number) {
  let left = rect.left + rect.width / 2 - menuWidth / 2;
  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PAD));

  let top = rect.top - MENU_GAP - menuHeight;
  if (top < VIEWPORT_PAD) {
    top = rect.bottom + MENU_GAP;
  }
  top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - menuHeight - VIEWPORT_PAD));

  return { top, left };
}

const MessengerMessageContextMenu: React.FC<MessengerMessageContextMenuProps> = ({
  anchor,
  onClose,
  onAction,
  labels,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(0);
  const [menuHeight, setMenuHeight] = useState(0);
  const [menuWidth, setMenuWidth] = useState(MENU_MIN_WIDTH);

  useEffect(() => {
    if (anchor) openedAtRef.current = Date.now();
  }, [anchor?.messageId]);

  const rows = useMemo(() => {
    if (!anchor) return [];
    return buildMessengerMessageActionRows(
      {
        isPinned: anchor.isPinned,
        canReply: anchor.canReply,
        canEdit: anchor.canEdit,
        canDelete: anchor.canDelete,
      },
      labels
    );
  }, [anchor, labels]);

  useLayoutEffect(() => {
    if (!anchor || !menuRef.current) {
      setMenuHeight(0);
      return;
    }
    setMenuHeight(menuRef.current.offsetHeight);
    setMenuWidth(Math.max(MENU_MIN_WIDTH, menuRef.current.offsetWidth));
  }, [anchor, rows]);

  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const shouldDismiss = (target: Node) => {
      if (Date.now() - openedAtRef.current < DISMISS_GRACE_MS) return false;
      if (menuRef.current?.contains(target)) return false;
      if (anchor?.messageId) {
        const bubble = document.querySelector(`[data-message-id="${anchor.messageId}"]`);
        if (bubble?.contains(target)) return false;
      }
      return true;
    };

    const timer = window.setTimeout(() => {
      const onPointerDown = (e: Event) => {
        if (!shouldDismiss(e.target as Node)) return;
        onClose();
      };
      document.addEventListener('mousedown', onPointerDown, true);
      document.addEventListener('touchstart', onPointerDown, true);
      cleanupPointer = () => {
        document.removeEventListener('mousedown', onPointerDown, true);
        document.removeEventListener('touchstart', onPointerDown, true);
      };
    }, 0);

    let cleanupPointer: (() => void) | undefined;
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      cleanupPointer?.();
    };
  }, [anchor, onClose]);

  if (!anchor || typeof document === 'undefined' || rows.length === 0) return null;

  const { top, left } = computePosition(anchor.rect, menuHeight, menuWidth);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={labels.menuTitle}
      className="fixed z-[250] min-w-[200px] overflow-hidden rounded-xl border border-neutral-200/90 bg-white py-1 shadow-xl"
      style={{ top, left, width: menuWidth }}
    >
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              role="menuitem"
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-neutral-100 ${
                row.destructive ? 'text-red-600' : 'text-neutral-900'
              }`}
              onClick={() => onAction(row.id)}
            >
              {row.icon}
              {row.label}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
};

export default MessengerMessageContextMenu;

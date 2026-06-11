import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MessengerChatActionMenuList from './MessengerChatActionMenuList';
import type { ChatContextMenuAnchor } from './MessengerChatContextMenu';
import type { MessengerChatActionId } from './MessengerChatContextMenu';
import { buildMessengerChatActionRows } from './messengerChatActionRows';

interface MessengerChatDesktopMenuProps {
  anchor: ChatContextMenuAnchor | null;
  isPinned: boolean;
  onClose: () => void;
  onAction: (action: MessengerChatActionId) => void;
  labels: {
    sheetTitle: string;
    pin: string;
    unpin: string;
    markNew: string;
    report: string;
    blockUser: string;
    deleteChat: string;
  };
}

const MENU_GAP = 6;
const MENU_MIN_WIDTH = 220;
const VIEWPORT_PAD = 8;

function computePosition(rect: DOMRect, menuHeight: number, menuWidth: number) {
  let top = rect.bottom + MENU_GAP;
  let left = rect.right - menuWidth;

  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PAD));

  if (top + menuHeight > window.innerHeight - VIEWPORT_PAD) {
    top = rect.top - MENU_GAP - menuHeight;
  }
  top = Math.max(VIEWPORT_PAD, top);

  return { top, left };
}

const MessengerChatDesktopMenu: React.FC<MessengerChatDesktopMenuProps> = ({
  anchor,
  isPinned,
  onClose,
  onAction,
  labels,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [menuWidth, setMenuWidth] = useState(MENU_MIN_WIDTH);

  const isDm = anchor?.target.kind === 'dm';

  const rows = useMemo(
    () => buildMessengerChatActionRows(isPinned, Boolean(isDm), labels),
    [isDm, isPinned, labels]
  );

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

    const timer = window.setTimeout(() => {
      const onPointerDown = (e: MouseEvent) => {
        if (menuRef.current?.contains(e.target as Node)) return;
        onClose();
      };
      document.addEventListener('mousedown', onPointerDown);
      cleanupPointer = () => document.removeEventListener('mousedown', onPointerDown);
    }, 0);

    let cleanupPointer: (() => void) | undefined;
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      cleanupPointer?.();
    };
  }, [anchor, onClose]);

  if (!anchor || typeof document === 'undefined') return null;

  const { top, left } = computePosition(anchor.rect, menuHeight, menuWidth);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={labels.sheetTitle}
      className="fixed z-[200] hidden min-w-[220px] overflow-hidden rounded-lg border border-neutral-200/90 bg-white p-1 shadow-lg lg:block"
      style={{ top, left, width: menuWidth }}
    >
      <MessengerChatActionMenuList rows={rows} onAction={onAction} variant="desktop" />
    </div>,
    document.body
  );
};

export default MessengerChatDesktopMenu;

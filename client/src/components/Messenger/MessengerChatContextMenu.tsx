import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MessengerChatRow from './MessengerChatRow';
import MessengerChatActionMenuList from './MessengerChatActionMenuList';
import { buildMessengerChatActionRows } from './messengerChatActionRows';
import type { MessengerChatListItemData } from './MessengerChatListItem';

export interface MessengerChatActionTarget {
  id: string;
  name: string;
  avatar: string;
  kind: string;
  username: string | null;
  peerUserId: string | null;
}

export type MessengerChatActionId =
  | 'pin'
  | 'markNew'
  | 'report'
  | 'block'
  | 'delete';

export interface ChatContextMenuAnchor {
  target: MessengerChatActionTarget;
  rect: DOMRect;
  chat: MessengerChatListItemData;
}

interface MessengerChatContextMenuProps {
  anchor: ChatContextMenuAnchor | null;
  isPinned: boolean;
  formatListTime: (dateStr: string) => string;
  noMessagesLabel: string;
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

const MENU_GAP = 8;
const EDGE_PAD_X = 16;
const EDGE_PAD_Y = 12;

const springSnappy = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.85 };
const springSoft = { type: 'spring' as const, stiffness: 380, damping: 30 };

interface LayoutMetrics {
  sourceTop: number;
  sourceLeft: number;
  sourceWidth: number;
  sourceHeight: number;
  blockTop: number;
  blockLeft: number;
  blockWidth: number;
  blockHeight: number;
  menuLeft: number;
  menuWidth: number;
  menuTop: number;
  placeAbove: boolean;
}

function computeLayout(rect: DOMRect, menuHeight: number): LayoutMetrics {
  const vw = window.innerWidth;
  const blockLeft = EDGE_PAD_X;
  const blockWidth = vw - EDGE_PAD_X * 2;
  const blockTop = rect.top;
  const blockHeight = rect.height;

  const menuLeft = blockLeft;
  const menuWidth = blockWidth;

  const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
  const spaceAbove = rect.top - MENU_GAP;
  const placeAbove =
    menuHeight > 0
      ? spaceBelow < menuHeight && spaceAbove >= spaceBelow
      : spaceBelow < 220 && spaceAbove > spaceBelow;

  const menuTop = placeAbove
    ? Math.max(EDGE_PAD_Y, blockTop - MENU_GAP - menuHeight)
    : blockTop + blockHeight + MENU_GAP;

  return {
    sourceTop: rect.top,
    sourceLeft: rect.left,
    sourceWidth: rect.width,
    sourceHeight: rect.height,
    blockTop,
    blockLeft,
    blockWidth,
    blockHeight,
    menuLeft,
    menuWidth,
    menuTop,
    placeAbove,
  };
}

const MessengerChatContextMenu: React.FC<MessengerChatContextMenuProps> = ({
  anchor,
  isPinned,
  formatListTime,
  noMessagesLabel,
  onClose,
  onAction,
  labels,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [frozen, setFrozen] = useState<ChatContextMenuAnchor | null>(null);
  const [present, setPresent] = useState(false);

  const isDm = frozen?.target.kind === 'dm';

  useEffect(() => {
    if (anchor) {
      setFrozen(anchor);
      setPresent(true);
    }
  }, [anchor]);

  useEffect(() => {
    if (!anchor) setPresent(false);
  }, [anchor]);

  const dismiss = () => onClose();

  const rows = useMemo(
    () => buildMessengerChatActionRows(isPinned, Boolean(isDm), labels),
    [isDm, isPinned, labels]
  );

  useLayoutEffect(() => {
    if (!frozen || !menuRef.current) {
      setMenuHeight(0);
      return;
    }
    setMenuHeight(menuRef.current.offsetHeight);
  }, [frozen, rows]);

  useLayoutEffect(() => {
    if (!frozen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [frozen]);

  const layout = frozen ? computeLayout(frozen.rect, menuHeight) : null;

  const content = (
    <AnimatePresence
      onExitComplete={() => {
        if (!anchor) setFrozen(null);
      }}
    >
      {present && frozen && layout ? (
        <motion.div
          key={frozen.target.id}
          className="fixed inset-0 z-[200] max-lg:block lg:hidden"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-white/25 backdrop-blur-[14px] backdrop-saturate-150"
            aria-label={labels.sheetTitle}
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />

          <motion.div
            className="pointer-events-none absolute z-[201] select-none overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-lg [-webkit-touch-callout:none]"
            initial={{
              top: layout.sourceTop,
              left: layout.sourceLeft,
              width: layout.sourceWidth,
              height: layout.sourceHeight,
              opacity: 0.92,
              scale: 0.98,
            }}
            animate={{
              top: layout.blockTop,
              left: layout.blockLeft,
              width: layout.blockWidth,
              height: layout.blockHeight,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              top: layout.sourceTop,
              left: layout.sourceLeft,
              width: layout.sourceWidth,
              height: layout.sourceHeight,
              opacity: 0,
              scale: 0.98,
            }}
            transition={springSnappy}
            style={{ transformOrigin: 'center center' }}
          >
            <MessengerChatRow
              chat={frozen.chat}
              isPinned={isPinned}
              formatListTime={formatListTime}
              noMessagesLabel={noMessagesLabel}
            />
          </motion.div>

          <motion.div
            ref={menuRef}
            className="absolute z-[202] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-1 shadow-xl"
            style={{
              left: layout.menuLeft,
              width: layout.menuWidth,
            }}
            role="menu"
            aria-label={labels.sheetTitle}
            initial={{
              top: layout.placeAbove ? layout.menuTop + 10 : layout.menuTop - 10,
              opacity: 0,
              scale: 0.96,
            }}
            animate={{
              top: layout.menuTop,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              transition: { duration: 0.14 },
            }}
            transition={{ ...springSoft, delay: 0.04 }}
          >
            <MessengerChatActionMenuList rows={rows} onAction={onAction} variant="mobile" />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default MessengerChatContextMenu;

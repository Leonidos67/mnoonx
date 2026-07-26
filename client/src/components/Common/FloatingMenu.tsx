import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface FloatingMenuAnchor {
  rect: DOMRect;
}

interface FloatingMenuProps {
  open: boolean;
  anchor: FloatingMenuAnchor | null;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  placement?: 'bottom' | 'top';
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({
  open,
  anchor,
  onClose,
  children,
  width = 192,
  placement = 'bottom',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-floating-menu-trigger]')) return;
      onClose();
    };

    // Only close on viewport scroll/resize — nested overflow scroll must not kill clicks.
    const onWindowScroll = () => onClose();

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('scroll', onWindowScroll);
    window.addEventListener('resize', onWindowScroll);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('scroll', onWindowScroll);
      window.removeEventListener('resize', onWindowScroll);
    };
  }, [open, onClose]);

  if (!open || !anchor) return null;

  const gap = 4;
  const left = Math.min(
    Math.max(8, anchor.rect.right - width),
    window.innerWidth - width - 8,
  );
  const positionStyle =
    placement === 'top'
      ? { bottom: window.innerHeight - anchor.rect.top + gap, left, width }
      : { top: anchor.rect.bottom + gap, left, width };

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[99999] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
      style={positionStyle}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      {children}
    </div>,
    document.body,
  );
};

export default FloatingMenu;

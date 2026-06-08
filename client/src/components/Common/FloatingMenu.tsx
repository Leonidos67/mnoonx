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
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, onClose]);

  if (!open || !anchor) return null;

  const gap = 4;
  const left = Math.min(
    Math.max(8, anchor.rect.right - width),
    window.innerWidth - width - 8
  );
  const positionStyle =
    placement === 'top'
      ? { bottom: window.innerHeight - anchor.rect.top + gap, left, width }
      : { top: anchor.rect.bottom + gap, left, width };

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[10000] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
      style={positionStyle}
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      {children}
    </div>,
    document.body
  );
};

export default FloatingMenu;

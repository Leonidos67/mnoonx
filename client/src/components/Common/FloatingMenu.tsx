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
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({
  open,
  anchor,
  onClose,
  children,
  width = 192,
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

  const top = anchor.rect.bottom + 4;
  const left = Math.min(
    Math.max(8, anchor.rect.right - width),
    window.innerWidth - width - 8
  );

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[10000] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
      style={{ top, left, width }}
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      {children}
    </div>,
    document.body
  );
};

export default FloatingMenu;

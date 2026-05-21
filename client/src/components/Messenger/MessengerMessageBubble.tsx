import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLongPress } from '../../hooks/useLongPress';

interface MessengerMessageBubbleProps {
  messageId: string;
  align: 'start' | 'end';
  isMenuOpen: boolean;
  onOpenMenu: (rect: DOMRect) => void;
  children: React.ReactNode;
}

const springScale = { type: 'spring' as const, stiffness: 380, damping: 28, mass: 0.85 };

const MessengerMessageBubble: React.FC<MessengerMessageBubbleProps> = ({
  messageId,
  align,
  isMenuOpen,
  onOpenMenu,
  children,
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const openFromRect = () => {
    if (bubbleRef.current) {
      onOpenMenu(bubbleRef.current.getBoundingClientRect());
    }
  };

  const { touchHandlers: baseTouchHandlers } = useLongPress(openFromRect);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) setIsPressing(false);
  }, [isMenuOpen]);

  const touchHandlers = {
    onTouchStart: () => {
      if (isMobile) setIsPressing(true);
      baseTouchHandlers.onTouchStart();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      baseTouchHandlers.onTouchEnd(e);
      if (!isMenuOpen) setIsPressing(false);
    },
    onTouchMove: () => {
      setIsPressing(false);
      baseTouchHandlers.onTouchMove();
    },
    onTouchCancel: () => {
      setIsPressing(false);
      baseTouchHandlers.onTouchCancel();
    },
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openFromRect();
  };

  const blockMouseSelect = (e: React.MouseEvent) => {
    if (e.button === 2) e.preventDefault();
  };

  useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const onSelectStart = (e: Event) => e.preventDefault();
    el.addEventListener('selectstart', onSelectStart);
    return () => el.removeEventListener('selectstart', onSelectStart);
  }, []);

  const scale = isMobile ? (isMenuOpen ? 1.06 : isPressing ? 1.03 : 1) : 1;
  const transformOrigin = align === 'end' ? '100% 100%' : '0% 100%';

  return (
    <motion.div
      ref={bubbleRef}
      data-message-id={messageId}
      data-menu-open={isMenuOpen ? 'true' : undefined}
      onContextMenu={handleContextMenu}
      onMouseDown={blockMouseSelect}
      {...touchHandlers}
      animate={{ scale }}
      transition={springScale}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        transformOrigin,
      }}
      className={`max-w-[85%] select-none [-webkit-touch-callout:none] sm:max-w-[70%] ${
        align === 'end' ? 'order-1' : ''
      } ${isMobile && (isMenuOpen || isPressing) ? 'relative z-[2]' : ''}`}
    >
      {children}
    </motion.div>
  );
};

export default MessengerMessageBubble;

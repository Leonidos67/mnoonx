import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type SwipeBackOptions = {
  enabled?: boolean;
  edgeWidth?: number;
  threshold?: number;
};

/**
 * Mobile edge-swipe to navigate back (iOS-style).
 */
export function useSwipeBack({ enabled = true, edgeWidth = 28, threshold = 72 }: SwipeBackOptions = {}) {
  const navigate = useNavigate();
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || t.clientX > edgeWidth) return;
      startX.current = t.clientX;
      startY.current = t.clientY;
      tracking.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking.current) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      const dy = Math.abs(t.clientY - startY.current);
      if (dy > 48 && dx < threshold) tracking.current = false;
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      if (dx >= threshold) navigate(-1);
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [enabled, edgeWidth, navigate, threshold]);
}

export default useSwipeBack;

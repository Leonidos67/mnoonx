import { useCallback, useRef } from 'react';

const DEFAULT_MS = 500;

/**
 * Touch long-press for mobile. Call `consumeLongPress()` in click to skip navigation after hold.
 */
export function useLongPress(onLongPress: () => void, delayMs = DEFAULT_MS) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const consumeLongPress = useCallback(() => {
    const was = firedRef.current;
    firedRef.current = false;
    return was;
  }, []);

  const touchHandlers = {
    onTouchStart: () => {
      firedRef.current = false;
      clearTimer();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(12);
        }
        onLongPress();
      }, delayMs);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const didFire = firedRef.current;
      clearTimer();
      if (didFire) {
        firedRef.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onTouchMove: clearTimer,
    onTouchCancel: clearTimer,
  };

  return { touchHandlers, consumeLongPress };
}

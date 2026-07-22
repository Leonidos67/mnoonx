import { useCallback, useRef, useState, type ReactNode, type RefObject } from 'react';

type PullToRefreshProps = {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  /** Optional external scroll container ref — lets the parent keep using it (e.g. for scroll observers) */
  scrollRef?: RefObject<HTMLDivElement>;
  labels?: {
    pull?: string;
    release?: string;
    refreshing?: string;
  };
};

/**
 * Mobile pull-to-refresh wrapper. Activates only when scrolled to top.
 */
const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = '',
  scrollRef,
  labels,
}) => {
  const startY = useRef(0);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);
  const elRef = scrollRef || internalRef;

  const pullLabel = labels?.pull ?? 'Pull to refresh';
  const releaseLabel = labels?.release ?? 'Release';
  const refreshingLabel = labels?.refreshing ?? 'Refreshing…';

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = elRef.current;
    if (!el || el.scrollTop > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
  }, [refreshing, elRef]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const el = elRef.current;
    if (!el || el.scrollTop > 0 || refreshing || !startY.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(80, dy * 0.45));
  }, [refreshing, elRef]);

  const onTouchEnd = useCallback(async () => {
    if (pull > 56 && !refreshing) {
      setRefreshing(true);
      setPull(48);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
        startY.current = 0;
      }
      return;
    }
    setPull(0);
    startY.current = 0;
  }, [onRefresh, pull, refreshing]);

  return (
    <div
      ref={elRef}
      className={`relative overflow-y-auto ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => void onTouchEnd()}
    >
      <div
        className="pointer-events-none flex items-center justify-center text-xs text-neutral-500 transition-all"
        style={{ height: pull, opacity: pull > 8 ? 1 : 0 }}
        aria-hidden
      >
        {refreshing ? refreshingLabel : pull > 56 ? releaseLabel : pullLabel}
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;

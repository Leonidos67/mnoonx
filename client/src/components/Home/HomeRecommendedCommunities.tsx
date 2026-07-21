import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  type IconHandle,
} from '@animateicons/react/lucide';
import { COMMUNITIES_API } from '../../config/api';
import { useTranslation } from '../../i18n/useTranslation';

const TOTAL = 15;
const PAGE_SIZE = 5;

const TRANSITION = { duration: 0.16, ease: [0.32, 0.72, 0, 1] as const };

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    scale: 0.9,
  }),
};

interface CommunityItem {
  _id: string;
  name: string;
  handle: string;
  avatar?: string;
  memberCount?: number;
}

function communityAvatar(community: CommunityItem, size = 96): string {
  return (
    community.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=111827&color=fff&size=${size}&bold=true`
  );
}

const HomeRecommendedCommunities: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const leftIconRef = useRef<IconHandle>(null);
  const rightIconRef = useRef<IconHandle>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${COMMUNITIES_API}/list`);
      if (!res.ok) return;
      const data = (await res.json()) as CommunityItem[];
      const sorted = Array.isArray(data)
        ? [...data]
            .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
            .slice(0, TOTAL)
        : [];
      setItems(sorted);
      setPage(0);
      setDirection(0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const goTo = (next: number, dir: number) => {
    setDirection(dir);
    setPage(next);
  };

  if (loading || items.length === 0) return null;

  const maxPage = Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1);
  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < maxPage;
  const showArrows = maxPage > 0;

  return (
    <div className="border-b border-neutral-200 px-4 py-3">
      <p className="mb-2.5 text-md font-semibold text-neutral-900">
        {t('home.recommendedCommunities')}
      </p>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {showArrows ? (
          <button
            type="button"
            onClick={() => goTo(Math.max(0, page - 1), -1)}
            disabled={!canPrev}
            onMouseEnter={() => leftIconRef.current?.startAnimation()}
            onMouseLeave={() => leftIconRef.current?.stopAnimation()}
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-30"
            aria-label={t('home.recommendedPrev')}
          >
            <ChevronLeftIcon
              ref={leftIconRef}
              size={20}
              duration={1}
              color="currentColor"
              isAnimated={false}
              className="!h-5 !w-5 !min-h-0 !min-w-0"
            />
          </button>
        ) : null}

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={page}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              className="grid grid-cols-5 gap-2 sm:gap-2.5"
            >
              {visible.map((community) => (
                <Link
                  key={community._id}
                  to={`/community/${community.handle}`}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200/80 transition-opacity hover:opacity-90"
                  title={community.name}
                  aria-label={community.name}
                >
                  <img
                    src={communityAvatar(community)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </Link>
              ))}
              {visible.length < PAGE_SIZE
                ? Array.from({ length: PAGE_SIZE - visible.length }).map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square" aria-hidden />
                  ))
                : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {showArrows ? (
          <button
            type="button"
            onClick={() => goTo(Math.min(maxPage, page + 1), 1)}
            disabled={!canNext}
            onMouseEnter={() => rightIconRef.current?.startAnimation()}
            onMouseLeave={() => rightIconRef.current?.stopAnimation()}
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-30"
            aria-label={t('home.recommendedNext')}
          >
            <ChevronRightIcon
              ref={rightIconRef}
              size={20}
              duration={1}
              color="currentColor"
              isAnimated={false}
              className="!h-5 !w-5 !min-h-0 !min-w-0"
            />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default HomeRecommendedCommunities;

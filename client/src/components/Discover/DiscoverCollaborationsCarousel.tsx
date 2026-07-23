import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Users, Users2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

export interface CollabOwner {
  _id?: string;
  username: string;
  fullName: string;
  avatar?: string;
}

export interface CollaborationItem {
  _id: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  memberCount: number;
  owner: CollabOwner;
  coOwner?: CollabOwner | null;
}

function avatarUrl(name: string, src?: string, size = 40): string {
  return (
    src ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=315efb&color=fff&size=${size}&bold=true`
  );
}

interface DiscoverCollaborationsCarouselProps {
  items: CollaborationItem[];
  onOpen: (item: CollaborationItem) => void;
}

/** Horizontal carousel only for two-creator collaborations. */
const DiscoverCollaborationsCarousel: React.FC<DiscoverCollaborationsCarouselProps> = ({
  items,
  onOpen,
}) => {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <section className="mb-8 sm:mb-10">
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 sm:text-xl">
            {t('discover.sectionCollaborations')}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
            {t('discover.sectionCollaborationsHint')}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            aria-label={t('discover.carouselPrev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            aria-label={t('discover.carouselNext')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const a = item.owner;
          const b = item.coOwner;
          const cover =
            item.banner ||
            item.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=111827&color=fff&size=400&bold=true`;

          return (
            <button
              key={item._id}
              type="button"
              onClick={() => onOpen(item)}
              className="w-[280px] shrink-0 overflow-hidden rounded-3xl border border-gray-200 bg-white text-left transition-shadow hover:shadow-md sm:w-[300px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                <img src={cover} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                  <Users2 className="h-3 w-3" />
                  {t('discover.collaborationBadge')}
                </span>
              </div>
              <div className="p-4">
                <p className="line-clamp-1 text-[15px] font-semibold text-gray-900">{item.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <img
                      src={avatarUrl(a.fullName || a.username, a.avatar)}
                      alt=""
                      className="h-7 w-7 rounded-full border-2 border-white object-cover"
                    />
                    {b ? (
                      <img
                        src={avatarUrl(b.fullName || b.username, b.avatar)}
                        alt=""
                        className="h-7 w-7 rounded-full border-2 border-white object-cover"
                      />
                    ) : null}
                  </div>
                  <p className="min-w-0 truncate text-xs text-gray-500">
                    {b
                      ? t('discover.collaborationByTwo', {
                          a: a.fullName || a.username,
                          b: b.fullName || b.username,
                        })
                      : t('discover.collaborationByOne', { a: a.fullName || a.username })}
                  </p>
                </div>
                {item.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.description}</p>
                ) : null}
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3 w-3" />
                  {t('discover.membersCount', { count: (item.memberCount || 0).toLocaleString() })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default DiscoverCollaborationsCarousel;

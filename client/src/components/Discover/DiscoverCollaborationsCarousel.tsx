import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Users, Users2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { resolveMediaUrl } from '../../utils/mediaUrl';

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
  const raw =
    src ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=315efb&color=fff&size=${size}&bold=true`;
  return resolveMediaUrl(raw) || raw;
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
    el.scrollBy({ left: dir * Math.min(320, el.clientWidth * 0.75), behavior: 'smooth' });
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
        className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const a = item.owner;
          const b = item.coOwner;
          const bannerRaw = String(item.banner || '').trim();
          const bannerUrl = bannerRaw ? resolveMediaUrl(bannerRaw) || bannerRaw : null;

          return (
            <button
              key={item._id}
              type="button"
              onClick={() => onOpen(item)}
              className="w-[min(78vw,16.5rem)] shrink-0 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] hover:border-neutral-300 hover:shadow-md sm:w-[15.5rem] sm:rounded-[1.25rem]"
            >
              <div className="relative z-10 h-20 bg-neutral-100 sm:h-[5.5rem]">
                <div className="absolute inset-0 overflow-hidden bg-neutral-100">
                  {bannerUrl ? (
                    <>
                      <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-3">
                      <p className="line-clamp-2 text-center text-sm font-medium text-neutral-400">
                        {item.name}
                      </p>
                    </div>
                  )}
                </div>
                <span className="absolute left-2.5 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm sm:left-3 sm:top-2.5 sm:px-2.5 sm:text-[10px]">
                  <Users2 className="h-3 w-3" />
                  {t('discover.collaborationBadge')}
                </span>
                <div className="absolute bottom-0 left-3 z-20 flex translate-y-1/2 -space-x-2">
                  <img
                    src={avatarUrl(a.fullName || a.username, a.avatar)}
                    alt=""
                    className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  {b ? (
                    <img
                      src={avatarUrl(b.fullName || b.username, b.avatar)}
                      alt=""
                      className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  ) : null}
                </div>
              </div>
              <div className="relative z-0 px-3.5 pb-3.5 pt-6">
                <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{item.name}</p>
                <p className="mt-1 line-clamp-1 text-[11px] text-neutral-500">
                  {b
                    ? t('discover.collaborationByTwo', {
                        a: a.fullName || a.username,
                        b: b.fullName || b.username,
                      })
                    : t('discover.collaborationByOne', { a: a.fullName || a.username })}
                </p>
                {item.description ? (
                  <p className="mt-1.5 line-clamp-2 text-xs text-neutral-600">{item.description}</p>
                ) : null}
                <p className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-neutral-400">
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

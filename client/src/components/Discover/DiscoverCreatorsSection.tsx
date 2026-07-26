import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Flame,
  Users,
  Zap,
} from 'lucide-react';
import { DiscoverCreatorRowSkeleton, SkeletonPulse } from '../Common/Skeleton';
import { USERS_API } from '../../config/api';
import { profilePath } from '../../constants/paths';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const SECTION_PAGE_SIZE = 8;
const FETCH_LIMIT = 40;
const FEATURED_LIMIT = 8;
/** Fewer tiles in the active carousel */
const ACTIVE_LIMIT = 6;
const CREATORS_GRID_CLASS =
  'grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4';

export interface CreatorUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  followersCount: number;
  postsCount?: number;
  activityPoints?: number;
  activityStreak?: number;
  isSelf: boolean;
}

function creatorAvatar(user: CreatorUser, size = 128): string {
  const raw =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=315efb&color=fff&size=${size}&bold=true`;
  return resolveMediaUrl(raw) || raw;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

async function fetchCreators(
  token: string | null,
  sort: 'followers' | 'activity',
  limit: number,
  q?: string
): Promise<CreatorUser[]> {
  const params = new URLSearchParams();
  params.set('sort', sort);
  params.set('limit', String(limit));
  if (q?.trim()) params.set('q', q.trim());
  const res = await fetch(`${USERS_API}/list?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) return [];
  const data = (await res.json()) as CreatorUser[];
  return Array.isArray(data) ? data.filter((u) => !u.isSelf) : [];
}

/** Activity leaders first, then top creators to fill the carousel. */
function mergeActiveWithCreators(
  byActivity: CreatorUser[],
  byFollowers: CreatorUser[],
  limit: number
): CreatorUser[] {
  const out: CreatorUser[] = [];
  const seen = new Set<string>();
  const push = (u: CreatorUser) => {
    if (seen.has(u.id) || out.length >= limit) return;
    seen.add(u.id);
    out.push(u);
  };
  byActivity.forEach(push);
  byFollowers.forEach(push);
  return out;
}

export function useDiscoverCreators(searchQuery = '') {
  const { token } = useAuth();
  const [featured, setFeatured] = useState<CreatorUser[]>([]);
  const [active, setActive] = useState<CreatorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const isSearch = Boolean(searchQuery.trim());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isSearch) {
        const list = await fetchCreators(token, 'followers', FETCH_LIMIT, searchQuery);
        setFeatured(list);
        setActive([]);
      } else {
        const [byFollowers, byActivity] = await Promise.all([
          fetchCreators(token, 'followers', FETCH_LIMIT),
          fetchCreators(token, 'activity', ACTIVE_LIMIT * 2),
        ]);
        setFeatured(byFollowers);
        setActive(mergeActiveWithCreators(byActivity, byFollowers, ACTIVE_LIMIT));
      }
    } catch {
      setFeatured([]);
      setActive([]);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, isSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 280);
    return () => window.clearTimeout(timer);
  }, [load]);

  const featuredList = useMemo(
    () => (isSearch ? featured : featured.slice(0, FEATURED_LIMIT)),
    [featured, isSearch]
  );

  const moreList = useMemo(
    () => (isSearch ? [] : featured.slice(FEATURED_LIMIT)),
    [featured, isSearch]
  );

  return {
    loading,
    isSearch,
    active,
    featuredList,
    moreList,
    searchList: featured,
    isEmpty: featured.length === 0 && active.length === 0,
  };
}

const CreatorCard: React.FC<{ creator: CreatorUser; onOpen: () => void }> = ({
  creator,
  onOpen,
}) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm active:scale-[0.99] sm:rounded-3xl sm:p-4"
    >
      <img
        src={creatorAvatar(creator, 64)}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-gray-900">{creator.fullName}</p>
        <p className="truncate text-sm text-gray-500">@{creator.username}</p>
        {creator.bio ? (
          <p className="mt-1 line-clamp-1 text-xs text-gray-400">{creator.bio}</p>
        ) : (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
            <Users className="h-3 w-3" aria-hidden />
            {t('discover.creatorsTab.followersCount', {
              count: (creator.followersCount || 0).toLocaleString(),
            })}
          </p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
    </button>
  );
};

export const ActiveCreatorsCarousel: React.FC<{
  creators: CreatorUser[];
  loading?: boolean;
  onOpen: (username: string) => void;
}> = ({ creators, loading, onOpen }) => {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(240, el.clientWidth * 0.65), behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="mb-8 sm:mb-10">
        <div className="mb-3 sm:mb-4">
          <SkeletonPulse className="h-5 w-40" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: ACTIVE_LIMIT }).map((_, i) => (
            <div
              key={i}
              className="flex w-[5.25rem] shrink-0 flex-col items-center gap-1.5 sm:w-[5.75rem]"
            >
              <SkeletonPulse className="aspect-square w-full rounded-2xl" />
              <SkeletonPulse className="h-3 w-3/4" />
              <SkeletonPulse className="h-2.5 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (creators.length === 0) return null;

  return (
    <section className="mb-8 sm:mb-10">
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 sm:text-xl">
            {t('discover.sectionCreatorsActive')}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
            {t('discover.sectionCreatorsActiveHint')}
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
        className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3.5 [&::-webkit-scrollbar]:hidden"
      >
        {creators.map((creator) => {
          const points = creator.activityPoints || 0;
          const posts = creator.postsCount || 0;
          const streak = creator.activityStreak || 0;
          const followers = creator.followersCount || 0;
          return (
            <button
              key={creator.id}
              type="button"
              onClick={() => onOpen(creator.username)}
              className="group flex w-[5.25rem] shrink-0 flex-col items-center gap-1.5 text-center sm:w-[5.75rem]"
            >
              <span className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] group-hover:border-neutral-300 group-hover:shadow-md group-active:scale-[0.98] sm:rounded-[1.15rem]">
                <img
                  src={creatorAvatar(creator)}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </span>
              <span className="w-full min-w-0">
                <span className="block truncate text-[11px] font-semibold leading-tight text-neutral-900 sm:text-xs">
                  {creator.fullName || creator.username}
                </span>
                <span className="mt-1 flex w-full flex-col items-center gap-0.5 text-[10px] text-neutral-500">
                  {points > 0 ? (
                    <span className="inline-flex items-center gap-0.5 tabular-nums">
                      <Zap className="h-2.5 w-2.5 text-[#315efb]" aria-hidden />
                      {formatCompact(points)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 tabular-nums">
                      <Users className="h-2.5 w-2.5 text-neutral-400" aria-hidden />
                      {formatCompact(followers)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 tabular-nums text-neutral-400">
                    <span>{t('discover.creatorsTab.postsShort', { count: formatCompact(posts) })}</span>
                    {streak > 0 ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Flame className="h-2.5 w-2.5 text-orange-500" aria-hidden />
                        {streak}
                      </span>
                    ) : null}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

interface CreatorBlockProps {
  title: string;
  subtitle: string;
  creators: CreatorUser[];
  loading?: boolean;
  onOpen: (username: string) => void;
}

export const CreatorBlock: React.FC<CreatorBlockProps> = ({
  title,
  subtitle,
  creators,
  loading,
  onOpen,
}) => {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(SECTION_PAGE_SIZE);
  const [fullyExpanded, setFullyExpanded] = useState(false);

  useEffect(() => {
    setVisibleCount(SECTION_PAGE_SIZE);
    setFullyExpanded(false);
  }, [creators.length, title]);

  if (loading) {
    return (
      <section className="mb-6 sm:mb-8">
        <div className="mb-3 sm:mb-4">
          <SkeletonPulse className="h-5 w-48" />
          <SkeletonPulse className="mt-2 h-3 w-64" />
        </div>
        <div className={CREATORS_GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, i) => (
            <DiscoverCreatorRowSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (creators.length === 0) return null;

  const hasMoreThanPage = creators.length > SECTION_PAGE_SIZE;
  const displayCount = fullyExpanded ? creators.length : visibleCount;
  const visible = creators.slice(0, displayCount);
  const hasMore = !fullyExpanded && visibleCount < creators.length;
  const isCollapseAction = fullyExpanded;
  const ToggleIcon = isCollapseAction ? ChevronsDownUp : ChevronsUpDown;

  return (
    <section className="mb-6 sm:mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900 sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{subtitle}</p>
        </div>
        {hasMoreThanPage ? (
          <button
            type="button"
            onClick={() => setFullyExpanded((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:gap-2 sm:px-3.5 sm:text-sm"
          >
            <ToggleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            <span>{isCollapseAction ? t('discover.collapseAll') : t('discover.expandAll')}</span>
          </button>
        ) : null}
      </div>

      <div className={CREATORS_GRID_CLASS}>
        {visible.map((creator) => (
          <CreatorCard
            key={creator.id}
            creator={creator}
            onOpen={() => onOpen(creator.username)}
          />
        ))}
      </div>

      {hasMore ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + SECTION_PAGE_SIZE)}
            className="rounded-full border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 sm:px-8 sm:py-2.5"
          >
            {t('discover.showMore')}
          </button>
        </div>
      ) : null}
    </section>
  );
};

interface DiscoverCreatorsSectionProps {
  searchQuery?: string;
  hideWhenEmpty?: boolean;
}

/**
 * Full creators stack (search / empty states). Prefer interleaved slices on Discover.
 */
const DiscoverCreatorsSection: React.FC<DiscoverCreatorsSectionProps> = ({
  searchQuery = '',
  hideWhenEmpty = true,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading, isSearch, active, featuredList, moreList, searchList, isEmpty } =
    useDiscoverCreators(searchQuery);
  const openProfile = (username: string) => navigate(profilePath(username));

  if (!loading && isEmpty && hideWhenEmpty) return null;

  if (!loading && isEmpty) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">{t('discover.creatorsTab.noResults')}</p>
    );
  }

  if (isSearch) {
    return (
      <CreatorBlock
        title={t('discover.sectionCreatorsSearch')}
        subtitle={t('discover.sectionCreatorsSearchHint')}
        creators={searchList}
        loading={loading}
        onOpen={openProfile}
      />
    );
  }

  return (
    <>
      <ActiveCreatorsCarousel creators={active} loading={loading} onOpen={openProfile} />
      <CreatorBlock
        title={t('discover.sectionCreatorsFeatured')}
        subtitle={t('discover.sectionCreatorsFeaturedHint')}
        creators={featuredList}
        loading={loading}
        onOpen={openProfile}
      />
      <CreatorBlock
        title={t('discover.sectionCreatorsMore')}
        subtitle={t('discover.sectionCreatorsMoreHint')}
        creators={moreList}
        onOpen={openProfile}
      />
    </>
  );
};

export default DiscoverCreatorsSection;

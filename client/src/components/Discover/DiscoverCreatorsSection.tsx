import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, Users } from 'lucide-react';
import { DiscoverCardSkeleton } from '../Common/Skeleton';
import { USERS_API } from '../../config/api';
import { profilePath } from '../../constants/paths';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';

/** 2 rows × 4 cards (desktop); «Show more» loads another 2 rows. */
const SECTION_PAGE_SIZE = 8;
const FETCH_LIMIT = 40;
const FEATURED_LIMIT = 8;
const CREATORS_GRID_CLASS =
  'grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4';

interface CreatorUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  followersCount: number;
  isSelf: boolean;
}

function creatorAvatar(user: CreatorUser, size = 56): string {
  return (
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=315efb&color=fff&size=${size}&bold=true`
  );
}

interface DiscoverCreatorsSectionProps {
  searchQuery?: string;
  hideWhenEmpty?: boolean;
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
        src={creatorAvatar(creator)}
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

interface CreatorBlockProps {
  title: string;
  subtitle: string;
  creators: CreatorUser[];
  onOpen: (username: string) => void;
}

const CreatorBlock: React.FC<CreatorBlockProps> = ({ title, subtitle, creators, onOpen }) => {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(SECTION_PAGE_SIZE);
  const [fullyExpanded, setFullyExpanded] = useState(false);

  useEffect(() => {
    setVisibleCount(SECTION_PAGE_SIZE);
    setFullyExpanded(false);
  }, [creators.length, title]);

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

/**
 * Creators split into sections inside the main Discover tab.
 */
const DiscoverCreatorsSection: React.FC<DiscoverCreatorsSectionProps> = ({
  searchQuery = '',
  hideWhenEmpty = true,
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('sort', 'followers');
      params.set('limit', String(FETCH_LIMIT));
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      const res = await fetch(`${USERS_API}/list?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = (await res.json()) as CreatorUser[];
        setCreators(Array.isArray(data) ? data.filter((u) => !u.isSelf) : []);
      } else {
        setCreators([]);
      }
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 280);
    return () => window.clearTimeout(timer);
  }, [load]);

  const isSearch = Boolean(searchQuery.trim());

  const featured = useMemo(
    () => (isSearch ? [] : creators.slice(0, FEATURED_LIMIT)),
    [creators, isSearch]
  );

  const more = useMemo(
    () => (isSearch ? creators : creators.slice(FEATURED_LIMIT)),
    [creators, isSearch]
  );

  const openProfile = (username: string) => navigate(profilePath(username));

  if (!loading && creators.length === 0 && hideWhenEmpty) {
    return null;
  }

  if (loading) {
    return (
      <section className="mb-6 sm:mb-8">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base font-bold text-gray-900 sm:text-xl">
            {t('discover.sectionCreators')}
          </h2>
        </div>
        <div className={CREATORS_GRID_CLASS}>
          {Array.from({ length: SECTION_PAGE_SIZE }).map((_, i) => (
            <DiscoverCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (creators.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">{t('discover.creatorsTab.noResults')}</p>
    );
  }

  if (isSearch) {
    return (
      <CreatorBlock
        title={t('discover.sectionCreatorsSearch')}
        subtitle={t('discover.sectionCreatorsSearchHint')}
        creators={creators}
        onOpen={openProfile}
      />
    );
  }

  return (
    <>
      <CreatorBlock
        title={t('discover.sectionCreatorsFeatured')}
        subtitle={t('discover.sectionCreatorsFeaturedHint')}
        creators={featured}
        onOpen={openProfile}
      />
      <CreatorBlock
        title={t('discover.sectionCreatorsMore')}
        subtitle={t('discover.sectionCreatorsMoreHint')}
        creators={more}
        onOpen={openProfile}
      />
    </>
  );
};

export default DiscoverCreatorsSection;

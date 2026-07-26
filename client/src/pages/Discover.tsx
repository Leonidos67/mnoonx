import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronsUpDown, ChevronsDownUp, Users, X } from 'lucide-react';
import {
  isBrowserOnline,
  reportNetworkRestored,
  reportNetworkUnreachable,
} from '../utils/networkStatus';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DiscoverCoursesTab from '../components/Discover/DiscoverCoursesTab';
import DiscoverCreatorsSection, {
  ActiveCreatorsCarousel,
  CreatorBlock,
  useDiscoverCreators,
} from '../components/Discover/DiscoverCreatorsSection';
import DiscoverCollaborationsCarousel, {
  type CollaborationItem,
} from '../components/Discover/DiscoverCollaborationsCarousel';
import DiscoverGettingStarted from '../components/Discover/DiscoverGettingStarted';
import DiscoverExportBackground from '../components/Discover/DiscoverExportBackground';
import DiscoverTabHeader from '../components/Discover/DiscoverTabHeader';
import DiscoverTabSwitcher from '../components/Discover/DiscoverTabSwitcher';
import MobileBottomSheet from '../components/Common/MobileBottomSheet';
import { DiscoverCardSkeleton, DiscoverCreatorCardSkeleton, SkeletonPulse } from '../components/Common/Skeleton';
import { COMMUNITIES_API as API_URL } from '../config/api';
import { profilePath } from '../constants/paths';
import { useTranslation } from '../i18n/useTranslation';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { communityCategoryLabel } from '../constants/communityCategories';

const SECTION_PAGE_SIZE = 4;
const POPULAR_SECTION_LIMIT = 20;

type DiscoverTab = 'discover' | 'courses';
type SectionId = 'popular' | 'public' | 'search' | 'new';

interface Community {
  _id: string;
  name: string;
  handle: string;
  description: string;
  memberCount: number;
  category: string;
  avatar: string;
  banner: string;
  createdAt?: string;
  kind?: 'community' | 'collaboration';
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };
  coOwner?: {
    _id: string;
    username: string;
    fullName: string;
    avatar?: string;
  } | null;
  ownerFace?: {
    type: 'user' | 'community';
    name: string;
    handle: string;
    username?: string;
    fullName?: string;
  } | null;
  coOwnerFace?: {
    type: 'user' | 'community';
    name: string;
    handle: string;
    username?: string;
    fullName?: string;
  } | null;
  isPublic: boolean;
  isPaid: boolean;
  price: number;
  isMember?: boolean;
  isOwner?: boolean;
  requiresJoinCode?: boolean;
}

function isCollaboration(c: Community): boolean {
  return c.kind === 'collaboration';
}

function matchesSearch(community: Community, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    community.name.toLowerCase().includes(q) ||
    community.description.toLowerCase().includes(q) ||
    community.handle.toLowerCase().includes(q) ||
    community.category.toLowerCase().includes(q) ||
    (community.owner?.username || '').toLowerCase().includes(q) ||
    (community.coOwner?.username || '').toLowerCase().includes(q)
  );
}

function tabFromParams(params: URLSearchParams): DiscoverTab {
  const tab = params.get('tab');
  if (tab === 'courses') return 'courses';
  return 'discover';
}

function communityAvatar(community: Community, size = 56): string {
  const src =
    community.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=111827&color=fff&size=${size}&bold=true`;
  return resolveMediaUrl(src) || src;
}

/** Real uploaded banner only — never fall back to avatar / ui-avatars. */
function communityBannerUrl(community: Community): string | null {
  const raw = String(community.banner || '').trim();
  if (!raw) return null;
  return resolveMediaUrl(raw) || raw;
}

interface CommunityCardProps {
  community: Community;
  onOpen: (community: Community) => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, onOpen }) => {
  const { t } = useTranslation();
  const bannerUrl = communityBannerUrl(community);

  return (
    <button
      type="button"
      onClick={() => onOpen(community)}
      className="group flex w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,transform] hover:border-neutral-300 hover:shadow-md active:scale-[0.99] sm:flex-col sm:rounded-[1.25rem]"
    >
      {/* Mobile: narrow cover strip | Desktop: short banner */}
      <div className="relative z-10 h-auto w-[5.25rem] shrink-0 self-stretch bg-neutral-100 sm:h-24 sm:w-full sm:self-auto lg:h-[6.5rem]">
        <div className="absolute inset-0 overflow-hidden bg-neutral-100">
          {bannerUrl ? (
            <>
              <img
                src={bannerUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent sm:from-black/40"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 sm:px-4">
              <p className="line-clamp-3 text-center text-[11px] font-medium leading-snug text-neutral-400 sm:line-clamp-2 sm:text-sm">
                {community.name}
              </p>
            </div>
          )}
        </div>
        {/* Half on cover / half on white block */}
        <img
          src={communityAvatar(community, 64)}
          alt=""
          className="pointer-events-none absolute right-0 top-1/2 z-20 h-9 w-9 translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-md ring-2 ring-white sm:bottom-0 sm:left-4 sm:right-auto sm:top-auto sm:h-11 sm:w-11 sm:translate-x-0 sm:translate-y-1/2"
        />
      </div>

      <div className="relative z-0 flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5 pl-5 sm:px-4 sm:pb-3.5 sm:pl-4 sm:pt-7">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="min-w-0 truncate text-sm font-semibold text-neutral-900 sm:text-[15px]">
            {community.name}
          </p>
          {community.isPublic === false ? (
            <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
              {t('discover.private')}
            </span>
          ) : null}
          {community.isPaid ? (
            <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              {t('discover.paid')}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-neutral-500 sm:text-xs">
          {isCollaboration(community) && community.coOwner
            ? t('discover.collaborationByTwo', {
                a:
                  community.ownerFace?.name ||
                  community.owner?.fullName ||
                  community.owner?.username ||
                  '',
                b:
                  community.coOwnerFace?.name ||
                  community.coOwner.fullName ||
                  community.coOwner.username,
              })
            : t('discover.byOwner', {
                name: community.owner?.fullName || community.owner?.username || '',
              })}
        </p>
        {community.description ? (
          <p className="mt-1.5 line-clamp-1 text-xs text-neutral-600 sm:mt-2 sm:line-clamp-2 sm:text-sm">
            {community.description}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-neutral-500 sm:mt-2.5 sm:text-xs">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
            {t('discover.membersCount', { count: community.memberCount.toLocaleString() })}
          </span>
          {community.category ? (
            <span className="max-w-[42%] truncate rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">
              {communityCategoryLabel(community.category, t)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
};

interface CommunitySectionProps {
  sectionId: SectionId;
  title: string;
  subtitle?: string;
  communities: Community[];
  onOpen: (community: Community) => void;
  fullyExpanded: boolean;
  onToggleSection: (id: SectionId) => void;
}

const CommunitySection: React.FC<CommunitySectionProps> = ({
  sectionId,
  title,
  subtitle,
  communities,
  onOpen,
  fullyExpanded,
  onToggleSection,
}) => {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(SECTION_PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(SECTION_PAGE_SIZE);
  }, [communities.length, sectionId, fullyExpanded]);

  if (communities.length === 0) return null;

  const hasMoreThanPage = communities.length > SECTION_PAGE_SIZE;
  const displayCount = fullyExpanded ? communities.length : visibleCount;
  const visible = communities.slice(0, displayCount);
  const hasMore = !fullyExpanded && visibleCount < communities.length;

  const isCollapseAction = fullyExpanded;
  const toggleLabel = isCollapseAction ? t('discover.collapseAll') : t('discover.expandAll');
  const ToggleIcon = isCollapseAction ? ChevronsDownUp : ChevronsUpDown;

  return (
    <section className="mb-6 sm:mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 sm:text-xl">{title}</h2>
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{subtitle}</p> : null}
        </div>
        {hasMoreThanPage ? (
          <button
            type="button"
            onClick={() => onToggleSection(sectionId)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:gap-2 sm:px-3.5 sm:text-sm"
          >
            <ToggleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            <span>{toggleLabel}</span>
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3.5 xl:grid-cols-4">
        {visible.map((community) => (
          <CommunityCard key={community._id} community={community} onOpen={onOpen} />
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

const Discover: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = tabFromParams(searchParams);

  const [discoverSearch, setDiscoverSearch] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  type SectionState = { fullyExpanded: boolean };
  const [sections, setSections] = useState<Record<SectionId, SectionState>>({
    popular: { fullyExpanded: false },
    public: { fullyExpanded: false },
    search: { fullyExpanded: false },
    new: { fullyExpanded: false },
  });

  const searchQuery = discoverSearch.trim();
  const isSearching = searchQuery.length > 0;
  /** Browse-mode creators only (search uses DiscoverCreatorsSection). */
  const creators = useDiscoverCreators('');
  const openCreatorProfile = useCallback(
    (username: string) => navigate(profilePath(username)),
    [navigate]
  );

  const setActiveTab = useCallback(
    (tab: DiscoverTab) => {
      if (tab === 'courses') {
        setSearchParams({ tab: 'courses' }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams]
  );

  useEffect(() => {
    void fetchCommunities();
  }, [token]);

  const fetchCommunities = async () => {
    if (!isBrowserOnline()) {
      reportNetworkUnreachable();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
        reportNetworkRestored();
      } else {
        reportNetworkUnreachable();
      }
    } catch (err) {
      console.error('Fetch communities error:', err);
      reportNetworkUnreachable();
    } finally {
      setLoading(false);
    }
  };

  const patchCommunityMembership = (handle: string, isMember: boolean, memberCount?: number) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.handle === handle
          ? {
              ...c,
              isMember,
              memberCount: typeof memberCount === 'number' ? memberCount : c.memberCount,
            }
          : c
      )
    );
    setSelectedCommunity((prev) =>
      prev && prev.handle === handle
        ? {
            ...prev,
            isMember,
            memberCount: typeof memberCount === 'number' ? memberCount : prev.memberCount,
          }
        : prev
    );
  };

  const handleJoin = async (community: Community) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }

    const handle = community.handle;
    try {
      setJoinLoading(true);
      const res = await fetch(`${API_URL}/${handle}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(t('discover.joinSuccess'));
        patchCommunityMembership(handle, true, data.memberCount);
        closeCommunityPreview();
        navigate(`/community/${handle}`);
        return;
      }

      const data = await res.json().catch(() => ({}));
      // Passphrase / gate: open the community page so the user can join there
      if (data.code === 'INVALID_JOIN_CODE' || community.requiresJoinCode) {
        closeCommunityPreview();
        navigate(`/community/${handle}`);
        return;
      }
      showToast(data.message || t('discover.joinFailed'), 'error');
    } catch (err) {
      console.error('Join error:', err);
      showToast(t('discover.joinFailed'), 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async (communityHandle: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }

    try {
      setJoinLoading(true);
      const res = await fetch(`${API_URL}/${communityHandle}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(t('discover.leaveSuccess'));
        patchCommunityMembership(communityHandle, false, data.memberCount);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || t('discover.leaveFailed'), 'error');
      }
    } catch (err) {
      console.error('Leave error:', err);
      showToast(t('discover.leaveFailed'), 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const regularCommunities = useMemo(
    () => communities.filter((c) => !isCollaboration(c)),
    [communities]
  );

  const collaborations = useMemo(
    () => communities.filter((c) => isCollaboration(c)),
    [communities]
  );

  const searchResults = useMemo(
    () => regularCommunities.filter((c) => matchesSearch(c, searchQuery)),
    [regularCommunities, searchQuery]
  );

  const popularCommunities = useMemo(
    () =>
      [...regularCommunities]
        .sort((a, b) => b.memberCount - a.memberCount)
        .slice(0, POPULAR_SECTION_LIMIT),
    [regularCommunities]
  );

  const popularIds = useMemo(
    () => new Set(popularCommunities.map((c) => c._id)),
    [popularCommunities]
  );

  const publicCommunities = useMemo(
    () => regularCommunities.filter((c) => c.isPublic !== false && !popularIds.has(c._id)),
    [regularCommunities, popularIds]
  );

  const newCommunities = useMemo(
    () =>
      [...regularCommunities]
        .sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 16),
    [regularCommunities]
  );

  const collabSearchResults = useMemo(
    () => (isSearching ? collaborations.filter((c) => matchesSearch(c, searchQuery)) : collaborations),
    [collaborations, searchQuery, isSearching]
  );

  const sectionCount = useCallback(
    (id: SectionId) => {
      if (id === 'search') return searchResults.length;
      if (id === 'popular') return popularCommunities.length;
      if (id === 'new') return newCommunities.length;
      return publicCommunities.length;
    },
    [
      searchResults.length,
      popularCommunities.length,
      publicCommunities.length,
      newCommunities.length,
    ]
  );

  const toggleSection = useCallback(
    (id: SectionId) => {
      setSections((prev) => {
        const current = prev[id];
        const count = sectionCount(id);
        const hasMoreThanPage = count > SECTION_PAGE_SIZE;

        if (!current.fullyExpanded && hasMoreThanPage) {
          return { ...prev, [id]: { fullyExpanded: true } };
        }
        return { ...prev, [id]: { fullyExpanded: false } };
      });
    },
    [sectionCount]
  );

  const openCommunityPreview = (community: Community) => {
    setSelectedCommunity(community);
  };

  const closeCommunityPreview = () => {
    setSelectedCommunity(null);
  };

  const clearSearch = () => {
    setDiscoverSearch('');
    setSections((prev) => ({
      ...prev,
      search: { fullyExpanded: false },
    }));
  };

  const renderCommunityPreview = (community: Community) => (
    <>
      <div className="relative shrink-0 pt-4 max-lg:px-0 sm:px-6 sm:pt-6">
        <button
          type="button"
          onClick={closeCommunityPreview}
          className="absolute right-4 top-4 hidden text-white/80 transition-colors hover:text-white lg:block"
          aria-label={t('common.close')}
        >
          <X className="h-6 w-6" strokeWidth={2} aria-hidden />
        </button>
        <div className="flex items-center gap-4 pr-0 lg:pr-10">
          <img
            src={communityAvatar(community, 64)}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl text-black">{community.name}</h2>
              {isCollaboration(community) ? (
                <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-xs font-semibold text-[#315efb]">
                  {t('discover.collaborationBadge')}
                </span>
              ) : null}
              {community.isPaid ? (
                <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-black">
                  ${community.price}
                </span>
              ) : null}
            </div>
            <p className="text-gray-900">@{community.handle}</p>
            {isCollaboration(community) && community.coOwner ? (
              <p className="mt-1 text-sm text-gray-600">
                {t('discover.collaborationByTwo', {
                  a:
                    community.ownerFace?.name ||
                    community.owner?.fullName ||
                    community.owner?.username ||
                    '',
                  b:
                    community.coOwnerFace?.name ||
                    community.coOwner.fullName ||
                    community.coOwner.username,
                })}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto overscroll-contain pb-4 pt-4 max-lg:px-0 sm:p-6">
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {t('discover.about')}
          </h3>
          <p className="leading-relaxed text-gray-700">{community.description}</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
          <div>
            <p className="text-xs text-gray-500">{t('discover.membersLabel')}</p>
            <p className="text-2xl font-bold text-gray-900">{community.memberCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('discover.category')}</p>
            <p className="text-lg font-semibold text-gray-900">
              {communityCategoryLabel(community.category, t)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('discover.type')}</p>
            <p className="text-lg font-semibold text-gray-900">
              {community.isPublic ? t('common.public') : t('common.private')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {!community.isOwner ? (
            community.isMember ? (
              <button
                type="button"
                onClick={() => void handleLeave(community.handle)}
                disabled={joinLoading}
                className="flex-1 rounded-2xl border border-red-200 bg-white py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {joinLoading ? t('discover.leaving') : t('discover.leaveCommunity')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleJoin(community)}
                disabled={joinLoading}
                className="flex-1 rounded-2xl bg-black py-3 font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {joinLoading ? t('discover.joining') : t('discover.joinCommunity')}
              </button>
            )
          ) : null}
          <button
            type="button"
            onClick={() => {
              closeCommunityPreview();
              navigate(`/community/${community.handle}`);
            }}
            className="flex-1 rounded-2xl bg-gray-100 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            {t('discover.viewPage')}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full px-3 py-4 sm:px-6 lg:px-8">
      <DiscoverTabSwitcher activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'courses' ? (
        <DiscoverCoursesTab />
      ) : (
        <>
          <DiscoverTabHeader
            title={t('discover.title')}
            tagline={t('discover.tabTagline')}
            searchValue={discoverSearch}
            onSearchChange={setDiscoverSearch}
            searchPlaceholder={t('discover.searchWidePlaceholder')}
            searchAriaLabel={t('discover.searchPlaceholder')}
            clearSearchAriaLabel={t('discover.clearSearch')}
            onClearSearch={clearSearch}
            searchHint={
              isSearching ? (
                <p className="mt-2 text-center text-sm text-gray-500">
                  {t('discover.searchResultsCount', { count: searchResults.length, query: searchQuery })}
                </p>
              ) : null
            }
          />

          <div className="mx-auto w-full">
          {loading ? (
            <div className="flex flex-col gap-8 sm:gap-10">
              <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3.5 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <DiscoverCardSkeleton key={`community-sk-${i}`} />
                ))}
              </div>
              <section>
                <div className="mb-3 sm:mb-4">
                  <SkeletonPulse className="h-5 w-40" />
                  <SkeletonPulse className="mt-2 h-3 w-56" />
                </div>
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`active-sk-${i}`}
                      className="flex w-[5.25rem] shrink-0 flex-col items-center gap-1.5 sm:w-[5.75rem]"
                    >
                      <SkeletonPulse className="aspect-square w-full rounded-2xl" />
                      <SkeletonPulse className="h-3 w-3/4" />
                      <SkeletonPulse className="h-2.5 w-1/2" />
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <div className="mb-3 sm:mb-4">
                  <SkeletonPulse className="h-5 w-48" />
                  <SkeletonPulse className="mt-2 h-3 w-64" />
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3.5 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <DiscoverCreatorCardSkeleton key={`creator-sk-${i}`} />
                  ))}
                </div>
              </section>
            </div>
          ) : isSearching ? (
            <>
              {searchResults.length === 0 ? (
                <div className="py-10 text-center sm:py-12">
                  <p className="text-gray-500">{t('discover.noResults')}</p>
                </div>
              ) : (
                <CommunitySection
                  sectionId="search"
                  title={t('discover.searchResults')}
                  subtitle={t('discover.searchResultsHint')}
                  communities={searchResults}
                  onOpen={openCommunityPreview}
                  fullyExpanded={sections.search.fullyExpanded}
                  onToggleSection={toggleSection}
                />
              )}
              <DiscoverCollaborationsCarousel
                items={collabSearchResults as CollaborationItem[]}
                onOpen={(item) => {
                  const full = communities.find((c) => c._id === item._id);
                  if (full) openCommunityPreview(full);
                  else navigate(`/community/${item.handle}`);
                }}
              />
              <DiscoverCreatorsSection searchQuery={searchQuery} hideWhenEmpty={false} />
              {searchResults.length === 0 && collabSearchResults.length === 0 ? (
                <div className="pb-10 text-center">
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mt-2 rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {t('discover.clearSearch')}
                  </button>
                </div>
              ) : null}
            </>
          ) : regularCommunities.length === 0 && collaborations.length === 0 ? (
            <div className="py-8 text-center sm:py-12">
              <DiscoverGettingStarted />
              <p className="mt-6 text-gray-500">{t('discover.noCommunitiesFound')}</p>
              <div className="mt-10 text-left">
                <DiscoverCreatorsSection />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-3 sm:mb-10">
                <DiscoverExportBackground />
                <DiscoverGettingStarted />
              </div>
              <DiscoverCollaborationsCarousel
                items={collaborations as CollaborationItem[]}
                onOpen={(item) => {
                  const full = communities.find((c) => c._id === item._id);
                  if (full) openCommunityPreview(full);
                  else navigate(`/community/${item.handle}`);
                }}
              />
              <CommunitySection
                sectionId="popular"
                title={t('discover.sectionPopular')}
                subtitle={t('discover.sectionPopularHint')}
                communities={popularCommunities}
                onOpen={openCommunityPreview}
                fullyExpanded={sections.popular.fullyExpanded}
                onToggleSection={toggleSection}
              />
              <ActiveCreatorsCarousel
                creators={creators.active}
                loading={creators.loading}
                onOpen={openCreatorProfile}
              />
              <CommunitySection
                sectionId="new"
                title={t('discover.sectionNew')}
                subtitle={t('discover.sectionNewHint')}
                communities={newCommunities}
                onOpen={openCommunityPreview}
                fullyExpanded={sections.new.fullyExpanded}
                onToggleSection={toggleSection}
              />
              <CreatorBlock
                title={t('discover.sectionCreatorsFeatured')}
                subtitle={t('discover.sectionCreatorsFeaturedHint')}
                creators={creators.featuredList}
                loading={creators.loading}
                onOpen={openCreatorProfile}
              />
              <CommunitySection
                sectionId="public"
                title={t('discover.sectionPublic')}
                subtitle={t('discover.sectionPublicHint')}
                communities={publicCommunities}
                onOpen={openCommunityPreview}
                fullyExpanded={sections.public.fullyExpanded}
                onToggleSection={toggleSection}
              />
              <CreatorBlock
                title={t('discover.sectionCreatorsMore')}
                subtitle={t('discover.sectionCreatorsMoreHint')}
                creators={creators.moreList}
                onOpen={openCreatorProfile}
              />
            </>
          )}
          </div>
        </>
      )}

      {selectedCommunity ? (
        <div
          className="fixed inset-0 z-[100] hidden items-center justify-center bg-black/20 p-4 backdrop-blur-sm lg:flex"
          role="presentation"
          onClick={closeCommunityPreview}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {renderCommunityPreview(selectedCommunity)}
          </div>
        </div>
      ) : null}

      <MobileBottomSheet
        open={!!selectedCommunity}
        onClose={closeCommunityPreview}
        title={selectedCommunity?.name ?? t('discover.sheetFallbackTitle')}
      >
        {selectedCommunity ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {renderCommunityPreview(selectedCommunity)}
          </div>
        ) : null}
      </MobileBottomSheet>
    </div>
  );
};

export default Discover;

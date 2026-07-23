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
import DiscoverCreatorsSection from '../components/Discover/DiscoverCreatorsSection';
import DiscoverCollaborationsCarousel, {
  type CollaborationItem,
} from '../components/Discover/DiscoverCollaborationsCarousel';
import DiscoverGettingStarted from '../components/Discover/DiscoverGettingStarted';
import DiscoverExportBackground from '../components/Discover/DiscoverExportBackground';
import DiscoverTabHeader from '../components/Discover/DiscoverTabHeader';
import DiscoverTabSwitcher from '../components/Discover/DiscoverTabSwitcher';
import MobileBottomSheet from '../components/Common/MobileBottomSheet';
import { DiscoverCardSkeleton } from '../components/Common/Skeleton';
import { COMMUNITIES_API as API_URL } from '../config/api';
import { useTranslation } from '../i18n/useTranslation';

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
  isPublic: boolean;
  isPaid: boolean;
  price: number;
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
  return (
    community.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=111827&color=fff&size=${size}&bold=true`
  );
}

interface CommunityCardProps {
  community: Community;
  onOpen: (community: Community) => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, onOpen }) => {
  const { t } = useTranslation();
  const cover =
    community.banner ||
    community.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=111827&color=fff&size=400&bold=true`;

  return (
    <button
      type="button"
      onClick={() => onOpen(community)}
      className="group w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all hover:border-gray-300 hover:shadow-sm active:scale-[0.99] sm:rounded-3xl"
    >
      <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
        <img
          src={cover}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <img
            src={communityAvatar(community, 48)}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-[15px] font-semibold text-gray-900">{community.name}</p>
              {community.isPublic === false ? (
                <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                  {t('discover.private')}
                </span>
              ) : null}
              {community.isPaid ? (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  {t('discover.paid')}
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-gray-500">
              {t('discover.byOwner', {
                name: community.owner?.fullName || community.owner?.username || '',
              })}
            </p>
          </div>
        </div>
        {community.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{community.description}</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {t('discover.membersCount', { count: community.memberCount.toLocaleString() })}
          </span>
          {community.category ? (
            <span className="max-w-[45%] truncate rounded-full bg-gray-100 px-2 py-0.5">
              {community.category}
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

      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
  }, []);

  const fetchCommunities = async () => {
    if (!isBrowserOnline()) {
      reportNetworkUnreachable();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/list`);
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

  const handleJoin = async (communityHandle: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }

    try {
      setJoinLoading(true);
      const res = await fetch(`${API_URL}/${communityHandle}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast(t('discover.joinSuccess'));
        void fetchCommunities();
        closeCommunityPreview();
      } else {
        const data = await res.json();
        showToast(data.message || t('discover.joinFailed'), 'error');
      }
    } catch (err) {
      console.error('Join error:', err);
    } finally {
      setJoinLoading(false);
    }
  };

  const searchQuery = discoverSearch.trim();
  const isSearching = searchQuery.length > 0;

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
                  a: community.owner?.fullName || community.owner?.username || '',
                  b: community.coOwner.fullName || community.coOwner.username,
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
            <p className="text-lg font-semibold text-gray-900">{community.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('discover.type')}</p>
            <p className="text-lg font-semibold text-gray-900">
              {community.isPublic ? t('common.public') : t('common.private')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleJoin(community.handle)}
            disabled={joinLoading}
            className="flex-1 rounded-2xl bg-black py-3 font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {joinLoading ? t('discover.joining') : t('discover.joinCommunity')}
          </button>
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
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <DiscoverCardSkeleton key={i} />
              ))}
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
              <CommunitySection
                sectionId="new"
                title={t('discover.sectionNew')}
                subtitle={t('discover.sectionNewHint')}
                communities={newCommunities}
                onOpen={openCommunityPreview}
                fullyExpanded={sections.new.fullyExpanded}
                onToggleSection={toggleSection}
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
              <DiscoverCreatorsSection />
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

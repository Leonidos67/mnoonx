import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DiscoverMarketTab from '../components/Discover/DiscoverMarketTab';
import DiscoverExportBackground from '../components/Discover/DiscoverExportBackground';
import MobileBottomSheet from '../components/Common/MobileBottomSheet';
import { COMMUNITIES_API as API_URL } from '../config/api';

const SECTION_PAGE_SIZE = 4;

type DiscoverTab = 'discover' | 'market';

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
  owner: {
    _id: string;
    username: string;
    fullName: string;
  };
  isPublic: boolean;
  isPaid: boolean;
  price: number;
}

function matchesSearch(community: Community, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    community.name.toLowerCase().includes(q) ||
    community.description.toLowerCase().includes(q) ||
    community.handle.toLowerCase().includes(q) ||
    community.category.toLowerCase().includes(q)
  );
}

function tabFromParams(params: URLSearchParams): DiscoverTab {
  return params.get('tab') === 'market' ? 'market' : 'discover';
}

interface CommunityCardProps {
  community: Community;
  onOpen: (community: Community) => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, onOpen }) => (
  <div
    className="bg-white border border-gray-200 rounded-3xl p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
    onClick={() => onOpen(community)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onOpen(community);
    }}
    role="button"
    tabIndex={0}
  >
    <div className="flex items-start gap-4">
      <img
        src={
          community.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=000&color=fff&size=56&bold=true`
        }
        alt={community.name}
        className="w-14 h-14 rounded-full object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-lg">{community.name}</h3>
          {community.isPublic === false && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
              Private
            </span>
          )}
          {community.isPaid && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Paid</span>
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
      </div>
    </div>

    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>{community.memberCount.toLocaleString()} members</span>
      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{community.category}</span>
    </div>

    <button
      type="button"
      className="mt-4 w-full py-3 bg-blue-600 text-white font-medium rounded-2xl transition-colors hover:bg-blue-700"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(community);
      }}
    >
      View Community
    </button>
  </div>
);

interface CommunitySectionProps {
  title: string;
  communities: Community[];
  onOpen: (community: Community) => void;
}

const CommunitySection: React.FC<CommunitySectionProps> = ({ title, communities, onOpen }) => {
  const [visibleCount, setVisibleCount] = useState(SECTION_PAGE_SIZE);
  const visible = communities.slice(0, visibleCount);
  const hasMore = visibleCount < communities.length;

  if (communities.length === 0) return null;

  return (
    <section className="mb-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map((community) => (
          <CommunityCard key={community._id} community={community} onOpen={onOpen} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + SECTION_PAGE_SIZE)}
            className="px-8 py-2.5 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Show more
          </button>
        </div>
      )}
    </section>
  );
};

const Discover: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = tabFromParams(searchParams);

  const [discoverSearch, setDiscoverSearch] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const setActiveTab = useCallback(
    (tab: DiscoverTab) => {
      if (tab === 'market') {
        setSearchParams({ tab: 'market' }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams]
  );

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/list`);
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (err) {
      console.error('Fetch communities error:', err);
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
        showToast('Joined community successfully!');
        fetchCommunities();
        closeCommunityPreview();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to join', 'error');
      }
    } catch (err) {
      console.error('Join error:', err);
    } finally {
      setJoinLoading(false);
    }
  };

  const filteredCommunities = useMemo(
    () => communities.filter((c) => matchesSearch(c, discoverSearch)),
    [communities, discoverSearch]
  );

  const popularCommunities = useMemo(
    () => [...filteredCommunities].sort((a, b) => b.memberCount - a.memberCount),
    [filteredCommunities]
  );

  const publicCommunities = useMemo(
    () => filteredCommunities.filter((c) => c.isPublic !== false),
    [filteredCommunities]
  );

  const openCommunityPreview = (community: Community) => {
    setSelectedCommunity(community);
  };

  const closeCommunityPreview = () => {
    setSelectedCommunity(null);
  };

  const renderCommunityPreview = (community: Community) => (
    <>
      <div className="relative shrink-0 pt-4 max-lg:px-0 sm:px-6 sm:pt-6">
        <button
          type="button"
          onClick={closeCommunityPreview}
          className="absolute right-4 top-4 hidden text-white/80 transition-colors hover:text-white lg:block"
          aria-label="Close"
        >
          <X className="h-6 w-6" strokeWidth={2} aria-hidden />
        </button>
        <div className="flex items-center gap-4 pr-0 lg:pr-10">
          <img
            src={
              community.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=000&color=fff&size=64&bold=true`
            }
            alt={community.name}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl text-black">{community.name}</h2>
              {community.isPaid && (
                <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-black">
                  ${community.price}
                </span>
              )}
            </div>
            <p className="text-gray-900">@{community.handle}</p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto overscroll-contain pb-4 pt-4 max-lg:px-0 sm:p-6">
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">About</h3>
          <p className="leading-relaxed text-gray-700">{community.description}</p>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
          <div>
            <p className="text-xs text-gray-500">Members</p>
            <p className="text-2xl font-bold text-gray-900">{community.memberCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="text-lg font-semibold text-gray-900">{community.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Type</p>
            <p className="text-lg font-semibold text-gray-900">{community.isPublic ? 'Public' : 'Private'}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void handleJoin(community.handle)}
            disabled={joinLoading}
            className="flex-1 rounded-2xl bg-black py-3 font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {joinLoading ? 'Joining...' : 'Join Community'}
          </button>
          <button
            type="button"
            onClick={() => {
              closeCommunityPreview();
              navigate(`/community/${community.handle}`);
            }}
            className="flex-1 rounded-2xl bg-gray-100 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            View Page
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex justify-center pt-6 pb-2">
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'discover'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Discover
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('market')}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors relative ${
              activeTab === 'market'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Market
            <span className="absolute -top-2 -right-1 bg-blue-100 text-blue-500 text-[10px] font-bold px-1.5 py-0 rounded-full shadow-sm">
              NEW
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'market' ? (
        <DiscoverMarketTab />
      ) : (
        <>
          <div className="mb-2 mt-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Discover</h1>
            <p className="text-gray-600 mt-1">Find communities and creators worth following</p>
          </div>

          <div className="flex justify-center mb-10">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search communities, traders, or keywords..."
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                className="w-full py-3 pl-14 pr-5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-black" />
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No communities found.</p>
              <button
                type="button"
                onClick={() => navigate('/create-community')}
                className="mt-4 px-6 py-2 bg-black text-white rounded-full"
              >
                Create community
              </button>
            </div>
          ) : (
            <>
              <CommunitySection
                title="Popular communities"
                communities={popularCommunities}
                onOpen={openCommunityPreview}
              />
              <DiscoverExportBackground />
              <CommunitySection
                title="Public communities"
                communities={publicCommunities}
                onOpen={openCommunityPreview}
              />
            </>
          )}
        </>
      )}

      {selectedCommunity && (
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
      )}

      <MobileBottomSheet
        open={!!selectedCommunity}
        onClose={closeCommunityPreview}
        title={selectedCommunity?.name ?? 'Community'}
      >
        {selectedCommunity ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {renderCommunityPreview(selectedCommunity)}
          </div>
        ) : null}
      </MobileBottomSheet>


      {activeTab === 'discover' && (
        <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      )}
    </div>
  );
};

export default Discover;

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, LayoutGrid, Landmark, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { COMMUNITIES_API, USERS_API } from '../../config/api';
import { profilePath } from '../../constants/paths';
import { communityPath } from '../../constants/communityRoutes';
import {
  FALLBACK_POPULAR_PEOPLE,
  communityAvatarUrl,
  personAvatarUrl,
} from '../../constants/searchSuggestions';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { authInputClass } from '../Auth/authFormStyles';
import { useTranslation } from '../../i18n/useTranslation';
import AnimatedSearchIcon from './AnimatedSearchIcon';

interface SearchBarProps {
  onSearch?: (query: string, category?: string) => void;
  placeholder?: string;
  /** `inline` — header dropdown; `modal` — auth-style sheet/dialog */
  variant?: 'inline' | 'modal';
  isActive?: boolean;
  onDismiss?: () => void;
}

type SearchCategory = 'all' | 'communities' | 'people';

interface PopularCommunity {
  kind: 'community';
  id: string;
  name: string;
  handle: string;
  avatar: string;
  memberCount: number;
}

interface PopularPerson {
  kind: 'person';
  id: string;
  username: string;
  fullName: string;
  avatar: string;
}

type PopularItem = PopularCommunity | PopularPerson;

interface SearchHit {
  kind: 'community' | 'person';
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
  to: string;
}

const COMMUNITY_AVATAR_CLASS = 'h-9 w-9 shrink-0 rounded-2xl object-cover';
const PERSON_AVATAR_CLASS = 'h-9 w-9 shrink-0 rounded-full object-cover';

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder,
  variant = 'inline',
  isActive = false,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('search.placeholder');
  const isModal = variant === 'modal';
  const navigate = useNavigate();
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const panelOpen = isModal ? isActive : dropdownOpen;

  const categories = useMemo(
    () => [
      { id: 'all' as const, label: t('search.all'), icon: LayoutGrid },
      { id: 'communities' as const, label: t('search.communities'), icon: Landmark },
      { id: 'people' as const, label: t('search.people'), icon: Users },
    ],
    [t]
  );

  const loadPopular = useCallback(async () => {
    setPopularLoading(true);
    try {
      const items: PopularItem[] = [];

      const commRes = await fetch(`${COMMUNITIES_API}/list`);
      if (commRes.ok) {
        const communities = (await commRes.json()) as Array<{
          _id: string;
          name: string;
          handle: string;
          avatar?: string;
          memberCount?: number;
        }>;
        communities
          .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0))
          .slice(0, 20)
          .forEach((c) => {
            items.push({
              kind: 'community',
              id: c._id,
              name: c.name,
              handle: c.handle,
              avatar: c.avatar ? resolveMediaUrl(c.avatar) : communityAvatarUrl(c.name),
              memberCount: c.memberCount ?? 0,
            });
          });
      }

      let peopleAdded = 0;
      if (token) {
        const userRes = await fetch(`${USERS_API}/list?limit=24`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const users = (await userRes.json()) as Array<{
            id: string;
            username: string;
            fullName: string;
            avatar?: string;
            followersCount?: number;
          }>;
          users
            .sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0))
            .slice(0, 20)
            .forEach((u) => {
              items.push({
                kind: 'person',
                id: u.id,
                username: u.username,
                fullName: u.fullName || u.username,
                avatar: u.avatar ? resolveMediaUrl(u.avatar) : personAvatarUrl(u.fullName || u.username),
              });
              peopleAdded += 1;
            });
        }
      }

      if (peopleAdded === 0) {
        FALLBACK_POPULAR_PEOPLE.forEach((u) => {
          items.push({
            kind: 'person',
            id: u.username,
            username: u.username,
            fullName: u.fullName,
            avatar: personAvatarUrl(u.fullName),
          });
        });
      }

      setPopularItems(items);
    } catch {
      const fallback: PopularItem[] = FALLBACK_POPULAR_PEOPLE.map((u) => ({
        kind: 'person',
        id: u.username,
        username: u.username,
        fullName: u.fullName,
        avatar: personAvatarUrl(u.fullName),
      }));
      setPopularItems(fallback);
    } finally {
      setPopularLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (panelOpen && popularItems.length === 0 && !popularLoading) {
      void loadPopular();
    }
  }, [panelOpen, popularItems.length, popularLoading, loadPopular]);

  useEffect(() => {
    if (!isModal || !isActive) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [isModal, isActive]);

  useEffect(() => {
    if (isModal && !isActive) {
      setQuery('');
      setSearchResults([]);
      setDropdownOpen(false);
    }
  }, [isModal, isActive]);

  const popularCommunities = useMemo(
    () => popularItems.filter((x): x is PopularCommunity => x.kind === 'community'),
    [popularItems]
  );
  const popularPeople = useMemo(
    () => popularItems.filter((x): x is PopularPerson => x.kind === 'person'),
    [popularItems]
  );

  const buildHitsFromPopular = useCallback(
    (searchQuery: string, category: SearchCategory): SearchHit[] => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return [];

      const commHits: SearchHit[] = popularCommunities
        .filter(
          (c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)
        )
        .map((c) => ({
          kind: 'community' as const,
          id: c.id,
          title: c.name,
          subtitle: `@${c.handle}`,
          avatar: c.avatar,
          to: communityPath(c.handle),
        }));

      const peopleHits: SearchHit[] = popularPeople
        .filter(
          (p) => p.username.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q)
        )
        .map((p) => ({
          kind: 'person' as const,
          id: p.id,
          title: p.fullName,
          subtitle: `@${p.username}`,
          avatar: p.avatar,
          to: profilePath(p.username),
        }));

      if (category === 'communities') return commHits.slice(0, 8);
      if (category === 'people') return peopleHits.slice(0, 8);
      return [...commHits, ...peopleHits].slice(0, 8);
    },
    [popularCommunities, popularPeople]
  );

  const performSearch = useCallback(
    (searchQuery: string, category: SearchCategory) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchResults(buildHitsFromPopular(searchQuery, category));
    },
    [buildHitsFromPopular]
  );

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value, activeCategory);
    if (!isModal) setDropdownOpen(true);
    performSearch(value, activeCategory);
  };

  const handleCategoryChange = (category: SearchCategory) => {
    setActiveCategory(category);
    onSearch?.(query, category);
    performSearch(query, category);
    if (!isModal) setDropdownOpen(true);
  };

  const openSearchHit = (hit: SearchHit) => {
    if (!isModal) setDropdownOpen(false);
    onDismiss?.();
    navigate(hit.to);
  };

  useEffect(() => {
    if (isModal) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModal]);

  const isQueryEmpty = !query.trim();

  const searchEmptyState = (
    <div
      className={`flex flex-col items-center justify-center px-6 py-10 text-center sm:py-14 ${
        isModal ? 'min-h-[min(80vh,400px)]' : ''
      }`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
        <Search className="h-6 w-6 text-neutral-400" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="text-base font-medium text-neutral-900">{t('search.findAnything')}</p>
      <p className="mt-1 text-sm text-neutral-500">{t('search.startTyping')}</p>
    </div>
  );

  const resultsPanel = (
    <>
      {!isQueryEmpty && (
        <div
          className={`flex gap-1 border-b border-neutral-100 bg-neutral-50/50 p-3 ${
            isModal ? 'rounded-t-2xl' : ''
          }`}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const isCatActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryChange(category.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                  isCatActive
                    ? 'bg-black text-white shadow-sm'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      )}

      <div
        className={
          isModal
            ? 'min-h-[min(80vh,500px)] max-h-[min(90vh,600px)] overflow-y-auto'
            : 'max-h-96 overflow-y-auto'
        }
      >
        {isQueryEmpty && searchEmptyState}

        {!isQueryEmpty && (
          <div className="py-2">
            <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase text-neutral-500">
              <Search className="h-3 w-3" />
              {t('search.resultsFor', { query })}
            </div>
            {popularLoading ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-400">{t('search.searching')}</p>
            ) : searchResults.length > 0 ? (
              searchResults.map((hit) => (
                <button
                  key={`${hit.kind}-${hit.id}`}
                  type="button"
                  onClick={() => openSearchHit(hit)}
                  className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <img
                    src={hit.avatar}
                    alt=""
                    className={
                      hit.kind === 'community' ? COMMUNITY_AVATAR_CLASS : PERSON_AVATAR_CLASS
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-800">
                      {hit.title}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{hit.subtitle}</span>
                  </span>
                  <span className="text-xs capitalize text-neutral-400">
                    {hit.kind === 'community' ? t('search.kindCommunity') : t('search.kindPerson')}
                  </span>
                  <ArrowRight className="h-3 w-3 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-neutral-400">
                <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">{t('search.noResultsFor', { query })}</p>
                <p className="mt-1 text-xs text-neutral-400">{t('search.tryAnother')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  const inputBlock = (
    <div className="relative" data-animate-hover>
      <span
        className={`pointer-events-none absolute top-1/2 z-[1] flex -translate-y-1/2 items-center justify-center text-neutral-400 ${
          isModal ? 'left-5' : 'left-3'
        }`}
        aria-hidden
      >
        <AnimatedSearchIcon size={16} />
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        autoComplete="off"
        value={query}
        onChange={handleChange}
        onFocus={() => {
          if (!isModal) setDropdownOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim()) {
            saveRecentSearch(query.trim());
            onSearch?.(query, activeCategory);
          }
        }}
        placeholder={resolvedPlaceholder}
        className={
          isModal
            ? `${authInputClass} pl-12 pr-5`
            : 'w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black/10'
        }
      />
    </div>
  );

  if (isModal) {
    return (
      <div className="w-full">
        {inputBlock}
        {panelOpen && (
          <div className="mt-4 min-h-[min(80vh,500px)] overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {resultsPanel}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {inputBlock}
      {panelOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {resultsPanel}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

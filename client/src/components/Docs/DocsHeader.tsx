import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Command } from 'lucide-react';
import { searchDocs, type DocsSearchHit } from '../../docs/docsSearchIndex';
import {
  DOCS_DEFAULT_PATH,
  DOCS_HEADER_NAV,
  DOCS_SUPPORT_PATH,
  isDocsHeaderNavActive,
} from '../../docs/docsNav';

function DocsHeaderNavLink({
  label,
  to,
  active,
}: {
  label: string;
  to: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`relative shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-neutral-900 text-white shadow-sm'
          : 'text-neutral-600 hover:bg-white hover:text-neutral-900'
      }`}
    >
      {label}
    </Link>
  );
}

const DocsHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSupportPage =
    location.pathname === DOCS_SUPPORT_PATH ||
    location.pathname.startsWith(`${DOCS_SUPPORT_PATH}/`);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<DocsSearchHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHits(searchDocs(query));
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isSupportPage) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSupportPage]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const goHit = useCallback(
    (hit: DocsSearchHit) => {
      navigate(hit.path);
      setQuery('');
      setSearchOpen(false);
    },
    [navigate]
  );

  const navItems = DOCS_HEADER_NAV.map((item) => ({
    ...item,
    active: isDocsHeaderNavActive(location.pathname, item.id),
  }));

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-stone-200/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 lg:gap-5 lg:px-6">
        <Link
          to={DOCS_DEFAULT_PATH}
          className="shrink-0 font-black tracking-tight text-neutral-900 transition-opacity hover:opacity-80"
        >
          MNOONX
        </Link>

        <nav
          className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200/80 bg-stone-100/50 p-1"
          aria-label="Docs and Support"
        >
          {navItems.map((item) => (
            <DocsHeaderNavLink
              key={item.id}
              label={item.label}
              to={item.to}
              active={item.active}
            />
          ))}
        </nav>

        {!isSupportPage ? (
          <div
            ref={searchRef}
            className="relative ml-auto w-full min-w-0 max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Поиск..."
              className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-16 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 sm:pr-20"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 sm:flex">
              <Command className="h-3 w-3" aria-hidden />K
            </span>
            {searchOpen && query.trim() && hits.length > 0 ? (
              <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-xl">
                {hits.map((hit) => (
                  <li key={hit.path}>
                    <button
                      type="button"
                      onClick={() => goHit(hit)}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-stone-50"
                    >
                      <span className="text-sm font-medium text-neutral-900">{hit.title}</span>
                      <span className="text-xs text-neutral-500">{hit.sectionTitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="ml-auto flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            to="/"
            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-50 sm:px-3 sm:text-sm"
          >
            На платформу
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DocsHeader;

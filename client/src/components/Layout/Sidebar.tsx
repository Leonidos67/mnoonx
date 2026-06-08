import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  House,
  Compass,
  Plus,
  LogIn,
  User,
  ChevronDown,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  Languages,
  ChevronRight,
  HeartHandshake,
  BookMarked,
  BriefcaseBusiness,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';
import { communityPath, communitySettingsPath } from '../../constants/communityRoutes';
import { profilePath } from '../../constants/paths';

import { COMMUNITIES_API as API_COMMUNITIES } from '../../config/api';
import MnoonxLogo from './MnoonxLogo';

interface MyCommunity {
  _id: string;
  name: string;
  handle: string;
  avatar?: string;
  memberCount?: number;
}

interface SidebarProps {
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();
  const [myCommunities, setMyCommunities] = useState<MyCommunity[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const profileHref = user?.username ? profilePath(user.username) : '/settings';

  const isProfileActive = !!user?.username && location.pathname === profilePath(user.username);

  const fetchMine = useCallback(async () => {
    if (!token) {
      setMyCommunities([]);
      return;
    }
    try {
      const res = await fetch(`${API_COMMUNITIES}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setMyCommunities([]);
        return;
      }
      const data = await res.json();
      setMyCommunities(Array.isArray(data) ? data : []);
    } catch {
      setMyCommunities([]);
    }
  }, [token]);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const navItems = useMemo(
    () => [
      { nameKey: 'nav.home' as const, icon: House, path: '/', end: true },
      { nameKey: 'nav.discover' as const, icon: Compass, path: '/discover', end: false },
      {
        nameKey: 'nav.profile' as const,
        icon: User,
        path: profileHref,
        isActive: isProfileActive,
        skipPathMatch: true,
      },
    ],
    [profileHref, isProfileActive, t]
  );

  const isCommunityRouteActive = (handle: string) => {
    const base = communityPath(handle);
    const settings = communitySettingsPath(handle);
    return location.pathname === base || location.pathname.startsWith(`${base}/`) || location.pathname === settings;
  };

  const handleLogoutClick = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const userMenuPanelClass =
    'absolute bottom-full left-0 right-0 p-1 z-50';
  const userMenuItemClass =
    'w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 text-neutral-800';
  const langSubmenuClass =
    'rounded-lg border border-neutral-200 bg-white p-1 shadow-lg min-w-[5.5rem]';

  return (
    <div className="flex h-full w-64 flex-col bg-neutral-50">
      <div className="flex items-center gap-1 border-b border-neutral-200 p-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-700 transition-colors hover:bg-black/5 active:scale-95"
          aria-label={t('nav.hideSidebar')}
        >
          <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
        <MnoonxLogo className="min-w-0 flex-1" size="md" />
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = item.skipPathMatch
              ? !!item.isActive
              : item.end
                ? location.pathname === item.path
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <li key={item.nameKey}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.95] ${
                    active ? 'bg-black/10' : 'hover:bg-black/5'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{t(item.nameKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{t('nav.myCommunities')}</h2>
          </div>

          <div className="space-y-1">
            {!token && (
              <p className="px-4 py-2 text-xs text-neutral-500">{t('nav.signInToSeeCommunities')}</p>
            )}
            {token && myCommunities.length === 0 && (
              <p className="px-4 py-2 text-xs text-neutral-500">{t('nav.noCommunitiesYet')}</p>
            )}
            {myCommunities.map((c) => {
              const active = isCommunityRouteActive(c.handle);
              return (
                <Link
                  key={c._id}
                  to={communityPath(c.handle)}
                  className={`group flex items-center gap-2.5 rounded-xl py-2 pl-2 pr-3 text-neutral-800 transition-colors ${
                    active ? '' : 'hover:bg-black/10'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex-shrink-0 w-2 -ml-5 rounded-full transition-all duration-200 ease-out ${
                      active
                        ? 'h-8 bg-black'
                        : 'h-1.5 bg-black/20 group-hover:h-4 group-hover:bg-black/20'
                    }`}
                  />
                  <img
                    src={
                      c.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=64&bold=true`
                    }
                    alt=""
                    className="h-8 w-8 ml-1 flex-shrink-0 rounded-lg object-cover"
                  />
                  <span className="truncate text-sm font-medium">{c.name}</span>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigate('/new')}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl hover:rounded-2xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('nav.startCommunity')}
          </button>
        </div>
      </nav>

      <div className="p-2 border-t border-neutral-200 relative" ref={userMenuRef}>
        {user ? (
          <>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className={`w-full flex items-center gap-2 px-2 py-2 border rounded-xl cursor-pointer transition-all text-left ${
                userMenuOpen ? 'bg-neutral-100 ring-1 ring-neutral-300' : 'hover:bg-neutral-100'
              }`}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#fef08a] via-[#84cc16] to-[#16a34a] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.username || 'User'}</p>
                <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {userMenuOpen && (
              <div className={userMenuPanelClass} role="menu">
                <Link
                  to={profileHref}
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className={userMenuItemClass}
                >
                  <User size={14} className="shrink-0 text-neutral-500" />
                  {t('nav.profile')}
                </Link>
                <Link
                  to="/portfolio-tracker"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className={userMenuItemClass}
                >
                  <BriefcaseBusiness size={14} className="shrink-0 text-neutral-500" />
                  {t('nav.portfolioTracker')}
                </Link>
                <Link
                  to="/settings"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className={userMenuItemClass}
                >
                  <Settings size={14} className="shrink-0 text-neutral-500" />
                  {t('nav.settings')}
                </Link>
                <Link
                  to="/plan"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className={userMenuItemClass}
                >
                  <CreditCard size={14} className="shrink-0 text-neutral-500" />
                  {t('nav.plan')}
                </Link>
                <Link
                  to="/docs/support"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className={userMenuItemClass}
                >
                  <HeartHandshake size={14} className="shrink-0 text-neutral-500" />
                  {t('nav.support')}
                </Link>
                <div className="group relative">
                  <div
                    className={`${userMenuItemClass} cursor-default justify-between gap-2`}
                    role="presentation"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <Languages size={14} className="shrink-0 text-neutral-500" />
                      <span className="truncate">{t('nav.changeLanguage')}</span>
                    </span>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                  <div
                    className="pointer-events-none invisible absolute left-full top-0 z-[60] opacity-0 transition-[opacity,visibility] duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100"
                    role="menu"
                    aria-label={t('nav.changeLanguage')}
                  >
                    <div className={langSubmenuClass}>
                      <button
                        type="button"
                        role="menuitem"
                        className={`${userMenuItemClass} justify-center font-medium tracking-wide ${
                          locale === 'en' ? 'bg-neutral-100 text-neutral-900' : ''
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLocale('en');
                        }}
                      >
                        en
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className={`${userMenuItemClass} justify-center font-medium tracking-wide ${
                          locale === 'ru' ? 'bg-neutral-100 text-neutral-900' : ''
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLocale('ru');
                        }}
                      >
                        ru
                      </button>
                    </div>
                  </div>
                </div>
                <Link
                  to="/docs"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className={userMenuItemClass}
                >
                  <BookMarked size={14} className="shrink-0 text-neutral-500" />
                  {t('nav.docs')}
                </Link>
                <div className="h-px bg-neutral-100 my-1" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogoutClick}
                  className={`${userMenuItemClass} text-red-600 hover:bg-red-50`}
                >
                  <LogOut size={14} className="shrink-0" />
                  {t('common.logOut')}
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            <span className="font-medium">{t('common.signIn')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

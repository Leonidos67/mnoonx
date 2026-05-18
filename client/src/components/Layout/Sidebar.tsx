import React, { useEffect, useState, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { communityPath, communitySettingsPath } from '../../constants/communityRoutes';
import { profilePath } from '../../constants/paths';

const API_COMMUNITIES = 'http://localhost:5000/api/communities';

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

  const navItems = [
    { name: 'Home', icon: House, path: '/', end: true },
    { name: 'Profile', icon: User, path: profileHref, isActive: isProfileActive, skipPathMatch: true },
    { name: 'Discover', icon: Compass, path: '/discover', end: false },
  ];

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

  return (
    <div className="flex h-full w-64 flex-col bg-neutral-50">
      <div className="flex items-center gap-1 border-b border-neutral-200 p-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-700 transition-colors hover:bg-black/5 active:scale-95"
          aria-label="Hide sidebar"
        >
          <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center gap-2 text-2xl font-bold text-gray-900 transition-transform active:scale-[0.99]"
        >
          <img
            src="https://img.icons8.com/?size=100&id=ck3ZwyamgGAW&format=png&color=000000"
            className="h-8 w-8 shrink-0"
            alt=""
          />
          <span className="pixelify-logo truncate">MNOONX</span>
        </Link>
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
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.95] ${
                    active ? 'bg-black/10' : 'hover:bg-black/5'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">My Communities</h2>
          </div>

          <div className="space-y-1">
            {!token && (
              <p className="px-4 py-2 text-xs text-neutral-500">Sign in to see your communities.</p>
            )}
            {token && myCommunities.length === 0 && (
              <p className="px-4 py-2 text-xs text-neutral-500">You haven&apos;t created a community yet.</p>
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
            Start a Community
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
              <div
                className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 z-50"
                role="menu"
              >
                <Link
                  to={profileHref}
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50"
                >
                  <User className="w-4 h-4 text-neutral-500" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50"
                >
                  <Settings className="w-4 h-4 text-neutral-500" />
                  Settings
                </Link>
                <Link
                  to="/plan"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50"
                >
                  <CreditCard className="w-4 h-4 text-neutral-500" />
                  Plan
                </Link>
                <div className="border-t border-neutral-100 my-1" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
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
            <span className="font-medium">Sign in</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

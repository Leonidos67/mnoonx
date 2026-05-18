import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { House, Compass, Plus, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnreads } from '../../context/UnreadsContext';
import { profilePath } from '../../constants/paths';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { messageUnread } = useUnreads();

  const profileHref = user?.username ? profilePath(user.username) : '/settings';
  const isProfileActive =
    !!user?.username && location.pathname === profilePath(user.username);

  const isHomeActive = location.pathname === '/';
  const isDiscoverActive =
    location.pathname === '/discover' || location.pathname.startsWith('/discover/');
  const isStartActive = location.pathname === '/new' || location.pathname.startsWith('/new/');
  const isMessengerActive =
    location.pathname === '/messenger' || location.pathname.startsWith('/messenger/');

  const iconLinkClass = (active: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors ${
      active ? 'text-neutral-900' : 'text-neutral-500'
    }`;

  const unreadLabel =
    messageUnread > 99 ? '99+' : messageUnread > 0 ? String(messageUnread) : null;

  return (
    <nav
      className="shrink-0 border-t border-neutral-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[60px] max-w-lg items-stretch justify-between px-2">
        <Link to="/" className={iconLinkClass(isHomeActive)} aria-current={isHomeActive ? 'page' : undefined}>
          <House className={`h-6 w-6 ${isHomeActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} aria-hidden />
        </Link>

        <Link
          to="/discover"
          className={iconLinkClass(isDiscoverActive)}
          aria-current={isDiscoverActive ? 'page' : undefined}
        >
          <Compass className={`h-6 w-6 ${isDiscoverActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} aria-hidden />
        </Link>

        <Link
          to="/new"
          className="flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-1.5"
          aria-current={isStartActive ? 'page' : undefined}
        >
          <span
            className={`inline-flex items-center gap-1 rounded-full p-2 text-sm font-semibold shadow-sm transition-transform active:scale-95 ${
              isStartActive ? 'bg-neutral-800 text-white ring-2 ring-neutral-300' : 'bg-black text-white'
            }`}
          >
            <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
            {/* Start */}
          </span>
        </Link>

        <Link
          to="/messenger"
          className={`${iconLinkClass(isMessengerActive)} relative`}
          aria-current={isMessengerActive ? 'page' : undefined}
          aria-label={unreadLabel ? `Messages, ${messageUnread} unread` : 'Messages'}
        >
          <span className="relative">
            <MessageCircle
              className={`h-6 w-6 ${isMessengerActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`}
              aria-hidden
            />
            {unreadLabel && (
              <span className="absolute -right-1.5 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#e5484d] px-0.5 text-[9px] font-bold leading-none text-white">
                {unreadLabel}
              </span>
            )}
          </span>
        </Link>

        <Link
          to={profileHref}
          className={iconLinkClass(isProfileActive)}
          aria-current={isProfileActive ? 'page' : undefined}
        >
          <User className={`h-6 w-6 ${isProfileActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} aria-hidden />
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;

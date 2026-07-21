import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircleIcon, type IconHandle } from '@animateicons/react/lucide';
import { useAuth } from '../../context/AuthContext';
import { useUnreads } from '../../context/UnreadsContext';
import { useTranslation } from '../../i18n/useTranslation';
import { profilePath } from '../../constants/paths';
import { AnimatedNavIcon } from './AnimatedNavIcon';
import AnimatedPlusIcon from '../Common/AnimatedPlusIcon';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

const MobileMessageIcon: React.FC = () => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);
  return (
    <span
      ref={nodeRef}
      className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden"
    >
      <MessageCircleIcon
        ref={iconRef}
        size={24}
        duration={1}
        color="currentColor"
        isAnimated={false}
        className="!h-6 !w-6 !min-h-0 !min-w-0"
      />
    </span>
  );
};

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
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
      aria-label={t('common.mainNav')}
    >
      <div className="mx-auto flex h-[60px] max-w-lg items-stretch justify-between px-2">
        <Link to="/" className={iconLinkClass(isHomeActive)} aria-current={isHomeActive ? 'page' : undefined}>
          <AnimatedNavIcon kind="home" size={24} />
        </Link>

        <Link
          to="/discover"
          className={iconLinkClass(isDiscoverActive)}
          aria-current={isDiscoverActive ? 'page' : undefined}
        >
          <AnimatedNavIcon kind="discover" size={24} />
        </Link>

        <Link
          to="/new"
          className="flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-1.5"
          aria-current={isStartActive ? 'page' : undefined}
        >
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow-sm transition-transform active:scale-95 ${
              isStartActive ? 'bg-neutral-800 text-white ring-2 ring-neutral-300' : 'bg-black text-white'
            }`}
          >
            <AnimatedPlusIcon variant="plus" size={20} color="#ffffff" />
          </span>
        </Link>

        <Link
          to="/messenger"
          className={`${iconLinkClass(isMessengerActive)} relative`}
          aria-current={isMessengerActive ? 'page' : undefined}
          aria-label={
            unreadLabel
              ? t('common.messagesUnread', { count: messageUnread })
              : t('common.messages')
          }
        >
          <span className="relative">
            <MobileMessageIcon />
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
          <AnimatedNavIcon kind="profile" size={24} />
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;

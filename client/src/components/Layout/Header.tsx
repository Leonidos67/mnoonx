import React, { useState } from 'react';
import { Bell, MessageCircle, LogIn, Menu, Search } from 'lucide-react';
import SearchBar from '../Common/SearchBar';
import SearchModal from '../Common/SearchModal';
import HeaderIconBadge from '../Common/HeaderIconBadge';
import MnoonxLogo from './MnoonxLogo';
import GoToDashboardMenu from './GoToDashboardMenu';
import MobileUserMenu from './MobileUserMenu';
import PlatformUpdatesPromoButton from './PlatformUpdatesPromoButton';
import { useAuth } from '../../context/AuthContext';
import { useUnreads } from '../../context/UnreadsContext';
import { useTranslation } from '../../i18n/useTranslation';

interface HeaderProps {
  onSearch?: (query: string, category?: string) => void;
  sidebarCollapsed?: boolean;
  onSidebarOpen?: () => void;
}

const headerIconButtonClass =
  'relative flex shrink-0 items-center justify-center rounded-full border p-2 text-neutral-600 transition-all hover:bg-black/10 hover:text-neutral-700 active:scale-[0.95]';

const Header: React.FC<HeaderProps> = ({ onSearch, sidebarCollapsed, onSidebarOpen }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messageUnread, notificationUnread } = useUnreads();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center justify-between bg-neutral-50 px-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <MnoonxLogo className="shrink-0 lg:hidden" size="sm" />
          {sidebarCollapsed && onSidebarOpen && (
            <button
              type="button"
              onClick={onSidebarOpen}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-700 transition-colors hover:bg-black/5 active:scale-95 lg:flex"
              aria-label={t('nav.showSidebar')}
            >
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          )}
          {sidebarCollapsed && <MnoonxLogo className="hidden shrink-0 lg:flex" size="sm" />}
          <div className="hidden min-w-0 max-w-2xl flex-1 lg:block">
            <SearchBar
              onSearch={onSearch}
              placeholder={t('search.placeholder')}
            />
          </div>
        </div>

        <div className="ml-2 flex min-w-0 shrink-0 items-center gap-1 sm:ml-4 sm:gap-2">
          <PlatformUpdatesPromoButton />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={`${headerIconButtonClass} lg:hidden`}
            aria-label={t('header.searchAria')}
          >
            <Search className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>

          {user ? (
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <span className="hidden lg:contents">
                <HeaderIconBadge
                  to="/notifications"
                  label={t('header.notifications')}
                  count={notificationUnread}
                  ariaLabelWhenUnread={t('header.notificationsUnread', { count: notificationUnread })}
                >
                  <Bell className="h-5 w-5" />
                </HeaderIconBadge>
              </span>
              <span className="hidden lg:contents">
                <HeaderIconBadge
                  to="/messenger"
                  label={t('header.messages')}
                  count={messageUnread}
                  ariaLabelWhenUnread={t('header.messagesUnread', { count: messageUnread })}
                >
                  <MessageCircle className="h-5 w-5" />
                </HeaderIconBadge>
              </span>
              <GoToDashboardMenu />
              <MobileUserMenu />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
              className="hidden items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 transition-all hover:bg-black hover:text-white active:scale-[0.95] lg:flex"
            >
              <LogIn className="h-5 w-5" />
              <span className="font-medium">{t('common.signIn')}</span>
            </button>
          )}
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSearch={onSearch} />
    </>
  );
};

export default Header;

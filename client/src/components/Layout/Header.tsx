import React, { useState } from 'react';
import {
  Bell,
  MessageCircle,
  LogIn,
  Menu,
  Search,
  BriefcaseBusiness,
  Settings,
  CreditCard,
  HeartHandshake,
  Languages,
  BookMarked,
} from 'lucide-react';
import SearchBar from '../Common/SearchBar';
import SearchModal from '../Common/SearchModal';
import HeaderIconBadge from '../Common/HeaderIconBadge';
import MnoonxLogo from './MnoonxLogo';
import GoToDashboardMenu from './GoToDashboardMenu';
import AuthModalShell from '../Auth/AuthModalShell';
import PlatformUpdatesPromoButton from './PlatformUpdatesPromoButton';
import { useAuth } from '../../context/AuthContext';
import { useUnreads } from '../../context/UnreadsContext';
import { useTranslation } from '../../i18n/useTranslation';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import HomeSidebarPromoCarousel from '../Home/HomeSidebarPromoCarousel';

const menuItemClass =
  'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-black transition-colors hover:bg-neutral-50 active:bg-neutral-100';

interface HeaderProps {
  onSearch?: (query: string, category?: string) => void;
  sidebarCollapsed?: boolean;
  onSidebarOpen?: () => void;
}

const headerIconButtonClass =
  'relative flex shrink-0 items-center justify-center rounded-full border p-2 text-neutral-600 transition-all hover:bg-black/10 hover:text-neutral-700 active:scale-[0.95]';

const Header: React.FC<HeaderProps> = ({ onSearch, sidebarCollapsed, onSidebarOpen }) => {
  const [open, setOpen] = useState(false);
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messageUnread, notificationUnread } = useUnreads();
  const [searchOpen, setSearchOpen] = useState(false);

  const close = () => setOpen(false);

  const items = [
    { to: '/notifications', icon: Bell, label: t('nav.notifications') },
    { to: '/portfolio-tracker', icon: BriefcaseBusiness, label: t('nav.portfolioTracker') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
    { to: '/plan', icon: CreditCard, label: t('nav.plan') },
    { to: '/docs/support', icon: HeartHandshake, label: t('nav.support') },
    { to: '/docs', icon: BookMarked, label: t('nav.docs') },
  ] as const;

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
              <AuthModalShell isOpen={open} onClose={close} title={t('header.menuTitle')}>
                <div className="mb-4">
                  <HomeSidebarPromoCarousel />
                </div>
                <nav className="flex flex-col gap-0.5" role="menu">
                  {items.map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      role="menuitem"
                      onClick={close}
                      className={menuItemClass}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-black" aria-hidden />
                      {label}
                    </Link>
                  ))}

                  <div className="mt-2 border-t border-neutral-100 pt-3" role="presentation">
                    <div className={`${menuItemClass} cursor-default hover:bg-transparent active:bg-transparent`}>
                      <Languages className="h-5 w-5 shrink-0 text-black" aria-hidden />
                      {t('nav.changeLanguage')}
                    </div>
                    <div className="mt-1 flex gap-2 px-4 pb-1">
                      {(['en', 'ru'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLocale(lang)}
                          className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                            locale === lang
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </nav>
              </AuthModalShell>
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
          
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center justify-center rounded-full border p-2 text-neutral-600 transition-all hover:bg-black/10 hover:text-neutral-700 active:scale-[0.95] lg:hidden"
            aria-label={t('header.menuAria')}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className='px-1'>Menu</span>
          </button>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSearch={onSearch} />
    </>
  );
};

export default Header;

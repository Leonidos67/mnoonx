import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MenuIcon,
  Settings,
  CreditCard,
  HeartHandshake,
  Languages,
  BookMarked,
  BriefcaseBusiness,
  Bell,
} from 'lucide-react';
import AuthModalShell from '../Auth/AuthModalShell';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';

const menuItemClass =
  'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-black transition-colors hover:bg-neutral-50 active:bg-neutral-100';

const MobileUserMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center justify-center rounded-full border p-2 text-neutral-600 transition-all hover:bg-black/10 hover:text-neutral-700 active:scale-[0.95] lg:hidden"
        aria-label={t('header.menuAria')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="mr-1">Menu</span>
        {/* <MenuIcon className="h-4 w-4" aria-hidden /> */}
      </button>

      <AuthModalShell isOpen={open} onClose={close} title={t('header.menuTitle')}>
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
    </>
  );
};

export default MobileUserMenu;

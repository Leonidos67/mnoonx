import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';
import { profilePath } from '../../constants/paths';

const SettingsAccountPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, locale } = useTranslation();
  const { setLocale } = useLanguage();
  const navigate = useNavigate();
  const [emailDraft, setEmailDraft] = useState(user?.email || '');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-bold">{t('settings.accountHeading')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.accountHint')}</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t('settings.accountProfileCard')}
        </h3>
        <div className="mt-4 flex items-center gap-3">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.username || 'U')}&background=000&color=fff&size=64&bold=true`
            }
            alt=""
            className="h-14 w-14 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{user?.fullName || user?.username}</p>
            <p className="truncate text-sm text-neutral-500">@{user?.username}</p>
          </div>
          {user?.username ? (
            <button
              type="button"
              onClick={() => navigate(profilePath(user.username))}
              className="ml-auto shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
            >
              {t('settings.viewProfile')}
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div>
          <p className="text-sm font-medium text-neutral-700">{t('settings.email')}</p>
          <input
            type="email"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            disabled
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-700 outline-none"
          />
          <p className="mt-1.5 text-xs text-neutral-500">{t('settings.emailLockedHint')}</p>
        </div>
        <div className="border-t border-neutral-100 pt-3">
          <p className="text-sm font-medium text-neutral-700">{t('settings.memberSince')}</p>
          <p className="mt-1 text-neutral-600">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-900">{t('settings.languageHeading')}</h3>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.languageHint')}</p>
        <div className="mt-4 flex gap-2">
          {(['en', 'ru'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                locale === code ? 'bg-black text-white' : 'border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {code === 'en' ? t('settings.langEn') : t('settings.langRu')}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 font-medium text-red-700 transition-colors hover:bg-red-100"
      >
        <LogOut className="h-4 w-4" />
        {t('common.logOut')}
      </button>
    </div>
  );
};

export default SettingsAccountPanel;

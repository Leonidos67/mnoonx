import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Check, Headphones, Rocket } from 'lucide-react';
import PlatformUptimeHero from '../components/PlatformUpdates/PlatformUptimeHero';
import { PLATFORM_RELEASES } from '../constants/platformUpdates';
import { DOCS_DEFAULT_PATH, DOCS_SUPPORT_PATH } from '../docs/docsNav';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';

function formatReleaseDate(iso: string, locale: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const PlatformUpdates: React.FC = () => {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const latest = PLATFORM_RELEASES[0];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 pb-16 sm:py-10 lg:px-8 lg:py-12">
      <PlatformUptimeHero />

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            {t('platformUpdates.changelogTitle')}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{t('platformUpdates.changelogSubtitle')}</p>
        </div>
        {latest && (
          <span className="inline-flex w-fit rounded-full border border-[#e7e7e7] bg-white px-4 py-2 text-sm font-semibold text-[#315efb] shadow-sm">
            {t('platformUpdates.latestBadge', { version: `v${latest.version}` })}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:gap-5">
        {PLATFORM_RELEASES.map((release, index) => {
          const isLatest = index === 0;
          const isLaunch = release.version === '1.0';

          return (
            <article
              key={release.version}
              className={`overflow-hidden rounded-3xl border bg-white transition-shadow ${
                isLatest
                  ? 'border-[#315efb]/30 shadow-md shadow-[#315efb]/5 ring-1 ring-[#315efb]/10'
                  : 'border-[#e7e7e7] shadow-sm hover:shadow-md'
              }`}
            >
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-8 sm:py-5 ${
                  isLatest ? 'border-[#315efb]/15 bg-[#f8faff]' : 'border-[#ececec] bg-neutral-50/80'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
                      isLatest ? 'bg-[#315efb] text-white' : 'bg-white text-neutral-800 ring-1 ring-[#e7e7e7]'
                    }`}
                  >
                    {isLaunch && <Rocket className="h-3.5 w-3.5" aria-hidden />}
                    v{release.version}
                  </span>
                  <h3 className="text-lg font-semibold text-neutral-900 sm:text-xl">
                    {t(release.titleKey)}
                  </h3>
                </div>
                <time dateTime={release.date} className="text-sm font-medium text-neutral-500">
                  {formatReleaseDate(release.date, locale)}
                </time>
              </div>

              <div className="px-5 py-5 sm:px-8 sm:py-6">
                <ul className="grid gap-3 sm:grid-cols-1">
                  {release.itemKeys.map((key) => (
                    <li
                      key={key}
                      className="flex gap-3 rounded-2xl border border-[#f0f0f0] bg-neutral-50/50 px-4 py-3 text-sm leading-relaxed text-neutral-700 sm:text-[15px]"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          isLatest ? 'bg-[#eef2ff] text-[#315efb]' : 'bg-white text-neutral-400 ring-1 ring-[#e7e7e7]'
                        }`}
                        aria-hidden
                      >
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>

                {release.version === '1.6' && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-[#ececec] pt-5">
                    <Link
                      to={DOCS_DEFAULT_PATH}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#315efb] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4]"
                    >
                      <BookOpen className="h-4 w-4" aria-hidden />
                      {t('platformUpdates.links.docs')}
                    </Link>
                    <Link
                      to={DOCS_SUPPORT_PATH}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#e7e7e7] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#cfcfcf] hover:bg-neutral-50"
                    >
                      <Headphones className="h-4 w-4 text-[#315efb]" aria-hidden />
                      {t('platformUpdates.links.support')}
                    </Link>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-neutral-500">{t('platformUpdates.footer')}</p>
    </div>
  );
};

export default PlatformUpdates;

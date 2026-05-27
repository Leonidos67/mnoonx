import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, Headphones, Rocket } from 'lucide-react';
import type { PlatformRelease } from '../../constants/platformUpdates';
import {
  PLATFORM_RELEASES,
  formatPlatformVersionLabel,
} from '../../constants/platformUpdates';
import { DOCS_DEFAULT_PATH, DOCS_SUPPORT_PATH } from '../../docs/docsNav';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';

function formatReleaseDate(iso: string, locale: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface PlatformReleaseAccordionProps {
  releases?: PlatformRelease[];
}

const PlatformReleaseAccordion: React.FC<PlatformReleaseAccordionProps> = ({
  releases = PLATFORM_RELEASES,
}) => {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [openVersion, setOpenVersion] = useState<string | null>(releases[0]?.version ?? null);

  const toggle = (version: string) => {
    setOpenVersion((prev) => (prev === version ? null : version));
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-[#e7e7e7] bg-white shadow-sm">
      {releases.map((release, index) => {
        const isOpen = openVersion === release.version;
        const isLatest = index === 0;
        const isLaunch = release.version === '1.0.0';
        const versionLabel = formatPlatformVersionLabel(release.version);
        const panelId = `release-panel-${release.version}`;
        const headerId = `release-header-${release.version}`;

        return (
          <div
            key={release.version}
            className={index > 0 ? 'border-t border-[#ececec]' : undefined}
          >
            <button
              type="button"
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(release.version)}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors sm:gap-4 sm:px-6 sm:py-5 ${
                isOpen ? 'bg-neutral-50' : 'hover:bg-neutral-50/80'
              } ${isLatest && isOpen ? 'bg-[#f8faff]' : ''}`}
            >
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums sm:text-sm ${
                  isLatest
                    ? 'bg-[#315efb] text-white'
                    : 'bg-neutral-100 text-neutral-800 ring-1 ring-[#e7e7e7]'
                }`}
              >
                {isLaunch && <Rocket className="h-3 w-3" aria-hidden />}
                v{release.version}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-snug text-neutral-900 sm:text-base">
                  {t(release.titleKey)}
                </span>
                <time
                  dateTime={release.date}
                  className="mt-0.5 block text-xs text-neutral-500 sm:text-sm"
                >
                  {formatReleaseDate(release.date, locale)}
                </time>
              </span>

              <ChevronDown
                className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`border-t px-4 pb-5 pt-4 sm:px-6 sm:pb-6 ${
                    isLatest ? 'border-[#315efb]/15 bg-[#f8faff]/50' : 'border-[#ececec] bg-white'
                  }`}
                >
                  <ul className="space-y-3">
                    {release.itemKeys.map((key) => (
                      <li
                        key={key}
                        className="text-sm leading-relaxed text-neutral-700 sm:text-[15px]"
                      >
                        <span className="mr-2 text-[#315efb]" aria-hidden>
                          —
                        </span>
                        {t(key)}
                      </li>
                    ))}
                  </ul>

                  {release.version === '1.2.0' && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        to={DOCS_DEFAULT_PATH}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#e7e7e7] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#cfcfcf] hover:bg-neutral-50"
                      >
                        <BookOpen className="h-4 w-4 text-[#315efb]" aria-hidden />
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlatformReleaseAccordion;

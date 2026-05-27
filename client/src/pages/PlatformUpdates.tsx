import React from 'react';
import PlatformUptimeHero from '../components/PlatformUpdates/PlatformUptimeHero';
import PlatformReleaseAccordion from '../components/PlatformUpdates/PlatformReleaseAccordion';
import { PLATFORM_RELEASES, getLatestPlatformVersion } from '../constants/platformUpdates';
import { useTranslation } from '../i18n/useTranslation';

const PlatformUpdates: React.FC = () => {
  const { t } = useTranslation();
  const latestVersion = getLatestPlatformVersion();

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
        <span className="inline-flex w-fit rounded-full border border-[#e7e7e7] bg-white px-4 py-2 text-sm font-semibold text-[#315efb] shadow-sm">
          {t('platformUpdates.latestBadge', { version: `v${latestVersion}` })}
        </span>
      </div>

      <div className="mt-6">
        <PlatformReleaseAccordion releases={PLATFORM_RELEASES} />
      </div>

      <p className="mt-10 text-center text-sm text-neutral-500">{t('platformUpdates.footer')}</p>
    </div>
  );
};

export default PlatformUpdates;

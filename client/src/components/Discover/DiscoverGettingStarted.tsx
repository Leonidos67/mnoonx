import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Users2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

/** Compact dual CTA — same language as `/new`, lighter than hero cards. */
const DiscoverGettingStarted: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-3">
      <Link
        to="/new/business"
        className="group flex items-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-3.5 transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm active:scale-[0.99] sm:gap-4 sm:rounded-3xl sm:p-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3f3f3] text-black sm:h-12 sm:w-12 sm:rounded-2xl">
          <Briefcase className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-black sm:text-base">
            {t('discover.startCommunityTitle')}
          </p>
          <p className="mt-0.5 text-xs text-[#666] sm:text-sm">{t('discover.startCommunityBody')}</p>
        </div>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-[#ccc] transition-colors group-hover:text-black"
          aria-hidden
        />
      </Link>

      <Link
        to="/create-collaboration"
        className="group flex items-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-3.5 transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm active:scale-[0.99] sm:gap-4 sm:rounded-3xl sm:p-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#315efb] sm:h-12 sm:w-12 sm:rounded-2xl">
          <Users2 className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-black sm:text-base">
            {t('discover.startCollabTitle')}
          </p>
          <p className="mt-0.5 text-xs text-[#666] sm:text-sm">{t('discover.startCollabBody')}</p>
        </div>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-[#ccc] transition-colors group-hover:text-black"
          aria-hidden
        />
      </Link>
    </div>
  );
};

export default DiscoverGettingStarted;

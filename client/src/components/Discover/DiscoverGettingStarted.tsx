import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Users2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

/** Compact CTAs — same language as `/new`. */
const DiscoverGettingStarted: React.FC = () => {
  const { t } = useTranslation();

  const items = [
    {
      to: '/new/business',
      icon: Briefcase,
      wrap: 'bg-[#f3f3f3] text-black',
      title: t('discover.startCommunityTitle'),
      body: t('discover.startCommunityBody'),
    },
    {
      to: '/create-collaboration',
      icon: Users2,
      wrap: 'bg-[#eef2ff] text-[#315efb]',
      title: t('discover.startCollabTitle'),
      body: t('discover.startCollabBody'),
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-3.5 transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm active:scale-[0.99] sm:gap-4 sm:rounded-3xl sm:p-4"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${item.wrap}`}
            >
              <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-black sm:text-base">
                {item.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-[#666] sm:text-sm">{item.body}</p>
            </div>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-[#ccc] transition-colors group-hover:text-black"
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
};

export default DiscoverGettingStarted;

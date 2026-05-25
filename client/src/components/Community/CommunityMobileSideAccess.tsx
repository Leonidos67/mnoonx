import React, { useMemo, useState } from 'react';
import { PanelLeft, Users } from 'lucide-react';
import CommunitySideDrawer from './CommunitySideDrawer';
import CommunityLeftSidebar, { type CommunityLeftSidebarProps } from './CommunityLeftSidebar';
import CommunityRightSidebar, { type CommunityRightSidebarProps } from './CommunityRightSidebar';
import { useTranslation } from '../../i18n/useTranslation';

interface CommunityMobileSideAccessProps {
  unreadByInstance: Record<string, number>;
  leftSidebar: Omit<CommunityLeftSidebarProps, 'onNavigate' | 'className'>;
  rightSidebar: Omit<CommunityRightSidebarProps, 'onNavigate' | 'className'>;
  bannerTrailing?: React.ReactNode;
}

const bannerBtn =
  'flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition-colors hover:bg-white disabled:opacity-60';

const CommunityMobileSideAccess: React.FC<CommunityMobileSideAccessProps> = ({
  unreadByInstance,
  leftSidebar,
  rightSidebar,
  bannerTrailing,
}) => {
  const { t } = useTranslation();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const totalUnread = useMemo(
    () => Object.values(unreadByInstance).reduce((sum, n) => sum + (typeof n === 'number' && n > 0 ? n : 0), 0),
    [unreadByInstance]
  );

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-3 pt-3 lg:hidden">
        <button
          type="button"
          onClick={() => setLeftOpen(true)}
          className={`${bannerBtn} pointer-events-auto relative`}
          aria-label={t('community.mobileOpenNavAria')}
          aria-haspopup="dialog"
        >
          <PanelLeft size={20} aria-hidden />
          {totalUnread > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#e5484d] px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white tabular-nums">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
        <div className="pointer-events-auto flex items-center gap-2">
          {bannerTrailing}
          <button
            type="button"
            onClick={() => setRightOpen(true)}
            className={bannerBtn}
            aria-label={t('community.mobileOpenPeopleAria')}
            aria-haspopup="dialog"
          >
            <Users size={20} aria-hidden />
          </button>
        </div>
      </div>

      <CommunitySideDrawer
        side="left"
        open={leftOpen}
        onClose={() => setLeftOpen(false)}
        title={t('community.mobileNavSheetTitle')}
      >
        <CommunityLeftSidebar {...leftSidebar} onNavigate={() => setLeftOpen(false)} className="h-full" />
      </CommunitySideDrawer>

      <CommunitySideDrawer
        side="right"
        open={rightOpen}
        onClose={() => setRightOpen(false)}
        title={t('community.peopleHeading')}
      >
        <CommunityRightSidebar {...rightSidebar} onNavigate={() => setRightOpen(false)} />
      </CommunitySideDrawer>
    </>
  );
};

export default CommunityMobileSideAccess;

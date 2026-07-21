import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { communityDashboardPath, communitySettingsPath } from '../../constants/communityRoutes';
import { useTranslation } from '../../i18n/useTranslation';
import { AnimatedCommunitySidebarIcon } from './CommunitySidebarAnimatedIcons';

export interface CommunityRightSidebarOwner {
  username: string;
  fullName?: string;
  avatar?: string;
}

export interface CommunityRightSidebarProps {
  handle: string;
  memberCount: number;
  owner: CommunityRightSidebarOwner;
  canOpenDashboard: boolean;
  isOwner: boolean;
  formatCount: (n: number) => string;
  onCopyLink: () => boolean | void | Promise<boolean | void>;
  onNavigate?: () => void;
  className?: string;
}

const SUCCESS_ICON_MS = 3000;

const CommunityRightSidebar: React.FC<CommunityRightSidebarProps> = ({
  handle,
  memberCount,
  owner,
  canOpenDashboard,
  isOwner,
  formatCount,
  onCopyLink,
  onNavigate,
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [copySuccess, setCopySuccess] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const go = (fn: () => void) => {
    fn();
    onNavigate?.();
  };

  const handleCopy = async () => {
    const result = await onCopyLink();
    if (result === false) return;
    setCopySuccess(true);
    if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => {
      setCopySuccess(false);
      copyTimerRef.current = null;
    }, SUCCESS_ICON_MS);
  };

  return (
    <div className={`space-y-4 p-3 ${className}`}>
      <div className="rounded-[24px] border border-[#e7e7e7] bg-white p-2">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[#f5f5f5] font-medium transition-all hover:bg-[#ececec]"
          >
            <AnimatedCommunitySidebarIcon
              kind={copySuccess ? 'check' : 'copy'}
              size={16}
              autoPlay={copySuccess}
            />
            {t('common.copyLink')}
          </button>
          {canOpenDashboard && (
            <button
              type="button"
              onClick={() => go(() => navigate(communityDashboardPath(handle)))}
              className="flex w-full items-center gap-3 px-2 text-[16px] text-[#444] transition-all hover:text-black"
            >
              <AnimatedCommunitySidebarIcon kind="panel" size={18} />
              {t('dashboard.title')}
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => go(() => navigate(communitySettingsPath(handle)))}
              className="flex w-full items-center gap-3 px-2 pb-2 text-[16px] text-[#444] transition-all hover:text-black"
            >
              <AnimatedCommunitySidebarIcon kind="bolt" size={18} />
              {t('nav.settings')}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
        <div className="flex items-center justify-between border-b border-[#ececec] p-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md pl-2 font-semibold">{t('community.peopleHeading')}</h3>
            <span className="text-[#888]">{formatCount(memberCount)}</span>
          </div>
        </div>

        <div className="p-2">
          <p className="mb-2 px-2 text-sm uppercase tracking-[0.08em] text-[#999]">{t('community.peopleCreator')}</p>
          <div className="flex items-center justify-between">
            <Link
              to={`/@${owner.username}`}
              onClick={() => onNavigate?.()}
              className="flex flex-1 items-center gap-3"
            >
              <img
                src={
                  owner.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.fullName || owner.username)}&background=5d6472&color=fff&size=48&bold=true`
                }
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{owner.fullName || owner.username}</p>
                <p className="text-sm text-[#777]">@{owner.username}</p>
              </div>
            </Link>
            <div className="flex h-8 items-center rounded-full bg-[#f5f5f5] px-3 text-sm font-medium">
              {t('community.ownerBadgeLower')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityRightSidebar;

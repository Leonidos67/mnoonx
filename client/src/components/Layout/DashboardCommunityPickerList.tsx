import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { MyCommunity } from '../../hooks/useMyCommunities';
import { communityDashboardPath } from '../../constants/communityRoutes';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { useTranslation } from '../../i18n/useTranslation';

interface DashboardCommunityPickerListProps {
  communities: MyCommunity[];
  loading: boolean;
  onSelect?: () => void;
  className?: string;
}

const DashboardCommunityPickerList: React.FC<DashboardCommunityPickerListProps> = ({
  communities,
  loading,
  onSelect,
  className = '',
}) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <p className={`px-3 py-6 text-center text-sm text-neutral-500 ${className}`}>{t('goToDashboard.loading')}</p>
    );
  }

  if (communities.filter((c) => c.kind !== 'collaboration').length === 0) {
    return (
      <div className={`px-3 py-4 text-center ${className}`}>
        <p className="text-sm text-neutral-600">{t('nav.noCommunitiesYet')}</p>
        <Link
          to="/new"
          onClick={onSelect}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('nav.startCommunity')}
        </Link>
      </div>
    );
  }

  return (
    <ul className={`max-h-[min(50vh,320px)] overflow-y-auto py-1 ${className}`} role="menu">
      {communities
        .filter((c) => c.kind !== 'collaboration')
        .map((c) => (
        <li key={c._id} role="none">
          <Link
            to={communityDashboardPath(c.handle)}
            onClick={onSelect}
            role="menuitem"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          >
            <img
              src={
                c.avatar
                  ? resolveMediaUrl(c.avatar)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=64&bold=true&background=111827&color=fff`
              }
              alt=""
              className="h-9 w-9 shrink-0 rounded-2xl object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-neutral-900">{c.name}</span>
              <span className="block truncate text-xs text-neutral-500">@{c.handle}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default DashboardCommunityPickerList;

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export type DiscoverPageTab = 'discover' | 'market';

interface DiscoverTabSwitcherProps {
  activeTab: DiscoverPageTab;
  onChange: (tab: DiscoverPageTab) => void;
}

const activeTabClass =
  'rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900 shadow-sm sm:px-6';
const inactiveTabClass =
  'rounded-full px-5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 sm:px-6';

const DiscoverTabSwitcher: React.FC<DiscoverTabSwitcherProps> = ({ activeTab, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center pb-2 pt-4 sm:pt-6">
      <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onChange('discover')}
          className={activeTab === 'discover' ? activeTabClass : inactiveTabClass}
        >
          {t('discover.title')}
        </button>
        <button
          type="button"
          onClick={() => onChange('market')}
          className={`relative ${activeTab === 'market' ? activeTabClass : inactiveTabClass}`}
        >
          {t('discover.market')}
          <span className="absolute -right-1 -top-2 rounded-full bg-blue-100 px-1.5 py-0 text-[10px] font-bold text-blue-500 shadow-sm">
            {t('discover.marketNew')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DiscoverTabSwitcher;

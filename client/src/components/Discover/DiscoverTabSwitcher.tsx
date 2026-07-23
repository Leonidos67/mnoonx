import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

export type DiscoverPageTab = 'discover' | 'courses';

interface DiscoverTabSwitcherProps {
  activeTab: DiscoverPageTab;
  onChange: (tab: DiscoverPageTab) => void;
}

const activeTabClass =
  'rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm sm:px-6';
const inactiveTabClass =
  'rounded-full px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 sm:px-6';

const DiscoverTabSwitcher: React.FC<DiscoverTabSwitcherProps> = ({ activeTab, onChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center pb-2 pt-4 sm:pt-6">
      <div className="inline-flex max-w-full flex-wrap justify-center rounded-full border border-gray-200 bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onChange('discover')}
          className={activeTab === 'discover' ? activeTabClass : inactiveTabClass}
        >
          {t('discover.title')}
        </button>
        <button
          type="button"
          onClick={() => onChange('courses')}
          className={`relative ${activeTab === 'courses' ? activeTabClass : inactiveTabClass}`}
        >
          {t('discover.courses')}
          <span className="absolute -right-1 -top-2 rounded-full bg-blue-100 px-1.5 py-0 text-[10px] font-bold text-blue-500 shadow-sm">
            {t('discover.coursesNew')}
          </span>
        </button>
        <button type="button" onClick={() => navigate('/new')} className={inactiveTabClass}>
          {t('discover.launch')}
        </button>
      </div>
    </div>
  );
};

export default DiscoverTabSwitcher;

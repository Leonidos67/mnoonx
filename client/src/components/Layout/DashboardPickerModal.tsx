import React, { useEffect } from 'react';
import AuthModalShell from '../Auth/AuthModalShell';
import DashboardCommunityPickerList from './DashboardCommunityPickerList';
import { useMyCommunities } from '../../hooks/useMyCommunities';
import { useTranslation } from '../../i18n/useTranslation';

interface DashboardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardPickerModal: React.FC<DashboardPickerModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { communities, loading, reload } = useMyCommunities(isOpen);

  useEffect(() => {
    if (isOpen) void reload();
  }, [isOpen, reload]);

  return (
    <AuthModalShell isOpen={isOpen} onClose={onClose} title={t('goToDashboard.modalShellTitle')}>
      <h2
        id="auth-modal-title"
        className="mb-4 text-center text-2xl font-bold text-neutral-900 sm:mb-5 sm:text-3xl"
      >
        {t('goToDashboard.modalHeading')}
      </h2>
      <p className="mb-4 text-center text-sm text-neutral-500">{t('goToDashboard.chooseCommunity')}</p>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <DashboardCommunityPickerList
          communities={communities}
          loading={loading}
          onSelect={onClose}
        />
      </div>
    </AuthModalShell>
  );
};

export default DashboardPickerModal;

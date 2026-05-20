import React, { useEffect } from 'react';
import AuthModalShell from '../Auth/AuthModalShell';
import DashboardCommunityPickerList from './DashboardCommunityPickerList';
import { useMyCommunities } from '../../hooks/useMyCommunities';

interface DashboardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardPickerModal: React.FC<DashboardPickerModalProps> = ({ isOpen, onClose }) => {
  const { communities, loading, reload } = useMyCommunities(isOpen);

  useEffect(() => {
    if (isOpen) void reload();
  }, [isOpen, reload]);

  return (
    <AuthModalShell isOpen={isOpen} onClose={onClose} title="Community dashboards">
      <h2
        id="auth-modal-title"
        className="mb-4 text-center text-2xl font-bold text-neutral-900 sm:mb-5 sm:text-3xl"
      >
        Go to Dashboard
      </h2>
      <p className="mb-4 text-center text-sm text-neutral-500">Choose a community to manage</p>
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

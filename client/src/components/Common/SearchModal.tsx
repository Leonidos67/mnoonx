import React from 'react';
import AuthModalShell from '../Auth/AuthModalShell';
import SearchBar from './SearchBar';
import { useTranslation } from '../../i18n/useTranslation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string, category?: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSearch }) => {
  const { t } = useTranslation();
  return (
    <AuthModalShell isOpen={isOpen} onClose={onClose} title={t('common.search')}>
      <h2
        id="auth-modal-title"
        className="mb-5 text-center text-2xl font-bold text-neutral-900 sm:mb-6 sm:text-3xl"
      >
        {t('common.search')}
      </h2>
      <SearchBar
        variant="modal"
        isActive={isOpen}
        onDismiss={onClose}
        onSearch={onSearch}
        placeholder={t('search.placeholder')}
      />
    </AuthModalShell>
  );
};

export default SearchModal;

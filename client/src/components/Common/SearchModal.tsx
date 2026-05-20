import React from 'react';
import AuthModalShell from '../Auth/AuthModalShell';
import SearchBar from './SearchBar';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string, category?: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSearch }) => (
  <AuthModalShell isOpen={isOpen} onClose={onClose} title="Search">
    <h2
      id="auth-modal-title"
      className="mb-5 text-center text-2xl font-bold text-neutral-900 sm:mb-6 sm:text-3xl"
    >
      Search
    </h2>
    <SearchBar
      variant="modal"
      isActive={isOpen}
      onDismiss={onClose}
      onSearch={onSearch}
      placeholder="Search communities or people..."
    />
  </AuthModalShell>
);

export default SearchModal;

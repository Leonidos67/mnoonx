import React from 'react';
import { Search, X } from 'lucide-react';

interface DiscoverTabHeaderProps {
  title: string;
  tagline: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  clearSearchAriaLabel?: string;
  onClearSearch?: () => void;
  searchHint?: React.ReactNode;
  searchDropdown?: React.ReactNode;
}

const DiscoverTabHeader: React.FC<DiscoverTabHeaderProps> = ({
  title,
  tagline,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  clearSearchAriaLabel,
  onClearSearch,
  searchHint,
  searchDropdown,
}) => {
  const handleClear = () => {
    onSearchChange('');
    onClearSearch?.();
  };

  return (
    <>
      <div className="mb-2 mt-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-gray-600">{tagline}</p>
      </div>

      <div className="mb-10 flex flex-col items-center">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel ?? searchPlaceholder}
            className={`w-full rounded-2xl border border-gray-200 bg-white py-3 pl-14 focus:border-blue-500 focus:outline-none ${
              searchValue ? 'pr-12' : 'pr-5'
            }`}
          />
          {searchValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
              aria-label={clearSearchAriaLabel}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
          {searchDropdown}
        </div>
        {searchHint}
      </div>
    </>
  );
};

export default DiscoverTabHeader;

import React from 'react';

interface FilterButtonProps {
  onClick: () => void;
  activeFiltersCount?: number;
}

const FilterButton: React.FC<FilterButtonProps> = ({ onClick, activeFiltersCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-lg border flex items-center ${
        activeFiltersCount > 0 
          ? 'bg-primary-100 border-primary-300 text-primary-700' 
          : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
      }`}
    >
      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      Фильтры
      {activeFiltersCount > 0 && (
        <span className="ml-1 bg-primary-600 text-white text-xs font-medium rounded-full h-4 w-4 flex items-center justify-center">
          {activeFiltersCount}
        </span>
      )}
    </button>
  );
};

export default FilterButton;
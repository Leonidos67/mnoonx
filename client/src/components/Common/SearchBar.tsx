// components/Common/SearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, TrendingUp, X, Building, Users, LayoutGrid, Sparkles, ArrowRight, Trash2 } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (query: string, category?: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search..." 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'businesses' | 'people'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Array<{ label: string; type: string; icon: any }>>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Categories
  const categories = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'businesses', label: 'Businesses', icon: Building },
    { id: 'people', label: 'People', icon: Users },
  ] as const;

  // Recommended searches
  const recommendedSearches = [
    { label: 'Trending communities', badge: 'Popular' },
    { label: 'Tech startups 2024', badge: 'Recommended' },
    { label: 'AI tools directory', badge: 'New' },
    { label: 'Marketing agencies', badge: 'Trending' },
    { label: 'Remote jobs', badge: 'Recommended' },
  ];

  // Mock search results based on query and category
  const performSearch = (searchQuery: string, category: typeof activeCategory) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const mockResults = {
      all: [
        { label: `${searchQuery} - Community 1`, type: 'community', icon: LayoutGrid },
        { label: `${searchQuery} - Business 1`, type: 'business', icon: Building },
        { label: `${searchQuery} - User 1`, type: 'person', icon: Users },
        { label: `${searchQuery} - Community 2`, type: 'community', icon: LayoutGrid },
        { label: `${searchQuery} - Business 2`, type: 'business', icon: Building },
      ],
      businesses: [
        { label: `${searchQuery} - Tech Corp`, type: 'business', icon: Building },
        { label: `${searchQuery} - Startup Inc`, type: 'business', icon: Building },
        { label: `${searchQuery} - Digital Agency`, type: 'business', icon: Building },
        { label: `${searchQuery} - E-commerce Store`, type: 'business', icon: Building },
        { label: `${searchQuery} - Consulting Firm`, type: 'business', icon: Building },
      ],
      people: [
        { label: `${searchQuery} - John Doe`, type: 'person', icon: Users },
        { label: `${searchQuery} - Jane Smith`, type: 'person', icon: Users },
        { label: `${searchQuery} - Mike Johnson`, type: 'person', icon: Users },
        { label: `${searchQuery} - Sarah Williams`, type: 'person', icon: Users },
        { label: `${searchQuery} - Alex Brown`, type: 'person', icon: Users },
      ],
    };

    setSearchResults(mockResults[category].slice(0, 5));
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to history
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Remove individual recent search
  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    const updated = recentSearches.filter(term => term !== termToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Clear all recent searches
  const clearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value, activeCategory);
    setIsOpen(true);
  };

  const handleSearch = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    onSearch?.(term, activeCategory);
    setIsOpen(false);
  };

  const handleCategoryChange = (category: typeof activeCategory) => {
    setActiveCategory(category);
    onSearch?.(query, category);
    setIsOpen(true);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch?.('', activeCategory);
    setIsOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isQueryEmpty = !query.trim();

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-transparent bg-white"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
          </button>
        )}
      </div>

      {/* Dropdown with suggestions */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Show category buttons only when there's search query */}
          {!isQueryEmpty && (
            <div className="flex gap-1 p-3 border-b border-neutral-100 bg-neutral-50/50">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`
                      flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-black text-white shadow-sm' 
                        : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {/* Case 1: Empty query - Show Recent Searches and Recommended */}
            {isQueryEmpty && (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Recent Searches
                      </div>
                      <button
                        onClick={clearAllRecentSearches}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear all
                      </button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="group w-full px-4 py-2 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
                      >
                        <button
                          onClick={() => handleSearch(search)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Clock className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700 flex-1">{search}</span>
                          <ArrowRight className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button
                          onClick={(e) => removeRecentSearch(search, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-200 rounded-full"
                          aria-label="Remove recent search"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-neutral-400 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommended for You */}
                <div className="py-2">
                  {recentSearches.length > 0 && <div className="border-t border-neutral-100"></div>}
                  <div className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Recommended for You
                  </div>
                  {recommendedSearches.map((rec, index) => {
                    return (
                      <button
                        key={index}
                        onClick={() => handleSearch(rec.label)}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-neutral-50 transition-colors text-left group"
                      >
                        <span className="text-sm text-neutral-700 flex-1">{rec.label}</span>
                        {rec.badge && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            rec.badge === 'Popular' ? 'bg-blue-100 text-blue-700' :
                            rec.badge === 'Trending' ? 'bg-orange-100 text-orange-700' :
                            rec.badge === 'Recommended' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {rec.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Case 2: Has query - Show search results */}
            {!isQueryEmpty && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase flex items-center gap-2">
                  <Search className="h-3 w-3" />
                  Search Results for "{query}"
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSearch(result.label)}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-neutral-50 transition-colors text-left group"
                      >
                        <Icon className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-700 flex-1">{result.label}</span>
                        <span className="text-xs text-neutral-400 capitalize">{result.type}</span>
                        <ArrowRight className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-neutral-400">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found for "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with search hint - only show when there's content */}
          {(isQueryEmpty ? (recentSearches.length > 0 || recommendedSearches.length > 0) : searchResults.length > 0) && (
            <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50/50 text-xs text-neutral-500 flex items-center justify-between">
              <span>Press ⏎ to search</span>
              <span className="flex items-center gap-1">
                <span className="text-neutral-400">↑↓</span> to navigate
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
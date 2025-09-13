import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';
import { USTP_LOCATIONS } from '../constants/locations';

interface SearchableLocationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableLocationDropdown: React.FC<SearchableLocationDropdownProps> = ({
  value,
  onChange,
  placeholder = "All locations"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(USTP_LOCATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter locations based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredLocations(USTP_LOCATIONS);
    } else {
      const filtered = USTP_LOCATIONS.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLocationSelect = (location: string) => {
    onChange(location);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  const displayValue = value || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border appearance-none px-3 py-2 w-full rounded-md text-sm text-left flex items-center justify-between bg-white"
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {displayValue}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX size={16} />
            </button>
          )}
          <FiChevronDown 
            className={`text-black pointer-events-none transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60">
          {/* Search input */}
          <div className="border-b border-gray-200 px-3 py-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-sm text-gray-700 border-none outline-none placeholder-gray-500"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {/* All locations option */}
            <button
              type="button"
              onClick={() => handleLocationSelect('')}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                value === '' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              All locations
            </button>

            {/* Location options */}
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => handleLocationSelect(location)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    value === location ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {location}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableLocationDropdown;

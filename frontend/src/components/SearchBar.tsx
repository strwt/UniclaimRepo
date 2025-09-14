import Filters from "./Filters";
import { useState, useEffect, useCallback } from "react";
import { IoFilter } from "react-icons/io5";

interface SearchBarProps {
  onSearch: (query: string, filters: any) => void;
  onClear: () => void;
  query: string;
  setQuery: (val: string) => void;
  // ✅ New props for instant category filtering
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (val: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  query,
  setQuery,
  // ✅ New props for instant category filtering
  selectedCategoryFilter,
  setSelectedCategoryFilter,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // Debounced search function for real-time description filtering
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string, filters: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onSearch(query, filters);
        }, 300); // 300ms delay
      };
    })(),
    [onSearch]
  );

  const handleSearch = () => {
    onSearch(query, { selectedCategory, description, location });
  };

  const handleClear = () => {
    setQuery("");
    setSelectedCategory("All");
    setDescription("");
    setLocation("");
    setSelectedCategoryFilter("All"); // ✅ Clear instant filter too
    onClear();
  };

  const isClearVisible =
    query.trim() !== "" ||
    selectedCategory.toLowerCase() !== "all" ||
    description.trim() !== "" ||
    location.trim() !== "";

  useEffect(() => {
    if (query.trim() === "") {
      onClear();
    }
  }, [query]);

  // Real-time description filtering - triggers on every keystroke with debouncing
  useEffect(() => {
    if (description.trim() !== "" || selectedCategory !== "All" || location !== "") {
      debouncedSearch(query, { selectedCategory, description, location });
    } else if (description.trim() === "" && selectedCategory === "All" && location === "") {
      // If all filters are cleared, clear the results
      onClear();
    }
  }, [description, selectedCategory, location, query, debouncedSearch, onClear]);

  return (
    <div className="w-full mb-6">
      <div className="flex gap-3 md:flex md:justify-center md:items-center lg:justify-start lg:items-center">
        <input
          type="text"
          placeholder="Search an item"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="w-full md:max-w-sm border px-3 py-2 rounded placeholder:text-sm"
        />
        <button
          onClick={handleSearch}
          className="px-3 py-2 bg-brand hover:bg-yellow-600 text-white rounded lg:block transition-colors duration-200"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center rounded gap-2 px-3 py-2 bg-navyblue hover:bg-blue-950 text-white transition-colors duration-300"
        >
          <IoFilter
            className={`size-6 transform transition-transform duration-300 ease-in-out ${
              showFilters ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        {isClearVisible && (
          <button
            className="text-base bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
        {/* ✅ Uses handleClear */}
      </div>

      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showFilters
            ? "max-h-[370px] lg:max-h-[180px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <Filters
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          description={description}
          setDescription={setDescription}
          location={location}
          setLocation={setLocation}
          onSearchSubmit={handleSearch}
          // ✅ Pass instant category filtering props
          selectedCategoryFilter={selectedCategoryFilter}
          setSelectedCategoryFilter={setSelectedCategoryFilter}
        />
      </div>
    </div>
  );
};

export default SearchBar;

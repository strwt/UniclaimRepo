import Filters from "./Filters";
import { useState, useEffect } from "react";
import { IoFilter } from "react-icons/io5";

interface SearchBarProps {
  onSearch: (query: string, filters: any) => void;
  onClear: () => void;
  query: string;
  setQuery: (val: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  query,
  setQuery,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    onSearch(query, { selectedCategory, description, location });
  };

  const handleClear = () => {
    setQuery("");
    setSelectedCategory("all");
    setDescription("");
    setLocation("");
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
        />
      </div>
    </div>
  );
};

export default SearchBar;

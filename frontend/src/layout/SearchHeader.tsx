import { HiFilter, HiOutlineFilter } from "react-icons/hi";

export default function SearchHeader({
  searchInput,
  setSearchInput,
  toggleFilter,
  showFilter,
}: {
  searchInput: string;
  setSearchInput: (term: string) => void;
  toggleFilter: () => void;
  showFilter: boolean;
}) {
  return (
    <div>
      {/* search-input-and-button */}
      <input
        type="text"
        placeholder="Search an item"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="flex-1 w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-blue-700">
        Search
      </button>
      <button
        onClick={toggleFilter}
        className="px-4 py-2 bg-brand text-black rounded hover:bg-teal-500"
      >
        {showFilter ? (
          <HiFilter className="size-6 stroke-[1.5px]" />
        ) : (
          <HiOutlineFilter className="size-6 stroke-[1.5px]" />
        )}
      </button>
    </div>
  );
}

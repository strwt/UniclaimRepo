import React from "react";
import CategoryButton from "../components/ItemCategory";
import SearchableLocationDropdown from "./SearchableLocationDropdown";
import { USTP_LOCATIONS, CATEGORIES_WITH_COLORS } from "@/constants";

interface FiltersProps {
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  onSearchSubmit: () => void; // ✅ Add this
}

const Filters: React.FC<FiltersProps> = ({
  selectedCategory,
  setSelectedCategory,
  description,
  setDescription,
  location,
  setLocation,
  onSearchSubmit,
}) => {
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
      >
        <div className="flex w-full flex-col items-center gap-6 mt-5 lg:flex-row lg:items-start">
          {/* Category buttons */}
          <div className="w-full lg:max-w-[18rem] space-y-3">
            <h1 className="text-sm">Item Category</h1>
            <div className="flex flex-wrap w-full gap-3 lg:flex-wrap">
              {CATEGORIES_WITH_COLORS.map((category) => (
                <CategoryButton
                  key={category.label}
                  label={category.label}
                  color={category.color}
                  active={selectedCategory === category.label}
                  onClick={() => setSelectedCategory(category.label)}
                  onClear={() => setSelectedCategory("All")} // only clears the style
                />
              ))}
            </div>
          </div>

          {/* Location dropdown */}
          <div className="w-full space-y-3 lg:max-w-md">
            <h1 className="text-sm">Last seen location</h1>
            <SearchableLocationDropdown
              value={location}
              onChange={setLocation}
              placeholder="All locations"
            />
          </div>

          {/* Description input */}
          <div className="w-full space-y-3 lg:max-w-md">
            <h1 className="text-sm">Match with item description</h1>
            <input
              type="text"
              placeholder="Description keywords..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border px-3 py-2 w-full rounded-md placeholder:text-sm"
            />
          </div>
        </div>

        {/* Separator line */}
        <div className="w-full flex justify-center my-8">
          <div className="h-[1px] bg-gray-300 w-full max-w-7xl" />
        </div>
      </form>
    </>
  );
};

export default Filters;

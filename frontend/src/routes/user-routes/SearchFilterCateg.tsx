export default function SearchFilterCateg({
  selectedCategory,
  onCategoryClick,
}: {
  selectedCategory: string;
  onCategoryClick: (category: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {["Student Belongings", "Gadgets", "Personal Belongings"].map(
        (category) => {
          const isActive = selectedCategory === category;
          const base = "px-4 py-2 rounded-full border font-medium transition";

          let style = "";
          if (category === "Student Belongings")
            style = isActive
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
          else if (category === "Gadgets")
            style = isActive
              ? "bg-yellow-500 text-white border-yellow-500"
              : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
          else if (category === "Personal Belongings")
            style = isActive
              ? "bg-pink-600 text-white border-pink-600"
              : "bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200";

          return (
            <button
              key={category}
              onClick={() => onCategoryClick(category)}
              className={`${base} ${style}`}
            >
              {category}
            </button>
          );
        }
      )}
    </div>
  );
}

import { useState } from "react";
import type { Post } from "@/types/Post";

// components
import PostCard from "@/components/PostCard";
import PostModal from "@/components/PostModal";
import MobileNavText from "@/components/NavHeadComp";
import SearchBar from "../../components/SearchBar";

// hooks
import { usePosts } from "@/hooks/usePosts";

function fuzzyMatch(text: string, query: string): boolean {
  const cleanedText = text.toLowerCase();
  const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean);

  // Make sure every keyword appears in the text
  return queryWords.every((word) => cleanedText.includes(word));
}

export default function HomePage() {
  // ✅ Use the custom hook for real-time posts
  const { posts, loading, error } = usePosts();
  const [viewType, setViewType] = useState<"all" | "lost" | "found" | "completed">("all");
  const [lastDescriptionKeyword, setLastDescriptionKeyword] = useState("");
  const [rawResults, setRawResults] = useState<Post[] | null>(null); // store-search-result-without-viewType-filter
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // e modify rani siya sa backend django
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  // e change dari pila ka post mu appear pag click and load more button
  const itemsPerPage = 2;

  const handleSearch = async (query: string, filters: any) => {
    setLastDescriptionKeyword(filters.description || "");

    const filtered = (posts ?? []).filter((item) => {
      const matchesQuery = query.trim() ? fuzzyMatch(item.title, query) : true;

      const matchesCategory =
        filters.selectedCategory &&
        filters.selectedCategory.toLowerCase() != "all"
          ? item.category.toLowerCase() ===
            filters.selectedCategory.toLowerCase()
          : true;

      const matchesDescription = filters.description
        ? fuzzyMatch(item.description, filters.description)
        : true;

      const matchesLocation = filters.location
        ? item.location.toLowerCase() === filters.location.toLowerCase()
        : true;

      return (
        matchesQuery && matchesCategory && matchesDescription && matchesLocation
      );
    });
    setRawResults(filtered);
  };

  // const postsToDisplay = (rawResults ?? posts ?? []).filter(
  //   (post) => post.type === viewType
  // );

  const postsToDisplay = (rawResults ?? posts ?? []).filter((post) => {
    if (viewType === "all") return true;
    if (viewType === "completed") return post.status === "resolved";
    return post.type.toLowerCase() === viewType;
  });

  return (
    <div className="min-h-screen bg-gray-100 mb-13 font-manrope transition-colors duration-300">
      <MobileNavText title="Home" description="Welcome to home" />

      <div className="pt-4 px-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* SearchBar (grows to fill left side) */}
        <div className="w-full lg:flex-1">
          <SearchBar
            onSearch={handleSearch}
            onClear={() => {
              setRawResults(null);
              setLastDescriptionKeyword("");
              setSearchQuery("");
            }}
            query={searchQuery}
            setQuery={setSearchQuery}
          />
        </div>

        {/* Home Title and Description */}
        <div className="hidden lg:block lg:max-w-sm lg:text-right space-y-1">
          <h1 className="text-sm font-medium">Home</h1>
          <p className="text-xs text-gray-600">
            Find your lost and found items here
          </p>
        </div>
      </div>

      {/* Lost / Found Toggle */}
      <div className="flex flex-wrap sm:justify-center items-center gap-3 w-full px-6 lg:justify-start lg:gap-3">
        <button
          className={`px-4 py-2 cursor-pointer lg:px-8 rounded text-[14px] lg:text-base font-medium transition-colors duration-300 ${
            viewType === "all"
              ? "bg-navyblue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-200 border-gray-300"
          }`}
          onClick={() => {
            setIsLoading(true);
            setViewType("all");
            setTimeout(() => setIsLoading(false), 200);
          }}
        >
          All Item Reports
        </button>

        <button
          className={`px-4 py-2 cursor-pointer lg:px-8 rounded text-[14px] lg:text-base font-medium transition-colors duration-300 ${
            viewType === "lost"
              ? "bg-navyblue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-200 border-gray-300"
          }`}
          onClick={() => {
            setIsLoading(true);
            setViewType("lost");
            setTimeout(() => setIsLoading(false), 200);
          }}
        >
          Lost Item Reports
        </button>

        <button
          className={`px-4 py-2 cursor-pointer lg:px-8 rounded text-[14px] lg:text-base font-medium transition-colors duration-300 ${
            viewType === "found"
              ? "bg-navyblue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-200 border-gray-300"
          }`}
          onClick={() => {
            setIsLoading(true);
            setViewType("found");
            setTimeout(() => setIsLoading(false), 200);
          }}
        >
          Found Item Reports
        </button>

        <button
          className={`px-4 py-2 cursor-pointer lg:px-8 rounded text-[14px] lg:text-base font-medium transition-colors duration-300 ${
            viewType === "completed"
              ? "bg-navyblue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-200 border-gray-300"
          }`}
          onClick={() => {
            setIsLoading(true);
            setViewType("completed");
            setTimeout(() => setIsLoading(false), 200);
          }}
        >
          Completed Reports
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 mx-6 mt-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {/* ✅ Handle Firebase loading state */}
        {loading || isLoading ? (
          <div className="col-span-full flex items-center justify-center h-80">
            <span className="text-gray-400">
              Loading {viewType === "completed" ? "completed" : viewType} report items...
            </span>
          </div>
        ) : error ? (
          <div className="col-span-full flex items-center justify-center h-80 text-red-500">
            <p>Error loading posts: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : postsToDisplay.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-80 text-gray-500">
            No results found.
          </div>
        ) : (
          postsToDisplay
            .slice()
            .reverse()
            .slice(0, currentPage * itemsPerPage)
            .map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => setSelectedPost(post)}
                highlightText={lastDescriptionKeyword}
              />
            ))
        )}
      </div>

      {postsToDisplay.length > currentPage * itemsPerPage && (
        <div className="flex justify-center my-6">
          <button
            className="px-6 py-2 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition"
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Load More
          </button>
        </div>
      )}

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}

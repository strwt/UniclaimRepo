import { useState } from "react";
import type { Post } from "@/types/Post";

// components
import AdminPostCard from "@/components/AdminPostCard";
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

export default function AdminHomePage() {
  // ✅ Use the custom hook for real-time posts
  const { posts, loading, error } = usePosts();
  const [viewType, setViewType] = useState<"all" | "lost" | "found" | "unclaimed">("all");
  const [lastDescriptionKeyword, setLastDescriptionKeyword] = useState("");
  const [rawResults, setRawResults] = useState<Post[] | null>(null); // store-search-result-without-viewType-filter
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // e modify rani siya sa backend django
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  // e change dari pila ka post mu appear pag click and load more button
  const itemsPerPage = 2;
  
  // State for user feedback
  const [isCheckingExpired, setIsCheckingExpired] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  


  // Check for expired posts and move them to unclaimed
  const checkAndMoveExpiredPosts = async () => {
    if (!posts) return;
    
    setIsCheckingExpired(true);
    setFeedbackMessage(null);
    
    try {
      const now = new Date();
      const expiredPosts = posts.filter(post => {
        if (!post.expiryDate || post.movedToUnclaimed) return false;
        
        const expiryDate = post.expiryDate instanceof Date 
          ? post.expiryDate 
          : new Date(post.expiryDate);
        
        return expiryDate < now;
      });

      if (expiredPosts.length > 0) {
        console.log(`Found ${expiredPosts.length} expired posts to move to unclaimed`);
        
        // Import and use the post service to update expired posts
        const { postService } = await import('../../utils/firebase');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const post of expiredPosts) {
          try {
            await postService.movePostToUnclaimed(post.id);
            successCount++;
          } catch (error) {
            console.error(`Failed to move post ${post.id} to unclaimed:`, error);
            errorCount++;
          }
        }
        
        if (errorCount === 0) {
          setFeedbackMessage({
            type: 'success',
            message: `Successfully moved ${successCount} expired posts to unclaimed status.`
          });
        } else {
          setFeedbackMessage({
            type: 'error',
            message: `Moved ${successCount} posts to unclaimed, but ${errorCount} failed.`
          });
        }
      } else {
        setFeedbackMessage({
          type: 'success',
          message: 'No expired posts found. All posts are within their 30-day period.'
        });
      }
    } catch (error) {
      console.error('Error checking expired posts:', error);
      setFeedbackMessage({
        type: 'error',
        message: `Error checking expired posts: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsCheckingExpired(false);
      
      // Clear feedback message after 5 seconds
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Admin functionality handlers
  const handleEditPost = (post: Post) => {
    console.log('Edit post:', post);
    // TODO: Implement edit functionality
    alert(`Edit functionality for post: ${post.title}`);
  };

  const handleDeletePost = (post: Post) => {
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      console.log('Delete post:', post);
      // TODO: Implement delete functionality
      alert(`Delete functionality for post: ${post.title}`);
    }
  };

  const handleStatusChange = (post: Post, status: string) => {
    console.log('Status change:', post.id, status);
    // TODO: Implement status update functionality
    alert(`Status updated to: ${status}`);
  };

  const handleActivateTicket = async (post: Post) => {
    if (confirm(`Are you sure you want to activate "${post.title}"? This will move it back to active status with a new 30-day period.`)) {
      try {
        const { postService } = await import('../../utils/firebase');
        await postService.activateTicket(post.id);
        console.log('Ticket activated successfully:', post.title);
        
        setFeedbackMessage({
          type: 'success',
          message: `"${post.title}" has been activated and moved back to active status with a new 30-day period.`
        });
        
        // Clear feedback message after 5 seconds
        setTimeout(() => setFeedbackMessage(null), 5000);
      } catch (error) {
        console.error('Failed to activate ticket:', error);
        setFeedbackMessage({
          type: 'error',
          message: `Failed to activate ticket: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        
        // Clear feedback message after 5 seconds
        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    }
  };



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
    if (viewType === "unclaimed") return post.movedToUnclaimed === true;
    return post.type.toLowerCase() === viewType;
  });

  return (
    <div className="min-h-screen bg-gray-100 mb-13 font-manrope transition-colors duration-300">
      <MobileNavText title="Admin Home" description="Admin dashboard for managing posts" />

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
          <h1 className="text-sm font-medium">Admin Home</h1>
          <p className="text-xs text-gray-600">
            Manage all lost and found items here
          </p>
        </div>
      </div>

      {/* Admin Quick Stats */}
      <div className="px-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Dashboard Overview</h2>
          <div className="flex gap-2">
            <button
              onClick={checkAndMoveExpiredPosts}
              disabled={isCheckingExpired}
              className={`px-4 py-2 rounded transition text-sm ${
                isCheckingExpired 
                  ? 'bg-orange-300 text-white cursor-not-allowed' 
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
              title="Check for expired posts and move them to unclaimed"
            >
              {isCheckingExpired ? '⏳ Checking...' : '🔍 Check Expired Posts'}
            </button>
          </div>
        </div>
        



        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{posts?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {posts?.filter(p => p.type === 'lost').length || 0}
            </div>
            <div className="text-sm text-gray-600">Lost Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {posts?.filter(p => p.type === 'found').length || 0}
            </div>
            <div className="text-sm text-gray-600">Found Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {posts?.filter(p => p.status === 'pending').length || 0}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {posts?.filter(p => p.movedToUnclaimed === true).length || 0}
            </div>
            <div className="text-sm text-gray-600">Unclaimed</div>
          </div>
        </div>
        
        {/* Feedback Messages */}
        {feedbackMessage && (
          <div className={`mt-4 p-3 rounded-lg border ${
            feedbackMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-lg mt-0.5">
                {feedbackMessage.type === 'success' ? '✅' : '❌'}
              </span>
              <div className="font-medium whitespace-pre-line">
                {feedbackMessage.message}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Type Tabs */}
      <div className="flex flex-wrap sm:justify-center items-center gap-3 w-full px-6 lg:justify-start lg:gap-3">
        <div className="w-full lg:w-auto text-center lg:text-left mb-2 lg:mb-0">
          <span className="text-sm text-gray-600">Current View: </span>
          <span className="text-sm font-semibold text-blue-600 capitalize">
            {viewType === "unclaimed" ? "Unclaimed Items" : `${viewType} Item Reports`}
          </span>
        </div>
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
            viewType === "unclaimed"
              ? "bg-navyblue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-200 border-gray-300"
          }`}
          onClick={() => {
            setIsLoading(true);
            setViewType("unclaimed");
            setTimeout(() => setIsLoading(false), 200);
          }}
        >
          Unclaimed Items
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 mx-6 mt-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {/* ✅ Handle Firebase loading state */}
        {loading || isLoading ? (
          <div className="col-span-full flex items-center justify-center h-80">
            <span className="text-gray-400">
              Loading {viewType === "unclaimed" ? "unclaimed" : viewType} report items...
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
              <AdminPostCard
                key={post.id}
                post={post}
                onClick={() => setSelectedPost(post)}
                highlightText={lastDescriptionKeyword}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onStatusChange={handleStatusChange}
                onActivateTicket={handleActivateTicket}
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

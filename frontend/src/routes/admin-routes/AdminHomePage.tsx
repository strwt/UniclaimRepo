import { useState, useEffect } from "react";
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

  // 🔧 DIAGNOSTIC: Temporary function to see ALL posts (including expired/unclaimed)
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);

  // Load all posts for diagnostic purposes
  useEffect(() => {
    if (showAllPosts) {
      const loadAllPosts = async () => {
        console.log('🔧 Diagnostic: ===== FIRESTORE PERMISSIONS DEBUG =====');
        console.log('🔧 Show All Posts button clicked!');

        try {
          const { postService, auth, db } = await import('../../utils/firebase');
          const { doc, getDoc } = await import('firebase/firestore');

          console.log('🔧 Current user:', auth.currentUser?.email || 'No user');
          console.log('🔧 Auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
          console.log('🔧 User ID:', auth.currentUser?.uid || 'No UID');

          if (!auth.currentUser) {
            console.error('🔧 Diagnostic: User not authenticated!');
            alert('Authentication Error: Please log in again');
            return;
          }

          // Check if user is banned
          console.log('🔧 Diagnostic: Checking if user is banned...');
          try {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('🔧 User status:', userData.status || 'No status');
              console.log('🔧 User email:', userData.email || 'No email');

              if (userData.status === 'banned') {
                console.error('🔧 Diagnostic: User is BANNED!');
                alert('Account Error: Your account is banned. Contact admin.');
                return;
              }
            } else {
              console.error('🔧 Diagnostic: User document not found!');
              alert('Account Error: User profile not found. Please log in again.');
              return;
            }
          } catch (userError) {
            console.error('🔧 Diagnostic: Error checking user status:', userError);
          }

          // Check if user is admin
          const adminEmails = ['admin@ustp.edu.ph', 'superadmin@ustp.edu.ph', 'admin@uniclaim.com'];
          const isAdmin = adminEmails.includes(auth.currentUser.email || '');
          console.log('🔧 Is admin:', isAdmin);
          console.log('🔧 Admin emails:', adminEmails);
          console.log('🔧 Current email:', auth.currentUser.email);

          console.log('🔧 Diagnostic: Attempting to fetch all posts...');
          postService.getAllPosts((fetchedPosts) => {
            console.log('🔧 Diagnostic: Successfully fetched', fetchedPosts.length, 'posts');

            // Detailed analysis of fetched posts
            console.log('🔧 Diagnostic: ===== POST ANALYSIS =====');

            // Summary statistics
            const postStats = {
              total: fetchedPosts.length,
              byType: {
                lost: fetchedPosts.filter(p => p.type === 'lost').length,
                found: fetchedPosts.filter(p => p.type === 'found').length
              },
              byStatus: {
                pending: fetchedPosts.filter(p => p.status === 'pending').length,
                resolved: fetchedPosts.filter(p => p.status === 'resolved').length,
                rejected: fetchedPosts.filter(p => p.status === 'rejected').length
              },
              byFoundAction: {
                keep: fetchedPosts.filter(p => p.foundAction === 'keep').length,
                osa: fetchedPosts.filter(p => p.foundAction === 'turnover to OSA').length,
                security: fetchedPosts.filter(p => p.foundAction === 'turnover to Campus Security').length
              },
              unclaimed: fetchedPosts.filter(p => p.movedToUnclaimed === true).length
            };

            console.log('🔧 Post Statistics:', postStats);

            // Individual post details
            fetchedPosts.forEach((post, index) => {
              console.log(`🔧 Post ${index + 1}:`, {
                id: post.id,
                title: post.title,
                type: post.type,
                status: post.status,
                foundAction: post.foundAction,
                movedToUnclaimed: post.movedToUnclaimed,
                createdAt: post.createdAt
              });
            });

            setAllPosts(fetchedPosts);
          });
        } catch (error) {
          console.error('🔧 Diagnostic: Error loading all posts:', error);
          console.error('🔧 Diagnostic: Error details:', error.message);
          alert('Error loading posts: ' + error.message);
        }
      };
      loadAllPosts();
    }
  }, [showAllPosts]);
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
  




  // Admin functionality handlers
  const handleDeletePost = (post: Post) => {
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      console.log('Delete post:', post);
      // TODO: Implement delete functionality
      // For now, just log the action
    }
  };

  const handleStatusChange = (post: Post, status: string) => {
    console.log('Status change:', post.id, status);
    // TODO: Implement status update functionality
    // For now, just log the action
  };

  const handleActivateTicket = async (post: Post) => {
    if (confirm(`Are you sure you want to activate "${post.title}"? This will move it back to active status with a new 30-day period.`)) {
      try {
        const { postService } = await import('../../utils/firebase');
        await postService.activateTicket(post.id);
        console.log('Ticket activated successfully:', post.title);
      } catch (error) {
        console.error('Failed to activate ticket:', error);
      }
    }
  };

  const handleRevertResolution = async (post: Post) => {
    const reason = prompt(`Why are you reverting "${post.title}"? (Optional reason for audit log):`);
    if (reason === null) return; // User cancelled

    if (confirm(`Are you sure you want to revert "${post.title}" back to pending status? This will reset any claim/handover requests.`)) {
      try {
        const { postService } = await import('../../utils/firebase');
        await postService.revertPostResolution(post.id, 'admin', reason || undefined);
        console.log('Post resolution reverted successfully:', post.title);
        // Optionally refresh the posts list here if needed
      } catch (error) {
        console.error('Failed to revert post resolution:', error);
        alert('Failed to revert post resolution. Please try again.');
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

  // Use allPosts if diagnostic mode is on, otherwise use regular posts
  const currentPosts = showAllPosts ? allPosts : posts;

  // Debug filtering logic
  console.log('🔧 AdminHomePage Debug:', {
    viewType,
    currentPostsCount: currentPosts.length,
    showAllPosts,
    rawResultsCount: rawResults?.length || 0
  });

  const postsToDisplay = (rawResults ?? currentPosts ?? []).filter((post) => {
    let shouldShow = false;

    if (viewType === "all") {
      shouldShow = true;
    } else if (viewType === "unclaimed") {
      shouldShow = post.movedToUnclaimed === true;
    } else {
      shouldShow = post.type.toLowerCase() === viewType;
    }

    // Debug each post filtering decision
    console.log(`🔧 Filtering post "${post.title}":`, {
      type: post.type,
      viewType,
      movedToUnclaimed: post.movedToUnclaimed,
      shouldShow
    });

    return shouldShow;
  });

  console.log('🔧 Final postsToDisplay count:', postsToDisplay.length);

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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Dashboard Overview</h2>
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
      </div>

      {/* 🔧 DIAGNOSTIC STATUS */}
      <div className="px-6 mb-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-600 font-medium">🔧 Diagnostic Mode:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              showAllPosts ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {showAllPosts ? 'SHOWING ALL POSTS' : 'ACTIVE POSTS ONLY'}
            </span>
          </div>
          <div className="text-sm text-orange-700 space-y-1">
            <div>Active Posts: {posts.length} | All Posts: {showAllPosts ? allPosts.length : 'Not loaded'}</div>
            <div>Filtered Posts: {postsToDisplay.length} | Current View: {viewType.toUpperCase()}</div>
            <div className="pt-2 border-t border-orange-200">
              <div><strong>🔍 Post Analysis:</strong></div>
              <div>• Active posts by type: Lost: {posts.filter(p => p.type === 'lost').length}, Found: {posts.filter(p => p.type === 'found').length}</div>
              <div>• Unclaimed posts: {posts.filter(p => p.movedToUnclaimed === true).length}</div>
              <div>• Found posts with 'keep' action: {posts.filter(p => p.foundAction === 'keep').length}</div>
              <div>• Click "Show All Posts" to see detailed diagnostic</div>
              <div className="pt-2 text-xs">
                <div><strong>💡 Possible Issues:</strong></div>
                <div>• Different user accounts on homepage vs admin page?</div>
                <div>• Posts have 'keep' foundAction but filtered by viewType?</div>
                <div>• Posts expired or moved to unclaimed?</div>
              </div>
            </div>
          </div>
        </div>
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

        {/* 🔧 DIAGNOSTIC BUTTON - Shows ALL posts including expired/unclaimed */}
        <button
          className={`px-4 py-2 cursor-pointer lg:px-8 rounded text-[14px] lg:text-base font-medium transition-colors duration-300 ${
            showAllPosts
              ? "bg-red-500 text-white"
              : "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300"
          }`}
          onClick={() => {
            setShowAllPosts(!showAllPosts);
            setRawResults(null); // Clear search results when toggling
            setLastDescriptionKeyword("");
            setSearchQuery("");
          }}
          title="Diagnostic Mode: Show ALL posts (including expired/unclaimed)"
        >
          🔧 {showAllPosts ? "Hide All Posts" : "Show All Posts"}
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
                onDelete={handleDeletePost}
                onStatusChange={handleStatusChange}
                onActivateTicket={handleActivateTicket}
                onRevertResolution={handleRevertResolution}
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
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} hideSendMessage={true} />
      )}
    </div>
  );
}

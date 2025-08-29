import { useState, useEffect } from "react";
import type { Post } from "@/types/Post";

// components
import AdminPostCard from "@/components/AdminPostCard";
import PostModal from "@/components/PostModal";
import MobileNavText from "@/components/NavHeadComp";
import SearchBar from "../../components/SearchBar";

// hooks
import { usePosts, useResolvedPosts } from "@/hooks/usePosts";
import { useToast } from "@/context/ToastContext";

function fuzzyMatch(text: string, query: string): boolean {
  const cleanedText = text.toLowerCase();
  const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean);

  // Make sure every keyword appears in the text
  return queryWords.every((word) => cleanedText.includes(word));
}

export default function AdminHomePage() {
  // ✅ Use the custom hooks for real-time posts
  const { posts, loading, error } = usePosts();
  const { posts: resolvedPosts, loading: resolvedLoading, error: resolvedError } = useResolvedPosts();
  const { showToast } = useToast();




  const [viewType, setViewType] = useState<"all" | "lost" | "found" | "unclaimed" | "completed">("all");
  const [lastDescriptionKeyword, setLastDescriptionKeyword] = useState("");
  const [rawResults, setRawResults] = useState<Post[] | null>(null); // store-search-result-without-viewType-filter
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  // Audit log viewer state
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Admin statistics state
  const [adminStats, setAdminStats] = useState({
    totalActions: 0,
    actionsToday: 0,
    actionsThisWeek: 0,
    actionsByType: {
      delete: 0,
      statusChange: 0,
      activate: 0,
      revert: 0
    },
    recentActivity: []
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // e modify rani siya sa backend django
  const [selectedPost] = useState<Post | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  // e change dari pila ka post mu appear pag click and load more button
  const itemsPerPage = 2;
  




  // Admin functionality handlers
  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      setDeletingPostId(postToDelete.id);
      
      // Get current admin user info for audit logging
      const { getAuth } = await import('../../utils/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Admin authentication required');
      }
      
      const { postService } = await import('../../utils/firebase');
      await postService.deletePost(postToDelete.id);
      
      // Create audit log entry
      try {
        const { addDoc, collection, serverTimestamp } = await import('../../utils/firebase');
        await addDoc(collection(getAuth(), 'audit_logs'), {
          action: 'admin_delete_post',
          postId: postToDelete.id,
          postTitle: postToDelete.title,
          postType: postToDelete.type,
          postCategory: postToDelete.category,
          adminId: currentUser.uid,
          adminEmail: currentUser.email,
          timestamp: serverTimestamp(),
          details: `Admin deleted post "${postToDelete.title}" (${postToDelete.type} ${postToDelete.category})`
        });
      } catch (auditError) {
        // Don't fail the main deletion if audit logging fails
        console.warn('Failed to create audit log entry:', auditError);
      }
      
      showToast("success", "Post Deleted", `"${postToDelete.title}" has been successfully deleted along with all associated images.`);
      // The posts will automatically refresh due to real-time listeners
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      showToast("error", "Delete Failed", `Failed to delete "${postToDelete.title}": ${error.message || 'Unknown error occurred'}`);
    } finally {
      setDeletingPostId(null);
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setAuditLogsLoading(true);
      const { getAuth, collection, query, orderBy, limit, getDocs } = await import('../../utils/firebase');
      const auth = getAuth();
      
      // Query recent audit logs (last 100 actions)
      const auditLogsRef = collection(auth, 'audit_logs');
      const q = query(auditLogsRef, orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }));
      
      setAuditLogs(logs);
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      showToast("error", "Audit Log Error", "Failed to load audit logs");
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // Open audit log viewer
  const openAuditLogs = () => {
    setShowAuditLogs(true);
    fetchAuditLogs();
  };

  // Close audit log viewer
  const closeAuditLogs = () => {
    setShowAuditLogs(false);
    setAuditLogs([]);
  };

  // Calculate admin statistics
  const calculateAdminStats = async () => {
    try {
      setStatsLoading(true);
      const { getAuth, collection, query, orderBy, limit, getDocs, where } = await import('../../utils/firebase');
      const auth = getAuth();
      
      // Get current admin user info
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const auditLogsRef = collection(auth, 'audit_logs');
      
      // Get all admin actions by current user
      const userActionsQuery = query(
        auditLogsRef,
        where('adminId', '==', currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const userActionsSnapshot = await getDocs(userActionsQuery);
      
      const allActions = userActionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }));

      // Calculate time-based statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const actionsToday = allActions.filter(action => 
        action.timestamp >= today
      ).length;

      const actionsThisWeek = allActions.filter(action => 
        action.timestamp >= weekAgo
      ).length;

      // Calculate actions by type
      const actionsByType = {
        delete: allActions.filter(action => action.action === 'admin_delete_post').length,
        statusChange: allActions.filter(action => action.action === 'admin_status_change').length,
        activate: allActions.filter(action => action.action === 'admin_activate_ticket').length,
        revert: allActions.filter(action => action.action === 'admin_revert_resolution').length
      };

      // Get recent activity (last 5 actions)
      const recentActivity = allActions.slice(0, 5);

      setAdminStats({
        totalActions: allActions.length,
        actionsToday,
        actionsThisWeek,
        actionsByType,
        recentActivity
      });

    } catch (error: any) {
      console.error('Failed to calculate admin stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load statistics when component mounts
  useEffect(() => {
    calculateAdminStats();
  }, []);

  // Keyboard shortcuts and accessibility for delete modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showDeleteModal) return;
      
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          cancelDelete();
          break;
        case 'Enter':
          if (deletingPostId !== postToDelete?.id) {
            event.preventDefault();
            confirmDelete();
          }
          break;
        case 'Tab':
          // Prevent tabbing outside the modal
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
          break;
      }
    };

    if (showDeleteModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the delete button for better accessibility
      const deleteButton = document.querySelector('[aria-label="Confirm deletion of post"]') as HTMLButtonElement;
      if (deleteButton && !deleteButton.disabled) {
        deleteButton.focus();
      }
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body scroll
      document.body.style.overflow = '';
    };
  }, [showDeleteModal, deletingPostId, postToDelete]);

  const handleStatusChange = async (post: Post, status: string) => {
    try {
      // Get current admin user info for audit logging
      const { getAuth } = await import('../../utils/firebase');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        showToast("error", "Authentication Error", "Admin authentication required");
        return;
      }
      
      // TODO: Implement status update functionality
      console.log('Status change:', post.id, status);
      
      // Create audit log entry for status change
      try {
        const { addDoc, collection, serverTimestamp } = await import('../../utils/firebase');
        await addDoc(collection(getAuth(), 'audit_logs'), {
          action: 'admin_status_change',
          postId: post.id,
          postTitle: post.title,
          postType: post.type,
          postCategory: post.category,
          oldStatus: post.status,
          newStatus: status,
          adminId: currentUser.uid,
          adminEmail: currentUser.email,
          timestamp: serverTimestamp(),
          details: `Admin changed status of "${post.title}" from ${post.status} to ${status}`
        });
        
        showToast("success", "Status Updated", `Post status changed to ${status}`);
      } catch (auditError) {
        console.warn('Failed to create audit log entry:', auditError);
        showToast("warning", "Partial Success", "Status change logged but audit trail incomplete");
      }
    } catch (error: any) {
      console.error('Failed to change post status:', error);
      showToast("error", "Status Change Failed", error.message || 'Unknown error occurred');
    }
  };

  const handleActivateTicket = async (post: Post) => {
    if (confirm(`Are you sure you want to activate "${post.title}"? This will move it back to active status with a new 30-day period.`)) {
      try {
        // Get current admin user info for audit logging
        const { getAuth } = await import('../../utils/firebase');
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          showToast("error", "Authentication Error", "Admin authentication required");
          return;
        }
        
        const { postService } = await import('../../utils/firebase');
        await postService.activateTicket(post.id);
        
        // Create audit log entry
        try {
          const { addDoc, collection, serverTimestamp } = await import('../../utils/firebase');
          await addDoc(collection(getAuth(), 'audit_logs'), {
            action: 'admin_activate_ticket',
            postId: post.id,
            postTitle: post.title,
            postType: post.type,
            postCategory: post.category,
            adminId: currentUser.uid,
            adminEmail: currentUser.email,
            timestamp: serverTimestamp(),
            details: `Admin activated ticket "${post.title}" - moved from unclaimed back to active status`
          });
        } catch (auditError) {
          console.warn('Failed to create audit log entry:', auditError);
        }
        
        showToast("success", "Ticket Activated", `"${post.title}" has been activated and moved back to active status.`);
        console.log('Ticket activated successfully:', post.title);
      } catch (error: any) {
        console.error('Failed to activate ticket:', error);
        showToast("error", "Activation Failed", error.message || 'Failed to activate ticket');
      }
    }
  };

  const handleRevertResolution = async (post: Post) => {
    const reason = prompt(`Why are you reverting "${post.title}"? (Optional reason for audit log):`);
    if (reason === null) return; // User cancelled

    if (confirm(`Are you sure you want to revert "${post.title}" back to pending status? This will reset any claim/handover requests.`)) {
      try {
        // Get current admin user info for audit logging
        const { getAuth } = await import('../../utils/firebase');
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          showToast("error", "Authentication Error", "Admin authentication required");
          return;
        }
        
        const { postService } = await import('../../utils/firebase');
        await postService.revertPostResolution(post.id, 'admin', reason || undefined);
        
        // Create audit log entry
        try {
          const { addDoc, collection, serverTimestamp } = await import('../../utils/firebase');
          await addDoc(collection(getAuth(), 'audit_logs'), {
            action: 'admin_revert_resolution',
            postId: post.id,
            postTitle: post.title,
            postType: post.type,
            postCategory: post.category,
            adminId: currentUser.uid,
            adminEmail: currentUser.email,
            timestamp: serverTimestamp(),
            reason: reason || 'No reason provided',
            details: `Admin reverted resolution of "${post.title}" back to pending status. Reason: ${reason || 'No reason provided'}`
          });
        } catch (auditError) {
          console.warn('Failed to create audit log entry:', auditError);
        }
        
        showToast("success", "Resolution Reverted", `"${post.title}" has been reverted back to pending status.`);
        console.log('Post resolution reverted successfully:', post.title);
        // Optionally refresh the posts list here if needed
      } catch (error: any) {
        console.error('Failed to revert post resolution:', error);
        showToast("error", "Revert Failed", error.message || 'Failed to revert post resolution');
      }
    }
  };



  const handleSearch = async (query: string, filters: any) => {
    setLastDescriptionKeyword(filters.description || "");

    // Use appropriate posts based on current viewType
    const postsToSearch = viewType === "completed" ? resolvedPosts : posts;

    const filtered = (postsToSearch ?? []).filter((item) => {
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



  const postsToDisplay = (rawResults ?? (viewType === "completed" ? resolvedPosts : posts) ?? []).filter((post) => {
    let shouldShow = false;

    if (viewType === "all") {
      shouldShow = true;
    } else if (viewType === "unclaimed") {
      shouldShow = post.movedToUnclaimed === true;
    } else if (viewType === "completed") {
      shouldShow = true; // resolvedPosts already filtered
    } else {
      shouldShow = post.type.toLowerCase() === viewType;
    }

    return shouldShow;
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Dashboard Overview</h2>
        </div>
        



        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {resolvedPosts?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>



      {/* View Type Tabs */}
      <div className="flex flex-wrap sm:justify-center items-center gap-3 w-full px-6 lg:justify-start lg:gap-3">
        <div className="w-full lg:w-auto text-center lg:text-left mb-2 lg:mb-0">
          <span className="text-sm text-gray-600">Current View: </span>
          <span className="text-sm font-semibold text-blue-600 capitalize">
            {viewType === "unclaimed" ? "Unclaimed Items" :
             viewType === "completed" ? "Completed Reports" :
             `${viewType} Item Reports`}
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

        {/* Audit Logs Button */}
        <button
          className="px-4 py-2 cursor-pointer lg:px-8 rounded text-[14px] lg:text-base font-medium transition-colors duration-300 bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
          onClick={openAuditLogs}
          title="View admin action history and audit trail"
        >
          📋 Audit Logs
        </button>


      </div>

      <div className="grid grid-cols-1 gap-5 mx-6 mt-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {/* ✅ Handle Firebase loading state */}
        {(loading || resolvedLoading || isLoading) ? (
          <div className="col-span-full flex items-center justify-center h-80">
            <span className="text-gray-400">
              Loading {viewType === "unclaimed" ? "unclaimed" :
                       viewType === "completed" ? "completed" :
                       viewType} report items...
            </span>
          </div>
        ) : (error || resolvedError) ? (
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
                isDeleting={deletingPostId === post.id}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && postToDelete && (
        <>
          {/* Screen reader announcement */}
          <div 
            className="sr-only" 
            aria-live="polite"
            aria-atomic="true"
          >
            Delete confirmation dialog opened for post: {postToDelete.title}
          </div>
          
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={cancelDelete}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
          >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 
                id="delete-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Confirm Deletion
              </h3>
              <button
                onClick={cancelDelete}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={deletingPostId === postToDelete.id}
                aria-label="Close confirmation dialog"
                title="Close (Esc)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Delete "{postToDelete.title}"?
              </h4>
              <p 
                id="delete-modal-description"
                className="text-sm text-gray-600"
              >
                This action cannot be undone. The post and all associated images will be permanently removed from the system.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={deletingPostId === postToDelete.id}
                aria-label="Cancel deletion"
                title="Cancel (Esc)"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingPostId === postToDelete.id}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                  deletingPostId === postToDelete.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                aria-label="Confirm deletion of post"
                title="Delete (Enter)"
              >
                {deletingPostId === postToDelete.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Admin Action History</h3>
                <p className="text-sm text-gray-600 mt-1">View recent admin actions and audit trail</p>
              </div>
              <button
                onClick={closeAuditLogs}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close audit logs"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {auditLogsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Loading audit logs...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
                  <p className="text-gray-600">Admin actions will appear here once they are performed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              log.action === 'admin_delete_post' ? 'bg-red-100 text-red-800' :
                              log.action === 'admin_status_change' ? 'bg-blue-100 text-blue-800' :
                              log.action === 'admin_activate_ticket' ? 'bg-green-100 text-green-800' :
                              log.action === 'admin_revert_resolution' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.action === 'admin_delete_post' ? '🗑️ Delete' :
                               log.action === 'admin_status_change' ? '🔄 Status Change' :
                               log.action === 'admin_activate_ticket' ? '✅ Activate' :
                               log.action === 'admin_revert_resolution' ? '⏪ Revert' :
                               log.action}
                            </span>
                            <span className="text-xs text-gray-500">
                              {log.timestamp instanceof Date 
                                ? log.timestamp.toLocaleString('en-PH', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })
                                : 'Unknown time'
                              }
                            </span>
                          </div>
                          
                          <h4 className="font-medium text-gray-900 mb-1">
                            {log.postTitle || 'Unknown Post'}
                          </h4>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Admin:</strong> {log.adminEmail || log.adminId || 'Unknown'}</p>
                            <p><strong>Post ID:</strong> {log.postId || 'N/A'}</p>
                            <p><strong>Type:</strong> {log.postType || 'N/A'} | <strong>Category:</strong> {log.postCategory || 'N/A'}</p>
                            {log.oldStatus && log.newStatus && (
                              <p><strong>Status Change:</strong> {log.oldStatus} → {log.newStatus}</p>
                            )}
                            {log.reason && (
                              <p><strong>Reason:</strong> {log.reason}</p>
                            )}
                            <p><strong>Details:</strong> {log.details || 'No additional details'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {auditLogs.length} recent admin actions
              </div>
              <button
                onClick={fetchAuditLogs}
                disabled={auditLogsLoading}
                className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {auditLogsLoading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

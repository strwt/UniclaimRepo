import MobileNavText from "@/components/NavHeadComp";
import { useState } from "react";
import type { Post } from "@/types/Post";
import TicketCard from "@/components/TicketCard";
import TicketModal from "@/components/TicketModal";
import { useAuth } from "../../context/AuthContext";
import { useUserPostsWithSet } from "../../hooks/usePosts";
import { postService } from "../../utils/firebase";
import { useToast } from "../../context/ToastContext";

export default function MyTicket() {
  const { userData, loading: authLoading } = useAuth();
  const { posts, setPosts, loading: postsLoading } = useUserPostsWithSet(userData?.email || "");
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "all_tickets" | "active_tickets" | "completed_tickets"
  >("all_tickets");
  const [searchText, setSearchText] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Show error if no user data
  if (!userData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">Please log in to view your tickets</p>
      </div>
    );
  }

  // Filter posts owned by current user
  const rawUserPosts = posts.filter(
    (post) => post.user.email === userData.email
  );

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleDeletePost = async (id: string) => {
    try {
      setDeletingPostId(id); // Show loading state
      
      // Call Firebase service to actually delete the post
      await postService.deletePost(id);
      
      // Update local state after successful deletion
      setPosts((prevPosts: Post[]) => prevPosts.filter((p: Post) => p.id !== id));
      setSelectedPost(null); // close modal after delete
      
      // Show success message
      showToast("success", "Ticket Deleted", "Your ticket has been successfully deleted.");
    } catch (error) {
      console.error('Error deleting post:', error);
      // Show error message to user
      showToast("error", "Delete Failed", "Failed to delete ticket. Please try again.");
      // Keep the post in local state if deletion fails
    } finally {
      setDeletingPostId(null); // Hide loading state
    }
  };

  // Filter posts based on selected tab
  const tabFilteredPosts = rawUserPosts.filter((post) => {
    if (activeTab === "all_tickets") return true;
    if (activeTab === "active_tickets") return post.status === "pending";
    if (activeTab === "completed_tickets") return post.status === "resolved";
    return false;
  });

  const visiblePosts = tabFilteredPosts.filter((post) =>
    post.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const tabOptions = [
    { key: "all_tickets", label: "All Tickets" },
    { key: "active_tickets", label: "Active Tickets" },
    { key: "completed_tickets", label: "Completed Tickets" },
  ] as const;

  return (
    <div>
      <MobileNavText
        title="My Ticket"
        description="View and edit your posted ticket here"
      />

      <div className="mx-4 lg:mx-6">
        {/* Search Section */}
        <div className="flex items-center justify-between pt-4 mb-5">
          <div className="w-full flex justify-center items-center gap-3 lg:justify-start">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search a ticket"
              className="w-full md:max-w-sm border px-3 py-2 rounded placeholder:text-sm"
            />
            <button className="bg-brand rounded text-white text-sm lg:text-base px-3 py-2 hover:bg-teal-600 transition-colors">
              Search
            </button>
            <button
              onClick={() => setSearchText("")}
              className="bg-gray-200 rounded text-black text-sm lg:text-base px-3 py-2 hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="hidden w-full lg:block lg:text-right space-y-1">
            <h1 className="font-medium text-sm">My Ticket</h1>
            <p className="text-xs text-gray-500">
              View and edit your posted ticket here
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex flex-wrap sm:justify-center items-center gap-2 w-full lg:justify-start lg:gap-3">
          {tabOptions.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 lg:px-8 rounded text-[14px] lg:text-base font-medium transition-colors duration-300
                ${
                  activeTab === tab.key
                    ? "bg-navyblue text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-200 border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Posts Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {postsLoading ? (
            <div className="flex h-90 items-center justify-center col-span-full">
              <p className="text-gray-500 text-sm">Loading tickets...</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="flex h-90 items-center justify-center col-span-full">
              <p className="text-gray-500 text-sm">No tickets found.</p>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <TicketCard
                key={post.id}
                post={post}
                onClick={() => setSelectedPost(post)}
              />
            ))
          )}
        </div>

        {selectedPost && (
          <TicketModal
            key={selectedPost.id} // 💡 This forces modal to re-render fresh data
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onDelete={handleDeletePost}
            isDeleting={deletingPostId === selectedPost.id}
            onUpdatePost={(updatedPost) => {
              setPosts((prevPosts: Post[]) =>
                prevPosts.map((p: Post) =>
                  p.id === updatedPost.id ? updatedPost : p
                )
              );
              setSelectedPost(updatedPost); // still important to update modal state
            }}
          />
        )}
      </div>
    </div>
  );
}

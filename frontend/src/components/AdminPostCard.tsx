import { useEffect, useMemo, memo } from "react";
import type { Post } from "@/types/Post";
import ProfilePicture from "./ProfilePicture";

interface AdminPostCardProps {
  post: Post;
  onClick: () => void;
  highlightText: string;
  onDelete?: (post: Post) => void;
  onStatusChange?: (post: Post, status: string) => void;
  onActivateTicket?: (post: Post) => void;
  onRevertResolution?: (post: Post) => void;
  isDeleting?: boolean;
}

function formatDateTime(datetime: string | Date) {
  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function highlightAndTruncate(text: string, keyword: string, maxLength = 90) {
  let truncated = text;
  if (text.length > maxLength) {
    truncated = text.slice(0, maxLength).trim() + "...";
  }

  if (!keyword.trim()) return truncated;

  const words = keyword.toLowerCase().split(" ").filter(Boolean);
  let result = truncated;

  words.forEach((word) => {
    const regex = new RegExp(`(${word})`, "gi");
    result = result.replace(
      regex,
      `<span class="bg-blue-300 font-medium">$1</span>`
    );
  });

  return result;
}

function AdminPostCard({
  post,
  onClick,
  highlightText,
  onDelete,
  onStatusChange,
  onActivateTicket,
  onRevertResolution,
  isDeleting = false
}: AdminPostCardProps) {
  const previewUrl = useMemo(() => {
    if (post.images && post.images.length > 0) {
      const firstImage = post.images[0];
      return typeof firstImage === "string"
        ? firstImage
        : URL.createObjectURL(firstImage as File);
    }
    return null;
  }, [post.images]);

  useEffect(() => {
    const firstImage = post.images?.[0];
    if (firstImage && typeof firstImage !== "string") {
      const url = URL.createObjectURL(firstImage);
      return () => URL.revokeObjectURL(url); // cleanup when component unmounts
    }
  }, [post.images]);

  const categoryStyles: Record<string, string> = {
    "Student Essentials": "bg-yellow-300 text-black",
    Gadgets: "bg-blue-400 text-black",
    "Personal Belongings": "bg-purple-300 text-black",
  };

  const typeStyles: Record<string, string> = {
    lost: "bg-red-100 text-red-700",
    found: "bg-green-100 text-green-700",
  };



  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(post);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange?.(post, e.target.value);
  };

  return (
    <div className="bg-white rounded shadow/2 cursor-pointer overflow-hidden hover:shadow-md/5 transition">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="post"
          className="w-full h-85 object-cover lg:h-70"
          onClick={onClick}
        />
      ) : (
        <div className="bg-gray-300 h-60 w-full" onClick={onClick} />
      )}

      <div className="p-3">
        {/* Admin Action Buttons */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-[13px] lg:text-[10px] text-gray-500">
            <span
              className={`capitalize px-2 py-1 rounded-[3px] font-medium ${
                categoryStyles[post.category] || "bg-gray-100 text-gray-700"
              }`}
            >
              {post.category}
            </span>
            <span
              className={`capitalize px-2 py-1 rounded-[3px] font-medium ${
                typeStyles[post.type] || "bg-gray-100 text-gray-700"
              }`}
            >
              {post.type}
            </span>
          </div>
          
                     {/* Admin Controls */}
           <div className="flex gap-2">
             {post.status === 'resolved' && onRevertResolution && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   onRevertResolution(post);
                 }}
                 className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                 title="Revert Resolution - Change back to pending"
               >
                 Revert
               </button>
             )}
                           {post.status === 'unclaimed' && onActivateTicket && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onActivateTicket(post);
                  }}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition"
                  title="Activate - Move back to active status"
                >
                  Activate
                </button>
              )}
             <button
               onClick={handleDelete}
               disabled={isDeleting}
               className={`px-2 py-1 text-xs rounded transition ${
                 isDeleting 
                   ? 'bg-gray-400 cursor-not-allowed' 
                   : 'bg-red-500 hover:bg-red-600 text-white'
               }`}
               title={isDeleting ? "Deleting..." : "Delete Post"}
             >
               {isDeleting ? (
                 <span className="flex items-center gap-1">
                   <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                   </svg>
                   Deleting...
                 </span>
               ) : (
                 'Delete'
               )}
             </button>
           </div>
        </div>

        <h1 className="text-lg font-semibold my-2 truncate max-w-[12rem]" onClick={onClick}>
          {post.title}
        </h1>

        {/* Enhanced User Information */}
        <div className="bg-gray-50 p-2 rounded mb-3">
          <div className="flex items-center gap-2 mb-2">
            <ProfilePicture
              src={post.user?.profilePicture || post.user?.profileImageUrl}
              alt="user profile"
              size="xs"
              priority={false}
            />
            <div>
              <p className="text-xs text-blue-800 font-medium">
                {post.user?.firstName && post.user?.lastName 
                  ? `${post.user.firstName} ${post.user.lastName}` 
                  : post.user?.email 
                  ? post.user.email.split('@')[0] 
                  : 'Unknown User'}
              </p>
              <p className="text-xs text-gray-600">
                ID: {post.user?.studentId || 'N/A'}
              </p>
              <p className="text-xs text-gray-600">
                Contact: {post.user?.contactNum || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Management - Show dropdown only for pending posts, hide for unclaimed and resolved */}
        {post.status === 'pending' && (
          <div className="mb-3">
            <label className="text-xs text-gray-600 block mb-1">Status:</label>
            <select
              value={post.status || 'pending'}
              onChange={handleStatusChange}
              className="text-xs p-1 border rounded bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="pending">Pending</option>
              <option value="unclaimed">Unclaimed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        )}



        <div className="text-sm lg:text-xs flex gap-2">
          {post.location && (
            <p className="font-medium text-black">
              <span className="font-medium">Last seen at </span>
              {post.location}
            </p>
          )}
          {post.createdAt && (
            <p className="text-gray-500 font-inter">
              {formatDateTime(post.createdAt)}
            </p>
          )}
        </div>

        <p
          className="text-xs text-gray-700 mt-2.5"
          dangerouslySetInnerHTML={{
            __html: highlightAndTruncate(post.description, highlightText),
          }}
          onClick={onClick}
        />



        {/* Post ID for admin reference */}
        <div className="mt-2 text-xs text-gray-400">
          Post ID: {post.id}
        </div>
      </div>
    </div>
  );
}

export default memo(AdminPostCard);

import { useEffect, useMemo, memo } from "react";
import type { Post } from "@/types/Post";
import ProfilePicture from "./ProfilePicture";

interface PostCardProps {
  post: Post;
  onClick: () => void;
  highlightText: string;
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

function PostCard({ post, onClick, highlightText }: PostCardProps) {
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

  return (
    <div
      className="bg-white rounded shadow/2 cursor-pointer overflow-hidden hover:shadow-md/5 transition"
      onClick={onClick}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="post"
          className="w-full h-85 object-cover lg:h-70"
        />
      ) : (
        <div className="bg-gray-300 h-60 w-full" />
      )}

      <div className="p-3">
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
          
          {/* Found Action Badge - only show for found items with action */}
          {post.type === "found" && post.foundAction && (
            <span className="px-2 py-1 rounded-[3px] font-medium bg-blue-100 text-blue-700 text-[11px]">
              {post.foundAction === "keep" ? "Keep" : 
               post.foundAction === "turnover to OSA" ? "OSA" : 
               "Campus Security"}
            </span>
          )}
          
          {/* Expiry Countdown Badge */}
          {post.expiryDate && (
            <>
              {(() => {
                try {
                  const now = new Date();
                  let expiry: Date;
                  
                  // Handle Firebase Timestamp
                  if (post.expiryDate && typeof post.expiryDate === 'object' && 'seconds' in post.expiryDate) {
                    // Firebase Timestamp
                    expiry = new Date(post.expiryDate.seconds * 1000);
                  } else if (post.expiryDate instanceof Date) {
                    // Regular Date object
                    expiry = post.expiryDate;
                  } else if (post.expiryDate) {
                    // String or other format
                    expiry = new Date(post.expiryDate);
                  } else {
                    return null;
                  }
                  
                  // Check if date is valid
                  if (isNaN(expiry.getTime())) {
                    return null;
                  }
                  
                  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysLeft <= 0) {
                    return (
                      <span className="capitalize px-2 py-1 rounded-[3px] font-medium bg-red-100 text-red-700">
                        ⚠️ EXPIRED
                      </span>
                    );
                  } else if (daysLeft <= 3) {
                    return (
                      <span className="capitalize px-2 py-1 rounded-[3px] font-medium bg-red-100 text-red-700">
                        ⚠️ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                      </span>
                    );
                  } else if (daysLeft <= 7) {
                    return (
                      <span className="capitalize px-2 py-1 rounded-[3px] font-medium bg-orange-100 text-orange-700">
                        ⚠️ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                      </span>
                    );
                  } else {
                    return (
                      <span className="capitalize px-2 py-1 rounded-[3px] font-medium bg-green-100 text-green-700">
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                      </span>
                    );
                  }
                } catch (error) {
                  console.error('Error calculating days left:', error);
                  return null;
                }
              })()}
            </>
          )}
        </div>

        <h1 className="text-lg font-semibold my-2 truncate max-w-[12rem]">
          {post.title}
        </h1>

        {/* Display the user who created the post */}
        <div className="flex items-center gap-2 mb-2">
          <ProfilePicture
            src={post.user?.profilePicture || post.user?.profileImageUrl}
            alt="user profile"
            size="xs"
            priority={false} // Don't prioritize profile pictures
          />
          <p className="text-xs text-blue-800 font-medium">
            Posted by {post.user?.firstName && post.user?.lastName 
              ? `${post.user.firstName} ${post.user.lastName}` 
              : post.user?.email 
              ? post.user.email.split('@')[0] 
              : 'Unknown User'}
          </p>
        </div>

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
        />



      </div>
    </div>
  );
}

export default memo(PostCard); // ✅ React.memo to prevent re-render unless props change

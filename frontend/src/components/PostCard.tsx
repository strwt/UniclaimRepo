import { useEffect, useMemo, memo } from "react";
import type { Post } from "@/types/Post";

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
        </div>

        <h1 className="text-lg font-semibold my-2 truncate max-w-[12rem]">
          {post.title}
        </h1>

        <div className="text-sm lg:text-xs flex gap-2">
          {post.location && (
            <p className="font-medium text-black">
              <span className="font-medium">Last seen: </span>
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

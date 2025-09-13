import { useState } from "react";
import { postService } from "@/services/firebase/posts";
import { useAuth } from "@/context/AuthContext";
import FlagModal from "./FlagModal";
import { IoFlagOutline } from "react-icons/io5";

interface FlagButtonProps {
  postId: string;
  isFlagged?: boolean;
  flaggedBy?: string;
  onFlagSuccess?: () => void;
  className?: string;
}

export default function FlagButton({
  postId,
  isFlagged = false,
  flaggedBy,
  onFlagSuccess,
  className = "",
}: FlagButtonProps) {
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleFlagClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the post card click
    e.preventDefault(); // Prevent default button behavior
    if (!user) {
      alert("Please log in to flag posts");
      return;
    }
    setShowFlagModal(true);
  };

  const handleFlagSubmit = async (reason: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await postService.flagPost(postId, user.uid, reason);
      setShowFlagModal(false);
      onFlagSuccess?.();
    } catch (error: any) {
      alert(error.message || "Failed to flag post");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user has already flagged this post
  const isAlreadyFlaggedByUser = isFlagged && flaggedBy === user?.uid;

  return (
    <>
      <button
        onClick={handleFlagClick}
        disabled={isAlreadyFlaggedByUser || isLoading}
        className={`
          flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
          transition-colors duration-200
          ${
            isAlreadyFlaggedByUser
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : "bg-red-500 text-white hover:bg-red-700"
          }
          ${className}
        `}
        title={
          isAlreadyFlaggedByUser
            ? "You have already flagged this post"
            : "Flag this post"
        }
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
            <span>Flagging...</span>
          </>
        ) : (
          <>
            <IoFlagOutline className="size-4 stroke-[1px]" />
            <span>{isAlreadyFlaggedByUser ? "Flagged" : "Flag Post"}</span>
          </>
        )}
      </button>

      {showFlagModal && (
        <FlagModal
          onClose={() => setShowFlagModal(false)}
          onSubmit={handleFlagSubmit}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

import { useEffect, useState, useRef } from "react";
import { FiX } from "react-icons/fi";
import type { Post } from "@/types/Post";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMessage } from "@/context/MessageContext";
import ProfilePicture from "./ProfilePicture";
import HandoverDetailsDisplay from "./HandoverDetailsDisplay";
import ClaimDetailsDisplay from "./ClaimDetailsDisplay";

interface PostModalProps {
  post: Post;
  onClose: () => void;
  hideSendMessage?: boolean; // Add optional prop to hide send message button
}

function formatDateTime(datetime: string | Date) {
  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  return date.toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function PostModal({
  post,
  onClose,
  hideSendMessage,
}: PostModalProps) {
  const { userData } = useAuth(); // Get current user data
  const navigate = useNavigate(); // Add navigation hook
  const { createConversation } = useMessage(); // Add message context
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [imageLoadingError, setImageLoadingError] = useState<string | null>(
    null
  );
  const inactivityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTimeRef = useRef<number>(Date.now());

  // Check if current user is the creator of the post
  const isCurrentUserCreator = userData?.uid === post.creatorId;

  const categoryStyles: Record<string, string> = {
    "Student Essentials": "bg-yellow-300 text-black",
    Gadgets: "bg-blue-400 text-black",
    "Personal Belongings": "bg-purple-300 text-black",
  };

  const typeStyles: Record<string, string> = {
    lost: "bg-red-100 text-red-700",
    found: "bg-green-100 text-green-700",
  };

  useEffect(() => {
    // Lock scroll when modal opens
    document.body.style.overflow = "hidden";

    // Clean up: Restore scroll when modal closes
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // show the overlay a couple of seconds if user doesn't click
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const secondsSinceLastClick =
        (now - lastInteractionTimeRef.current) / 1000;

      if (secondsSinceLastClick >= 2) {
        setShowOverlay(true);
      }
    };

    inactivityIntervalRef.current = setInterval(checkInactivity, 1000);

    return () => {
      if (inactivityIntervalRef.current) {
        clearInterval(inactivityIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setImageLoadingError(null);

    try {
      const urls = post.images.map((img) =>
        typeof img === "string" ? img : URL.createObjectURL(img)
      );

      setImageUrls(urls);

      // Remove the problematic timeout that was causing false warnings
      // Images are processed immediately, so no need for a loading timeout

      return () => {
        urls.forEach((url) => {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        });
      };
    } catch (error) {
      console.error("Error processing images:", error);
      setImageLoadingError("Failed to load images");
    }
  }, [post.images]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (inactivityIntervalRef.current) {
        clearInterval(inactivityIntervalRef.current);
      }
    };
  }, []);

  const handleImageClick = () => {
    setShowOverlay(false);
    setHasUserInteracted(true);
    lastInteractionTimeRef.current = Date.now();
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
  };

  // Handle send message button click
  const handleSendMessage = async () => {
    if (!userData) {
      // If user is not logged in, redirect to login
      navigate("/login");
      return;
    }

    if (isCurrentUserCreator) {
      // If user is the creator, show message or redirect to their own posts
      alert("You cannot send a message to yourself. This is your own post.");
      return;
    }

    try {
      setIsCreatingConversation(true);

      // Get the post owner ID - try multiple sources for compatibility
      const postOwnerId = post.creatorId || post.postedById;

      if (!postOwnerId) {
        throw new Error("Cannot identify post owner");
      }

      // Create conversation and get the conversation ID
      const conversationId = await createConversation(
        post.id,
        post.title,
        postOwnerId,
        userData.uid,
        userData,
        post.user // Pass the post owner's user data
      );

      // Close modal and navigate to messages page with the specific conversation
      onClose();
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      alert(`Failed to start conversation: ${error.message}`);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded p-4 shadow w-[25rem] sm:w-[26rem] md:w-[32rem] lg:w-[42rem] xl:w-[60rem] max-w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProfilePicture
              src={post.user?.profilePicture}
              alt="user profile"
              size="md"
            />
            <div className="flex flex-col">
              <p className="text-xs text-gray-500">Posted by:</p>
              <p className="text-sm">
                {post.user?.firstName && post.user?.lastName
                  ? `${post.user.firstName} ${post.user.lastName}`
                  : "Anonymous"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isCurrentUserCreator && !hideSendMessage && (
              <button
                onClick={handleSendMessage}
                disabled={isCreatingConversation}
                className="text-[12px] bg-brand py-2 px-3 rounded cursor-pointer hover:bg-yellow-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-300"
              >
                {isCreatingConversation ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            )}
            <button className="" onClick={onClose}>
              <FiX className="size-5 stroke-[1.5px]" />
            </button>
          </div>
        </div>

        {imageUrls.length > 0 && (
          <div className="mt-4 flex items-center justify-center">
            <div className="relative group w-full max-w-md">
              <img
                src={imageUrls[currentIndex]}
                alt={`Uploaded ${currentIndex + 1}`}
                className="w-full h-auto object-cover rounded cursor-pointer"
                onClick={handleImageClick}
                title="Click to view next image"
              />

              {showOverlay && imageUrls.length > 1 && !hasUserInteracted && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/45 text-white font-semibold text-sm rounded cursor-pointer animate-soft-blink"
                  onClick={handleImageClick}
                >
                  Click to view more images
                </div>
              )}

              <div
                className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full
          block md:hidden
          md:group-hover:block md:pointer-events-none md:select-none"
              >
                {currentIndex + 1}/{imageUrls.length}
              </div>
            </div>
          </div>
        )}

        {/* Image loading error display - only show for actual errors */}
        {imageLoadingError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 text-sm">
                  ⚠️ {imageLoadingError}
                </span>
              </div>
              <button
                onClick={() => {
                  setImageLoadingError(null);
                  // Force re-processing of images
                  const urls = post.images.map((img) =>
                    typeof img === "string" ? img : URL.createObjectURL(img)
                  );
                  setImageUrls(urls);
                }}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="my-3 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-xl font-semibold my-3">{post.title}</h2>

          <div className="flex items-center gap-2 text-[12px]">
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
              <span className="px-2 py-1 rounded-[3px] font-medium bg-blue-100 text-blue-700">
                {post.foundAction === "keep"
                  ? "Keep"
                  : post.foundAction === "turnover to OSA"
                  ? "OSA"
                  : "Campus Security"}
              </span>
            )}

            {/* Status Badge - show when post is resolved or unclaimed */}
            {post.status === "resolved" && (
              <span className="px-2 py-1 rounded-[3px] font-medium bg-green-100 text-green-700">
                ✅ RESOLVED
              </span>
            )}
            {post.status === "unclaimed" && (
              <span className="px-2 py-1 rounded-[3px] font-medium bg-orange-100 text-orange-700">
                ⏰ UNCLAIMED
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:gap-5 lg:grid-cols-2">
          {/* item info */}
          <div className="">
            <p className="text-[13px] mb-2">Date and Time</p>
            <div className="bg-gray-50 border border-gray-400 rounded py-2 px-2">
              {post.createdAt && (
                <p className="text-[13px] text-black">
                  {formatDateTime(post.createdAt)}
                </p>
              )}
            </div>
            <p className="text-[13px] mt-3 mb-2">Item Description</p>
            <div className="bg-gray-50 border border-gray-400 rounded py-2 px-2 h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <p className="text-[13px] text-gray-600">{post.description}</p>
            </div>

            {/* Found Action Information - only show for found items */}
            {post.type === "found" && post.foundAction && (
              <>
                <p className="text-[13px] mt-3 mb-2">Found Item Action</p>
                <div className="bg-blue-50 border border-blue-200 rounded py-2 px-2">
                  <p className="text-[13px] text-blue-700 font-medium">
                    {post.foundAction === "keep"
                      ? "The finder will keep this item and return it themselves"
                      : post.foundAction === "turnover to OSA"
                      ? "This item will be turned over to the OSA office"
                      : "This item will be turned over to Campus Security"}
                  </p>
                </div>
              </>
            )}

            <div className="">
              {post.coordinates && (
                <>
                  <p className="text-[13px] mt-3 mb-2">Pinned Coordinates</p>
                  <div className="bg-gray-50 border border-gray-400 rounded py-2 px-2">
                    <p className="text-[13px] text-gray-600">
                      {post.coordinates.lat.toFixed(5)}{" "}
                      {post.coordinates.lng.toFixed(5)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* location info */}
          <div className="">
            <p className="text-[13px] mt-2">Last seen location</p>
            <div className="bg-gray-50 border border-gray-400 rounded py-2 px-2">
              <p className="text-sm text-gray-700">{post.location}</p>
            </div>
            <p className="text-[13px] mt-3 mb-2">Location</p>
            {post.coordinates && (
              <div className="">
                <iframe
                  title="Map location preview"
                  width="100%"
                  height="284"
                  className="rounded shadow-xs/10"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    post.coordinates.lng - 0.001
                  }%2C${post.coordinates.lat - 0.001}%2C${
                    post.coordinates.lng + 0.001
                  }%2C${post.coordinates.lat + 0.001}&layer=mapnik&marker=${
                    post.coordinates.lat
                  }%2C${post.coordinates.lng}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Show claim details if post is resolved and has claim details */}
        {post.status === "resolved" && post.claimDetails && (
          <ClaimDetailsDisplay
            claimDetails={post.claimDetails}
            conversationData={post.conversationData}
          />
        )}

        {/* Show handover details if post is resolved and no claim details */}
        {post.status === "resolved" &&
          post.handoverDetails &&
          !post.claimDetails && (
            <HandoverDetailsDisplay
              handoverDetails={post.handoverDetails}
              conversationData={post.conversationData}
            />
          )}

        {/* Show turnover information if this post was turned over */}
        {post.turnoverDetails && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-lg">🔄</span>
              <h4 className="text-sm font-semibold text-blue-800">
                Turnover Information
              </h4>
            </div>
            <div className="text-sm text-blue-700 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Originally found by:</span>
                <ProfilePicture
                  src={post.turnoverDetails.originalFinder.profilePicture}
                  alt={`${post.turnoverDetails.originalFinder.firstName} ${post.turnoverDetails.originalFinder.lastName}`}
                  size="sm"
                  className="border-blue-300"
                />
                <span>
                  {post.turnoverDetails.originalFinder.firstName}{" "}
                  {post.turnoverDetails.originalFinder.lastName}
                </span>
              </div>
              <div>
                <span className="font-medium">Student ID:</span>{" "}
                {post.turnoverDetails.originalFinder.studentId || "N/A"}
              </div>
              <div>
                <span className="font-medium">Email:</span>{" "}
                {post.turnoverDetails.originalFinder.email}
              </div>
              {post.turnoverDetails.originalFinder.contactNum && (
                <div>
                  <span className="font-medium">Contact:</span>{" "}
                  {post.turnoverDetails.originalFinder.contactNum}
                </div>
              )}
              <div>
                <span className="font-medium">Turned over to:</span>{" "}
                {post.turnoverDetails.turnoverAction === "turnover to OSA"
                  ? "OSA"
                  : "Campus Security"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

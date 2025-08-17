import { useEffect, useState, useRef } from "react";
import { FiX } from "react-icons/fi";
import type { Post } from "@/types/Post";

interface PostModalProps {
  post: Post;
  onClose: () => void;
}

function formatDateTime(datetime: string | Date) {
  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  return date.toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function PostModal({ post, onClose }: PostModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const inactivityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTimeRef = useRef<number>(Date.now());

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
    const urls = post.images.map((img) =>
      typeof img === "string" ? img : URL.createObjectURL(img)
    );

    setImageUrls(urls);

    return () => {
      urls.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [post.images]);

  const handleImageClick = () => {
    setShowOverlay(false);
    lastInteractionTimeRef.current = Date.now();
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded p-4 shadow w-[25rem] sm:w-[26rem] md:w-[32rem] lg:w-[42rem] xl:w-[60rem] max-w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-xs text-gray-500">Posted by:</p>
            <p className="text-sm">
              {post.user?.firstName && post.user?.lastName
                ? `${post.user.firstName} ${post.user.lastName}`
                : "Anonymous"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-[12px] bg-brand py-2 px-3 rounded cursor-pointer hover:bg-teal-600 text-white">
              Send Message
            </button>
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

              {showOverlay && (
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
      </div>
    </div>
  );
}

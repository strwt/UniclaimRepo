import { FiX } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import type { Post } from "@/types/Post";
import DropdownWithSearch from "./DropdownWithSearch";

// Location options - same as used in mobile version
const locationOptions = [
  "Library",
  "Canteen",
  "Gymnasium",
  "Main Entrance",
  "Computer Laboratory",
  "Science Building",
  "Engineering Hall",
  "Student Lounge",
  "Registrar Office",
  "Clinic",
  "Parking Lot A",
  "Parking Lot B",
  "Auditorium",
  "Basketball Court",
  "Swimming Pool Area",
  "Admin Office",
  "Dormitory",
  "Innovation Hub",
  "Covered Court",
  "Security Office",
];

interface TicketModalProps {
  post: Post;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdatePost: (updatedPost: Post) => void;
  isDeleting?: boolean;
}

const TicketModal = ({
  post,
  onClose,
  onDelete,
  onUpdatePost,
  isDeleting,
}: TicketModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showImgModal, setShowImgModal] = useState(false);
  const [showImgOverlay, setShowImgOverlay] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const inactivityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTimeRef = useRef<number>(Date.now());

  const [editedImages, setEditedImages] = useState<(string | File)[]>(
    post.images
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedDescription, setEditedDescription] = useState(post.description);
  const [editedLocation, setEditedLocation] = useState<string | null>(
    locationOptions.includes(post.location) ? post.location : null
  );
  const [editedDateTime, setEditedDateTime] = useState(
    typeof post.createdAt === "string"
      ? post.createdAt.slice(0, 16)
      : new Date(post.createdAt || "").toISOString().slice(0, 16)
  );

  // Prevent editing resolved posts
  const handleEditClick = () => {
    if (post.status === "resolved") {
      return; // Do nothing for resolved posts
    }
    setIsEditing(true);
  };

  // Reset form when post changes
  useEffect(() => {
    setEditedTitle(post.title);
    setEditedDescription(post.description);
    setEditedLocation(
      locationOptions.includes(post.location) ? post.location : null
    );
    setEditedImages(post.images);
    setNewImageFiles([]);

    // Prevent editing state for resolved posts
    if (post.status === "resolved") {
      setIsEditing(false);
    }
  }, [post]);

  // Show the overlay after a couple of seconds if user doesn't click
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (inactivityIntervalRef.current) {
        clearInterval(inactivityIntervalRef.current);
      }
    };
  }, []);

  const previewImages = editedImages.map((img) =>
    typeof img === "string" ? img : URL.createObjectURL(img)
  );

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev + 1) % previewImages.length);
  };

  const handleImageClick = () => {
    setShowOverlay(false);
    setHasUserInteracted(true);
    lastInteractionTimeRef.current = Date.now();
    setCurrentImageIdx((prev) => (prev + 1) % previewImages.length);
  };

  const handleDeleteImage = (index: number) => {
    // Prevent deletion if this is the last image
    if (editedImages.length <= 1) {
      return; // Don't allow deletion of the last image
    }

    const updated = [...editedImages];
    updated.splice(index, 1);
    setEditedImages(updated);
  };

  const handleUploadMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (editedImages.length + files.length > 3) {
      alert("You can only upload up to 3 images.");
      return;
    }
    setEditedImages([...editedImages, ...files]);
    setNewImageFiles([...newImageFiles, ...files]);
  };

  const handleSaveImages = () => {
    setShowImgModal(false);
  };

  const handleSaveEdits = () => {
    const updatedPost: Post = {
      ...post,
      title: editedTitle,
      description: editedDescription,
      location: editedLocation || "",
      status: post.status, // Keep original status - users cannot change it
      createdAt: editedDateTime,
      images: editedImages,
    };

    onUpdatePost(updatedPost);
    setIsEditing(false);
  };

  const inputFields = [
    {
      type: "text",
      value: editedTitle,
      placeholder: "Title",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setEditedTitle(e.target.value),
    },
    {
      type: "datetime-local",
      value: editedDateTime,
      placeholder: "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setEditedDateTime(e.target.value),
    },
  ];

  // Status field removed - users cannot change ticket status

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded p-4 shadow w-[25rem] sm:w-[26rem] md:w-[32rem] lg:w-[42rem] xl:w-[60rem] max-w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center rounded mb-5">
          <h2 className="text-lg font-semibold">{post.title}</h2>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white text-xs px-3 p-2 rounded hover:bg-gray-600"
                >
                  Cancel Edit
                </button>
                <button
                  onClick={handleSaveEdits}
                  className="bg-green-600 text-white text-xs px-3 p-2 rounded hover:bg-green-500"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                {/* Prevent editing/deleting resolved posts */}
                {post.status === "resolved" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded">
                      ✅ Handover completed - cannot edit or delete
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="bg-brand text-white text-xs px-3 p-2 rounded hover:bg-teal-600"
                    >
                      Edit Ticket
                    </button>
                    <button
                      onClick={() => onDelete(post.id)}
                      disabled={isDeleting}
                      className="bg-[#FD8E74] text-white text-xs px-3 p-2 rounded hover:bg-[#c07c6d] disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`Delete ticket "${post.title}" and ${
                        post.images.length
                      } associated image${post.images.length !== 1 ? "s" : ""}`}
                    >
                      {isDeleting ? "Deleting..." : "Delete Ticket"}
                    </button>
                  </>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="text-black lg:text-gray-600 lg:hover:text-black"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Image Preview */}
        <div
          className="relative w-full flex flex-col justify-center items-center overflow-hidden"
          onClick={() => {
            if (!isEditing && previewImages.length > 1) {
              handleImageClick();
            } else if (isEditing) {
              setShowImgModal(true);
            }
          }}
        >
          {previewImages.length > 0 ? (
            <div className="flex items-center justify-center">
              <div className="relative group w-full max-w-md">
                <img
                  src={previewImages[currentImageIdx]}
                  className="w-full h-auto object-cover rounded cursor-pointer"
                  alt={`Image ${currentImageIdx + 1}`}
                  title="Click to view next image"
                />
                {showOverlay &&
                  previewImages.length > 1 &&
                  !hasUserInteracted &&
                  !isEditing && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center rounded animate-soft-blink">
                      <p className="text-white text-sm px-3 py-1">
                        Click to view more images
                      </p>
                    </div>
                  )}
                {/* Image Counter - shows current position and total images */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIdx + 1}/{previewImages.length}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No image uploaded</p>
          )}

          {isEditing && (
            <button className="text-sm bg-brand text-white w-full max-w-md my-3 p-2 rounded">
              Edit uploaded images
            </button>
          )}
        </div>

        {/* Found Action Badge - only show for found items */}
        {post.type === "found" && post.foundAction && (
          <div className="mt-4 flex justify-center">
            <span className="px-3 py-2 rounded-md font-medium bg-blue-100 text-blue-700 text-sm">
              {post.foundAction === "keep"
                ? "Keep"
                : post.foundAction === "turnover to OSA"
                ? "Turnover to OSA"
                : "Turnover to Campus Security"}
            </span>
          </div>
        )}

        {/* Info Section */}
        <div className="space-y-2 mt-5">
          {isEditing ? (
            <>
              <h1 className="text-sm">Information of an item</h1>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {inputFields.map((field, idx) => (
                  <input
                    key={idx}
                    type={field.type}
                    value={field.value}
                    placeholder={field.placeholder}
                    onChange={field.onChange}
                    className="w-full border px-3 py-1 rounded"
                  />
                ))}

                {/* Location Dropdown */}
                <div className="col-span-full">
                  <DropdownWithSearch
                    label="Last seen location"
                    data={locationOptions}
                    selected={editedLocation}
                    setSelected={setEditedLocation}
                    placeholder="Select a location"
                  />
                </div>

                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full border px-3 py-1 rounded col-span-full"
                  placeholder="Description"
                />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-base mt-5">Information of an item</h1>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <h1 className="text-sm mb-2">Title</h1>
                  <div className="bg-gray-100 p-2 rounded border-gray-300">
                    <p className="text-[12px]">{post.title}</p>
                  </div>
                  <h1 className="text-sm mb-2">Date and Time</h1>
                  <div className="bg-gray-100 p-2 rounded border-gray-300">
                    <p className="text-[12px]">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                  <h1 className="text-sm mb-2">Last seen location</h1>
                  <div className="bg-gray-100 p-2 rounded border-gray-300">
                    <p className="text-[12px]">{post.location}</p>
                  </div>
                </div>
                <div>
                  <h1 className="text-sm mb-2">Description</h1>
                  <div className="bg-gray-100 p-2 lg:h-44 rounded border-gray-300">
                    <p className="text-[12px]">{post.description}</p>
                  </div>

                  {/* Found Action Information - only show for found items */}
                  {post.type === "found" && post.foundAction && (
                    <>
                      <h1 className="text-sm mt-3 mb-2">Found Item Action</h1>
                      <div className="bg-blue-100 p-2 rounded border-blue-300">
                        <p className="text-[12px] text-blue-700 font-medium">
                          {post.foundAction === "keep"
                            ? "The finder will keep this item and return it themselves"
                            : post.foundAction === "turnover to OSA"
                            ? "This item will be turned over to the OSA office"
                            : "This item will be turned over to Campus Security"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <h1 className="text-sm mt-7">Contact Details</h1>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <h1 className="text-sm mb-2">Name</h1>
                  <div className="bg-gray-100 p-2 rounded border-gray-300">
                    <p className="text-[12px]">
                      {post.user?.firstName ?? ""} {post.user?.lastName ?? ""}
                    </p>
                  </div>
                  <h1 className="text-sm mb-2">Email</h1>
                  <div className="bg-gray-100 p-2 rounded border-gray-300">
                    <p className="text-[12px]">{post.user?.email}</p>
                  </div>
                  <h1 className="text-sm mb-2">Contact Number</h1>
                  <div className="bg-gray-100 p-2 rounded border-gray-300">
                    <p className="text-[12px]">{post.user?.contactNum}</p>
                  </div>
                </div>
                <div>
                  <h1 className="text-sm mb-2">Ticket Status</h1>
                  <div className="bg-gray-100 p-2 rounded border-gray-300">
                    <p className="text-[12px] capitalize">
                      {post.status || "pending"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Overlay */}
      {showImgOverlay && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => {
            handleNextImage();
            setHasUserInteracted(true);
            lastInteractionTimeRef.current = Date.now();
          }}
        >
          <div className="relative max-w-3xl w-full p-6">
            <img
              src={previewImages[currentImageIdx]}
              alt="Overlay View"
              className="max-h-[90vh] mx-auto object-contain rounded"
            />
            <p className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded text-sm">
              Click image to view next
            </p>
            <button
              className="absolute top-4 right-6 text-white text-xl"
              onClick={(e) => {
                e.stopPropagation();
                setShowImgOverlay(false);
              }}
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      {/* Edit Image Modal */}
      {isEditing && showImgModal && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex justify-center items-center"
          onClick={() => setShowImgModal(false)}
        >
          <div
            className="bg-white rounded p-4 max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-lg font-semibold mb-2">
              Edit Uploaded Images
            </h2>
            {/* Image Counter for editing modal */}
            <div className="text-center text-sm text-gray-600 mb-4">
              {editedImages.length}/3 photos selected
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {previewImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`Uploaded ${idx}`}
                    className="object-contain max-h-60 w-full rounded"
                  />
                  <button
                    className={`absolute top-1 right-1 p-1 rounded transition-all ${
                      editedImages.length <= 1
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                    }`}
                    onClick={() => handleDeleteImage(idx)}
                    disabled={editedImages.length <= 1}
                    title={
                      editedImages.length <= 1
                        ? "Posts must have at least one image"
                        : "Delete image"
                    }
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Helpful message when only one image remains */}
            {editedImages.length <= 1 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 text-sm">ℹ️</span>
                  <span className="text-blue-700 text-sm font-medium">
                    Posts must have at least one image. To replace this image,
                    upload a new one first.
                  </span>
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadMore}
              className="mt-4"
            />

            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                onClick={handleSaveImages}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketModal;

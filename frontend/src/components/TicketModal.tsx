import { FiX } from "react-icons/fi";
import { useState } from "react";
import type { Post } from "@/types/Post";

interface TicketModalProps {
  post: Post;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdatePost: (updatedPost: Post) => void;
}

const TicketModal = ({
  post,
  onClose,
  onDelete,
  onUpdatePost,
}: TicketModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showImgModal, setShowImgModal] = useState(false);
  const [showImgOverlay, setShowImgOverlay] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const [editedImages, setEditedImages] = useState<(string | File)[]>(
    post.images
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedDescription, setEditedDescription] = useState(post.description);
  const [editedLocation, setEditedLocation] = useState(post.location);
  const [editedStatus, setEditedStatus] = useState<
    "pending" | "resolved" | "rejected"
  >(post.status || "pending");
  const [editedDateTime, setEditedDateTime] = useState(
    typeof post.createdAt === "string"
      ? post.createdAt.slice(0, 16)
      : new Date(post.createdAt || "").toISOString().slice(0, 16)
  );

  const previewImages = editedImages.map((img) =>
    typeof img === "string" ? img : URL.createObjectURL(img)
  );

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev + 1) % previewImages.length);
  };

  const handleDeleteImage = (index: number) => {
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
      location: editedLocation,
      status: editedStatus,
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

  const selectFields = [
    {
      value: editedLocation,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
        setEditedLocation(e.target.value),
      options: ["", "Gate A", "Canteen", "Library"],
      label: "Location",
    },
    {
      value: editedStatus,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
        setEditedStatus(e.target.value as "pending" | "resolved" | "rejected"),
      options: ["pending", "resolved", "rejected"],
      label: "Status",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
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
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-brand text-white text-xs px-3 p-2 rounded hover:bg-teal-600"
                >
                  Edit Ticket
                </button>
                <button
                  onClick={() => onDelete(post.id)}
                  className="bg-[#FD8E74] text-white text-xs px-3 p-2 rounded hover:bg-[#c07c6d]"
                >
                  Delete Ticket
                </button>
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
              setCurrentImageIdx((prev) => (prev + 1) % previewImages.length);
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
                />
                {!isEditing && previewImages.length > 1 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded animate-soft-blink">
                    <p className="text-white text-sm px-3 py-1">
                      Click image to view next
                    </p>
                  </div>
                )}
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

                {selectFields.map((field, idx) => (
                  <select
                    key={idx}
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full border px-3 py-1 rounded"
                  >
                    {field.options.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt === "" ? `Select ${field.label}` : opt}
                      </option>
                    ))}
                  </select>
                ))}

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
          onClick={() => handleNextImage()}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {previewImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`Uploaded ${idx}`}
                    className="object-contain max-h-60 w-full rounded"
                  />
                  <button
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded"
                    onClick={() => handleDeleteImage(idx)}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadMore}
              className="mt-4"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                onClick={() => setEditedImages([])}
              >
                Delete All
              </button>
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

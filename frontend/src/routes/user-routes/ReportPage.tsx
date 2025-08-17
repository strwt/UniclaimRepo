// src/pages/ReportPage.tsx
import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import MobileNavText from "@/components/NavHeadComp";
import { useToast } from "@/context/ToastContext";
import ItemInfoForm from "@/components/ItemInfoForm";
import SuccessPic from "@/assets/success.png";
// import { useNavigate } from "react-router-dom";
import type { Post } from "@/types/Post";

// screens
import LocationForm from "@/routes/user-routes/LocationReport";
import ContactDetails from "@/routes/user-routes/ContactDetails";
import useToastFormHelper from "@/components/ToastFormHelper";
import type { User } from "@/types/User";

interface ReportProp {
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  currentUser: User;
}

const categories = ["Student Essentials", "Gadgets", "Personal Belongings"];

export default function ReportPage({ setPosts, currentUser }: ReportProp) {
  const [selectedReport, setSelectedReport] = useState<"lost" | "found" | null>(
    null
  );

  // Add near the other useState hooks:
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const { validateFormErrors } = useToastFormHelper();
  const [selectedLocation, setSelectedLocation] = useState("");
  const { showToast } = useToast();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (showSuccessModal) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [showSuccessModal]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalFiles = selectedFiles.length + files.length;

    if (totalFiles > 3) {
      showToast(
        "error",
        "Upload limit reached",
        "You can only upload up to 3 images only.",
        8000
      );
      return;
    }

    const newValidFiles: File[] = [];
    files.forEach((file) => {
      const isDuplicate = selectedFiles.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (isDuplicate) {
        showToast(
          "error",
          "Duplicate Image",
          `The image "${file.name}" has already been uploaded. (${Date.now()})`
        );
      } else {
        newValidFiles.push(file);
      }
    });

    const updatedFiles = [...selectedFiles, ...newValidFiles].slice(0, 3);
    setSelectedFiles(updatedFiles);
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== name));
  };

  const handleReportClick = (type: "lost" | "found") => {
    if (selectedReport === type) {
      setSelectedReport(null); // 👈 deselect if same type is clicked again
    } else {
      setSelectedReport(type);
    }
    setWasSubmitted(false);
  };

  // Reset red borders when user types in title or description
  useEffect(() => {
    if (title || description) setWasSubmitted(false);
  }, [title, description]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setWasSubmitted(true);

    const errors = {
      hasReportTypeError: !selectedReport,
      hasTitleError: !title.trim(),
      hasCategoryError: !activeCategory,
      hasDescriptionError: !description.trim(),
      hasDateTimeError: !selectedDateTime.trim(),
      hasImageError: selectedFiles.length === 0,
      hasLocationError: !selectedLocation.trim(),
      hasCoordinatesError: !coordinates,
    };

    const hasError = validateFormErrors(errors);
    if (hasError) return;

    // ✅ Type narrowing to satisfy Post.type
    if (selectedReport !== "lost" && selectedReport !== "found") {
      showToast(
        "error",
        "Report type missing",
        "Please select Lost or Found item"
      );
      return;
    }

    // if (!userInfo) {
    //   showToast("error", "User missing", "User information is not loaded yet.");
    //   return;
    // }

    const createdPost: Post = {
      id: `${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category: activeCategory,
      location: selectedLocation,
      type: selectedReport,
      coordinates: coordinates ?? undefined,
      images: selectedFiles,
      createdAt: new Date().toISOString(),
      user: {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        contactNum: currentUser.contactNum,
      },
      status: "pending",
    };

    setPosts((prev) => [...prev, createdPost]);
    setTitle("");
    setDescription("");
    setSelectedReport(null);
    setSelectedLocation("");
    setCoordinates(null);
    setActiveCategory("");
    setSelectedDateTime("");
    setSelectedFiles([]);
    setWasSubmitted(false);
    setShowSuccessModal(true);
  };

  // compute errors during render
  const showTitleError = wasSubmitted && !title.trim();
  const showDescriptionError = wasSubmitted && !description.trim();
  const showDateTimeError = wasSubmitted && !selectedDateTime.trim();
  const showImageError = wasSubmitted && selectedFiles.length === 0;
  const showLocationError = wasSubmitted && !selectedLocation.trim();

  return (
    <section>
      <MobileNavText
        title="Report an item"
        description="Report a lost or found item"
      />

      <div className="hidden lg:flex lg:items-center lg:justify-between lg:mx-6 lg:pt-4">
        <h1 className="font-medium">Report an item</h1>
        <p className="text-sm text-gray-500">
          Report a lost or found item here.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <h1 className="mx-4 pt-4 font-medium lg:mx-6">
            Status of the item
            <span className="text-red-500 ml-1">*</span>
          </h1>
          <div className="flex gap-3 mt-4 mx-4 lg:mx-6">
            <button
              type="button"
              className={`p-2 w-full lg:max-w-[12rem] rounded text-md font-medium transition-colors duration-200 ${
                selectedReport === "lost"
                  ? "bg-navyblue text-white"
                  : "bg-gray-200 text-black hover:bg-blue-300 hover:text-black"
              }`}
              onClick={() => handleReportClick("lost")}
            >
              <span className="flex items-center justify-center gap-1">
                Lost Item
                {selectedReport === "lost" && (
                  <FiX className="w-4 h-4 text-white" />
                )}
              </span>
            </button>

            <button
              type="button"
              className={`p-2 w-full lg:max-w-[12rem] rounded text-md font-medium transition-colors duration-200 ${
                selectedReport === "found"
                  ? "bg-navyblue text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-blue-300 hover:text-black"
              }`}
              onClick={() => handleReportClick("found")}
            >
              <span className="flex items-center justify-center gap-1">
                Found Item
                {selectedReport === "found" && (
                  <FiX className="w-4 h-4 text-white" />
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="bg-gray-300 h-[1px] mx-4 mt-5 lg:mx-6" />

        <h1 className="mx-4 mt-4 font-medium lg:mx-6">
          Information of the item
          <span className="text-red-500 ml-1">*</span>
        </h1>

        <div className="mx-4 mt-4 lg:mx-6">
          <ItemInfoForm
            titleError={showTitleError}
            descriptionError={showDescriptionError}
            dateTimeError={showDateTimeError}
            imageError={showImageError}
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={(category) => {
              setActiveCategory(category);
              setWasSubmitted(false);
            }}
            selectedDateTime={selectedDateTime}
            setSelectedDateTime={setSelectedDateTime}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            showModal={showModal}
            setShowModal={setShowModal}
            fileInputRef={fileInputRef}
            modalInputRef={modalInputRef}
            handleFileChange={handleFileChange}
            removeFile={removeFile}
            title={title}
            setTitle={(val) => {
              setTitle(val);
              setWasSubmitted(false);
            }}
            description={description}
            setDescription={(val) => {
              setDescription(val);
              setWasSubmitted(false);
            }}
          />
        </div>

        <div className="bg-gray-300 h-[1px] mx-4 mt-5 lg:mx-6" />

        <div className="grid mx-4 mt-4 grid-cols-1 gap-3 lg:mx-6 lg:grid-cols-2 lg:gap-8">
          <LocationForm
            selectedLocation={selectedLocation}
            setSelectedLocation={(val) => {
              setSelectedLocation(val);
              setWasSubmitted(false); // ✅ clear error feedback after location change
            }}
            locationError={showLocationError}
            coordinates={coordinates}
            setCoordinates={(val) => {
              setCoordinates(val);
              setWasSubmitted(false); // ✅ clear error feedback after map pin drop
            }}
          />

          <ContactDetails setUser={() => {}} user={currentUser} />
        </div>

        <div className="mx-4 mt-5">
          <div className="text-center mt-5 mb-3">
            <h2 className="text-blue-500 text-[13px]">
              <strong>Note:</strong> Ticket will expire within 30 days if not
              found.
            </h2>
          </div>
          <button
            type="submit"
            className="w-full text-white rounded bg-brand p-3 block cursor-pointer hover:bg-teal-600"
          >
            Submit report
          </button>
        </div>
      </form>
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 bg-opacity-40">
          <div className="flex flex-col items-center justify-center text-center bg-white rounded p-5 w-90 max-w-lg">
            <img src={SuccessPic} alt="success_img" className="size-40" />
            <h1 className="text-medium text-xl text-[#39B54A] mb-5">
              Successfully added report!
            </h1>
            <p className="text-[12px] mb-5">
              Your report has been added successfully. You can manage your post
              in the my tickets dashboard
            </p>
            <div className="h-1 my-5 rounded w-60 bg-[#39B54A]"></div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 text-sm w-full bg-[#39B54A] hover:bg-green-700 text-white p-2 rounded transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

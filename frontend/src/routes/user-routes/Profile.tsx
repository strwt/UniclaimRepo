import MobileNavInfo from "@/components/NavHeadComp";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { profileUpdateService } from "@/utils/profileUpdateService";
import { cloudinaryService } from "@/utils/cloudinary";
import { imageService } from "@/utils/firebase";
import ProfilePicture from "@/components/ProfilePicture";
import { validateProfilePicture, getRecommendedDimensionsText } from "@/utils/profilePictureUtils";

const Profile = () => {
  const { userData, loading } = useAuth();
  const { showToast } = useToast();
  const [isEdit, setIsEdit] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Firebase user data or fallback to empty strings
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    studentId: "",
    profilePicture: "",
  });

  const [initialUserInfo, setInitialUserInfo] = useState(userInfo);

  // Update local state when Firebase data loads
  useEffect(() => {
    if (userData) {
      const updatedInfo = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        contact: userData.contactNum || "",
        studentId: userData.studentId || "",
        profilePicture: userData.profilePicture || "",
      };
      setUserInfo(updatedInfo);
      setInitialUserInfo(updatedInfo);
    }
  }, [userData]);

  const handleCancel = () => {
    setUserInfo(initialUserInfo);
    setIsEdit(false);
  };

  const handleEdit = () => {
    setInitialUserInfo(userInfo); // snapshot of current state
    setIsEdit(true);
  };

  const handleChange = (field: string, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file using utility function
    const validation = validateProfilePicture(file);
    if (!validation.isValid) {
      showToast("error", "Invalid File", validation.error || "Please select a valid image file.");
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // Show upload progress
      showToast("info", "Uploading...", "Please wait while we upload your profile picture.");
      
      // Upload to Cloudinary
      const imageUrls = await cloudinaryService.uploadImages([file], 'profiles');
      const newProfilePictureUrl = imageUrls[0];
      
      // Update local state
      setUserInfo(prev => ({ ...prev, profilePicture: newProfilePictureUrl }));
      
      showToast("success", "Profile Picture Updated", "Your profile picture has been uploaded successfully!");
      
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      showToast("error", "Upload Failed", error.message || "Failed to upload profile picture. Please try again.");
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setIsRemovingImage(true);
      
      // Store the current profile picture URL before removing it
      const currentProfilePicture = userInfo.profilePicture;
      
      // Update local state immediately for better UX
      setUserInfo(prev => ({ ...prev, profilePicture: "" }));
      
      // If there's a profile picture URL, delete it from Cloudinary using image service
      if (currentProfilePicture && currentProfilePicture !== "") {
        try {
          // Use the image service to delete the profile picture and update user profile
          await imageService.deleteProfilePicture(currentProfilePicture, userData?.uid);
          
          // Update the user's profile in Firestore to remove the profile picture URL
          if (userData?.uid) {
            try {
              await profileUpdateService.updateAllUserData(userData.uid, {
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                contactNum: userInfo.contact,
                studentId: userInfo.studentId,
                profilePicture: "", // Remove profile picture URL
              });
            } catch (updateError: any) {
              console.error("Failed to update user profile in Firestore:", updateError.message);
              // Don't fail the deletion - image was removed from Cloudinary successfully
            }
          }
          
          showToast("success", "Profile Picture Removed", "Your profile picture has been removed from storage and your profile.");
        } catch (cloudinaryError: any) {
          // If Cloudinary deletion fails, still remove it locally but show a warning
          console.error("Failed to delete image from Cloudinary:", cloudinaryError);
          showToast("warning", "Partial Removal", "Profile picture removed from profile, but there was an issue deleting it from storage. You may need to remove it manually later.");
        }
      } else {
        showToast("info", "Profile Picture Removed", "Your profile picture has been removed.");
      }
    } catch (error: any) {
      console.error("Error removing profile picture:", error);
      showToast("error", "Removal Failed", "Failed to remove profile picture. Please try again.");
      
      // Revert the local state change if there was an error
      setUserInfo(prev => ({ ...prev, profilePicture: initialUserInfo.profilePicture }));
    } finally {
      setIsRemovingImage(false);
    }
  };

  const handleSave = async () => {
    const { firstName, lastName, contact, studentId } = userInfo;

    // Check if any field is empty
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !contact.trim() ||
      !studentId.trim()
    ) {
      showToast(
        "warning",
        "Save without data in your profile",
        "Please fill in all fields before saving your profile."
      );
      return;
    }

    // Check if values actually changed
    const isChanged =
      firstName !== initialUserInfo.firstName ||
      lastName !== initialUserInfo.lastName ||
      contact !== initialUserInfo.contact ||
      studentId !== initialUserInfo.studentId ||
      userInfo.profilePicture !== initialUserInfo.profilePicture;

    if (!isChanged) {
      showToast(
        "info",
        "No Changes Made",
        "Your profile is already up to date."
      );
      setIsEdit(false);
      return;
    }

    // Update all user data across collections
    try {
      setIsUpdating(true);
      
      if (userData?.uid) {
        // Use the new profile update service to update everything
        await profileUpdateService.updateAllUserData(userData.uid, {
          firstName,
          lastName,
          contactNum: contact,
          studentId,
          profilePicture: userInfo.profilePicture,
        });

        // Update local state
        setInitialUserInfo(userInfo);
        
        showToast(
          "success",
          "Profile Updated Successfully!",
          "Your profile and all related information have been updated across the app."
        );
        setIsEdit(false);
      }
    } catch (error: any) {
      showToast(
        "error",
        "Update Failed",
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  // Show error if no user data
  if (!userData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">Unable to load profile data</p>
      </div>
    );
  }

  return (
    <>
      <div className="lg:pt-1">
        <MobileNavInfo
          title="My Profile"
          description="Your info all in one place"
        />

        {/* profile icon */}
        <div className="relative bg-gray-200 h-45 mx-4 mt-4 rounded lg:h-50 lg:mx-6">
          <div className="absolute flex gap-8 -bottom-20 z-10 left-4 md:-bottom-25 lg:-bottom-30">
            <div className="relative">
              <ProfilePicture
                src={userInfo.profilePicture}
                alt="profile"
                size="5xl"
                className="lg:left-6"
                priority={true}
              />
              {isEdit && (
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="bg-navyblue text-white rounded-full p-2 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title="Upload new profile picture"
                  >
                    {isUploadingImage ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                  {userInfo.profilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      disabled={isRemovingImage}
                      className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed"
                      title="Remove profile picture"
                    >
                      {isRemovingImage ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </div>
            <div className="hidden space-y-2 md:block mt-16 md:mt-15 md:space-y-1">
              <h1 className="text-2xl font-semibold md:text-xl lg:text-2xl">
                {userInfo.firstName} <span></span> {userInfo.lastName}
              </h1>
              <p className="text-gray-600">Student ID: {userInfo.studentId}</p>
            </div>
          </div>
        </div>

        {/* button group */}
        <div className="mx-4 text-right lg:mx-6 mt-5">
          {!isEdit ? (
            <button
              onClick={handleEdit}
              className="bg-navyblue border border-navyblue mr-4 px-4 text-xs sm:text-sm md:text-base py-2 text-white rounded-sm lg:mr-6"
            >
              Edit Profile
            </button>
          ) : (
            <div className="">
              <button
                onClick={handleCancel}
                className="border border-navyblue px-3 mr-3 text-xs sm:text-sm md:text-base py-2 text-gray-800 rounded-sm"
              >
                Cancel edit
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className={`border border-navyblue mr-4 px-5 text-xs sm:text-sm md:text-base py-2 text-white rounded-sm lg:mr-6 ${
                  isUpdating ? 'bg-gray-400 cursor-not-allowed' : 'bg-navyblue hover:bg-blue-700'
                }`}
              >
                {isUpdating ? 'Updating...' : 'Save edit'}
              </button>
            </div>
          )}
        </div>

        <div className="mx-9 mt-13 space-y-2 lg:mx-6 md:hidden">
          <h1 className="text-xl font-semibold">
            {userInfo.firstName} {userInfo.lastName}
          </h1>
          <p className="text-sm text-gray-600">Student ID: {userInfo.studentId}</p>
        </div>

        {/* account details */}
        <div className="mx-7 mt-10 md:mt-20 lg:mt-25">
          <h1 className="text-[16px] lg:text-base my-5">Account Details</h1>
          
          {/* Profile Picture Section */}
          <div className="mb-6">
            <div className="bg-gray-100 border border-gray-700 rounded px-4 py-2.5">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-sm text-gray-600">Profile Picture</h1>
                {isEdit ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 text-sm max-w-xs truncate">
                      {userInfo.profilePicture ? "Image uploaded" : "No image"}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="bg-navyblue text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isUploadingImage ? "Uploading..." : "Change"}
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-800 text-sm">
                    {userInfo.profilePicture ? "Image uploaded" : "No image"}
                  </span>
                )}
              </div>
              {isEdit && (
                <div className="text-xs text-gray-500 mt-2">
                  <p>Recommended: {getRecommendedDimensionsText()}</p>
                  <p>Max size: 5MB • Formats: JPEG, PNG, WebP</p>
                </div>
              )}
            </div>
          </div>
          
          {/* read-only inputs and edit inputs */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              {/* First Name */}
              <div className="bg-gray-100 border border-gray-700 flex items-center justify-between rounded px-4 py-2.5">
                <h1 className="text-sm text-gray-600">First Name</h1>
                {isEdit ? (
                  <input
                    type="text"
                    value={userInfo.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="w-60 max-w-sm bg-white border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                ) : (
                  <span className="text-gray-800 text-sm">
                    {userInfo.firstName}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="bg-gray-100 border border-gray-700 flex items-center justify-between  rounded px-4 py-2.5">
                <h1 className="text-sm text-gray-600">Email</h1>
                <span className="text-gray-800 text-sm">
                  {userInfo.email}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {/* Last Name */}
              <div className="bg-gray-100 border border-gray-700 flex items-center justify-between  rounded px-4 py-2.5">
                <h1 className="text-sm text-gray-600">Last Name</h1>
                {isEdit ? (
                  <input
                    type="text"
                    value={userInfo.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="w-60 max-w-sm bg-white border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                ) : (
                  <span className="text-gray-800 text-sm">
                    {userInfo.lastName}
                  </span>
                )}
              </div>

              {/* Contact Number */}
              <div className="bg-gray-100 border border-gray-700 flex items-center justify-between  rounded px-4 py-2.5">
                <h1 className="text-sm text-gray-600">Contact Number</h1>
                {isEdit ? (
                  <input
                    type="text"
                    value={userInfo.contact}
                    onChange={(e) => handleChange("contact", e.target.value)}
                    className="w-60 max-w-sm bg-white border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                ) : (
                  <span className="text-gray-800 text-sm">
                    {userInfo.contact}
                  </span>
                )}
              </div>

              {/* Student ID */}
              <div className="bg-gray-100 border border-gray-700 flex items-center justify-between  rounded px-4 py-2.5">
                <h1 className="text-sm text-gray-600">Student ID</h1>
                {isEdit ? (
                  <input
                    type="text"
                    value={userInfo.studentId}
                    onChange={(e) => handleChange("studentId", e.target.value)}
                    className="w-60 max-w-sm bg-white border border-gray-300 rounded px-3 py-1.5 text-sm"
                    placeholder="10 digits"
                  />
                ) : (
                  <span className="text-gray-800 text-sm">
                    {userInfo.studentId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

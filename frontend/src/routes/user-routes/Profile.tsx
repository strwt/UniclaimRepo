import MobileNavInfo from "@/components/NavHeadComp";
import EmptyProfile from "@/assets/empty_profile.jpg";
import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/utils/firebase";

const Profile = () => {
  const { userData, loading } = useAuth();
  const [isEdit, setIsEdit] = useState(false);

  // Use Firebase user data or fallback to empty strings
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    studentId: "",
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

  const { showToast } = useToast();

  const handleSave = async () => {
    const { firstName, lastName, email, contact, studentId } = userInfo;

    // Check if any field is empty
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
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
      email !== initialUserInfo.email ||
      contact !== initialUserInfo.contact ||
      studentId !== initialUserInfo.studentId;

    if (!isChanged) {
      showToast(
        "info",
        "No Changes Made",
        "Your profile is already up to date."
      );
      setIsEdit(false);
      return;
    }

    // Update Firebase with new data
    try {
      if (userData?.uid) {
        await authService.updateUserData(userData.uid, {
          firstName,
          lastName,
          email,
          contactNum: contact,
          studentId,
        });

        // Update local state
        setInitialUserInfo(userInfo);
        
        showToast(
          "success",
          "Profile Updated",
          "You have updated your profile successfully!"
        );
        setIsEdit(false);
      }
    } catch (error: any) {
      showToast(
        "error",
        "Update Failed",
        error.message || "Failed to update profile. Please try again."
      );
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
            <img
              src={EmptyProfile}
              alt="empty_profile"
              className="rounded-full size-30 md:size-35 lg:size-40 lg:left-6"
            />
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
                className="bg-navyblue border border-navyblue  mr-4 px-5 text-xs sm:text-sm md:text-base py-2 text-white rounded-sm lg:mr-6"
              >
                Save edit
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
                {isEdit ? (
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-60 max-w-sm bg-white border border-gray-300 rounded px-3 py-1.5 text-sm "
                  />
                ) : (
                  <span className="text-gray-800 text-sm">
                    {userInfo.email}
                  </span>
                )}
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

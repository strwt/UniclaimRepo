import {
  HiOutlineMenuAlt2,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineX,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { IoLogOutOutline } from "react-icons/io5";
import Logo from "../assets/uniclaim_logo.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProfilePicture from "@/components/ProfilePicture";

interface AdminHeaderProps {
  sideNavClick: () => void;
  sideBarOpen: boolean;
}

export default function AdminHeader({
  sideBarOpen,
  sideNavClick,
}: AdminHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const toggleProfileMenu = () => setShowProfileMenu((prev) => !prev);
  const toggleNotif = () => setShowNotif((prev) => !prev);

  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    navigate("/admin/profile");
  };

  const handleUserView = () => {
    navigate("/");
  };

  return (
    <>
      <div className="">
        {/* header-container */}
        <div className="">
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-navyblue px-5 py-4">
            {/* logo-w-text-container */}
            <div className="flex items-center gap-1">
              <img
                src={Logo}
                alt="logo_pic"
                className="size-10 hidden lg:block"
              />
              {sideBarOpen && (
                <div className="hidden ml-1 md:block">
                  <h1 className="font-albert-sans font-bold flex items-center text-[23px] text-white transition-all duration-300">
                    <span className="text-brand">Uni</span>Claim
                    <HiOutlineShieldCheck className="ml-2 w-5 h-6 stroke-[1.5px] text-amber-400" />
                  </h1>
                </div>
              )}
              {sideBarOpen ? (
                <HiOutlineMenuAlt2
                  onClick={sideNavClick}
                  className="size-8 ml-2 lg:ml-12 text-white stroke-1 cursor-pointer hover:text-brand"
                />
              ) : (
                <HiOutlineMenuAlt2
                  onClick={sideNavClick}
                  className="size-8 lg:ml-7 text-white stroke-[1.5px] cursor-pointer hover:text-brand"
                />
              )}
            </div>

            {/* admin-controls-container */}
            <div className="flex items-center gap-4 relative">
              {/* notification-bell */}
              <button onClick={toggleNotif} className="relative">
                <HiOutlineBell className="size-8 text-white stroke-[1.3px] cursor-pointer hover:text-brand" />
              </button>

              {/* profile picture */}
              <div className="">
                <ProfilePicture
                  src={userData?.profilePicture}
                  alt="admin-profile"
                  size="md"
                  className="cursor-pointer"
                  onClick={toggleProfileMenu}
                />
              </div>

              {/* profile dropdown */}
              {showProfileMenu && (
                <div className="absolute font-manrope right-0 top-16 p-2 w-55 bg-white shadow-lg rounded-lg z-50 border border-gray-200">
                  <div className="px-3 py-2 border-b flex items-center gap-1 border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {userData?.firstName} {userData?.lastName}
                    </p>
                    <HiOutlineShieldCheck className="ml-2 w-5 h-6 stroke-[1.5px] text-amber-400" />
                  </div>

                  <button
                    onClick={handleProfileClick}
                    className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100 rounded w-full text-sm"
                  >
                    <HiOutlineUser className="size-4 stroke-[1.5px] mr-3" />
                    Admin Profile
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={handleUserView}
                    className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded w-full text-sm"
                  >
                    <HiOutlineUser className="size-4 stroke-[1.5px] mr-3" />
                    Switch to User View
                  </button>

                  <button
                    onClick={logout}
                    className="flex items-center px-4 py-2 text-red-500 hover:bg-red-50 rounded w-full text-sm"
                  >
                    <IoLogOutOutline className="size-4 stroke-[1.5px] mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* notification dropdown */}
        <div
          className={`fixed font-manrope p-3 top-0 right-0 h-full bg-white shadow-lg transition-transform duration-300 z-40 ${
            showNotif ? "translate-x-0" : "translate-x-full"
          } w-full md:w-2/3 lg:w-1/3`}
        >
          <div className="p-4 flex justify-between items-center border-b border-gray-200">
            <h2 className="text-lg font-semibold text-navyblue">
              Admin Notifications
            </h2>
            <button
              onClick={toggleNotif}
              className="text-lg lg:text-gray-500 lg:hover:text-gray-800"
            >
              <HiOutlineX className="size-6 stroke-[1.5px]" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-gray-500">No new notifications.</p>
          </div>
        </div>

        {showNotif && (
          <div
            className="fixed inset-0 bg-black/35 z-30"
            onClick={toggleNotif}
          />
        )}
      </div>
    </>
  );
}

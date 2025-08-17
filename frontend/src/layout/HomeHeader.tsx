import {
  HiOutlineMenuAlt2,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineX,
} from "react-icons/hi";
import { IoLogOutOutline } from "react-icons/io5";
import Logo from "../assets/uniclaim_logo.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import EmptyProfile from "@/assets/empty_profile.jpg";

interface HomeHeaderProps {
  sideNavClick: () => void;
  sideBarOpen: boolean;
}

export default function HomeHeader({
  sideBarOpen,
  sideNavClick,
}: HomeHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const toggleProfileMenu = () => setShowProfileMenu((prev) => !prev);
  const toggleNotif = () => setShowNotif((prev) => !prev);

  const { logout } = useAuth();

  const navigate = useNavigate();

  const handleProfileClick = () => {
    setShowProfileMenu(false); // Hide dropdown
    navigate("/profile"); // Navigate to profile
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
                <h1 className="hidden ml-1 font-albert-sans font-bold text-[23px] text-white transition-all duration-300 md:block">
                  <span className="text-brand">Uni</span>Claim
                </h1>
              )}
              {sideBarOpen ? (
                <HiOutlineMenuAlt2
                  onClick={sideNavClick}
                  className="size-8 ml-2 lg:ml-17 text-white stroke-1 cursor-pointer hover:text-brand"
                />
              ) : (
                <HiOutlineMenuAlt2
                  onClick={sideNavClick}
                  className="size-8 lg:ml-7 text-white stroke-[1.5px] cursor-pointer hover:text-brand"
                />
              )}
            </div>

            {/* notification-bell-w-profile-container */}
            <div className="flex items-center gap-4 relative">
              {/* notification-bell */}
              <button onClick={toggleNotif}>
                <HiOutlineBell className="size-8 text-white stroke-[1.3px] cursor-pointer hover:text-brand" />
              </button>
              {/* profile icon */}
              <div className="">
                <img
                  src={EmptyProfile}
                  onClick={toggleProfileMenu}
                  alt="empty-profile"
                  className="rounded-full size-10 flex items-center justify-center cursor-pointer"
                />
              </div>

              {/* profile dropdown */}
              {showProfileMenu && (
                <div className="absolute font-manrope right-0 top-16 p-2 w-40 bg-white shadow-xs rounded-sm z-50">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100 rounded w-full text-sm"
                  >
                    <HiOutlineUser className="size-4 stroke-[1.5px] mr-3" />
                    <Link to="/profile">My Profile</Link>
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center px-4 py-2 text-red-500 hover:bg-red-50/70 rounded w-full text-sm"
                  >
                    <IoLogOutOutline className="size-4 stroke-[1.5px] mr-3" />
                    Log-out
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
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-navyblue">
              Notifications
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

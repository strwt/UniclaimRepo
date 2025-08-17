import { useEffect } from "react";
import type { User } from "@/types/User";

interface ContactDetailProps {
  setUser: (user: User) => void;
  user: User;
}

const ContactDetails = ({ setUser, user: currentUser }: ContactDetailProps) => {
  useEffect(() => {
    const fetchUserData = async () => {
      const response = await new Promise<User>((resolve) =>
        setTimeout(() => {
          resolve({
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            contactNum: currentUser.contactNum,
          });
        }, 500)
      );

      setUser(response); // ✅ Pass data back to ReportPage
    };

    fetchUserData();
  }, [setUser]);

  if (!currentUser) {
    return <p className="text-gray-500">Loading user data...</p>;
  }
  return (
    <div className="rounded w-full">
      <h2 className="text-base my-3">Your contact details</h2>
      <div className="space-y-4">
        <div>
          <label className="text-[14px] text-black">Name</label>
          <input
            type="text"
            value={currentUser.firstName + " " + currentUser.lastName}
            readOnly
            className="w-full mt-1 p-3 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-800"
          />
        </div>

        <div>
          <label className="text-[14px] text-black">Email</label>
          <input
            type="email"
            value={currentUser.email}
            readOnly
            className="w-full mt-1 p-3 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-800"
          />
        </div>

        <div>
          <label className="text-[14px] text-black">Contact Number</label>
          <input
            type="text"
            value={currentUser.contactNum}
            readOnly
            className="w-full mt-1 p-3 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-800"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactDetails;

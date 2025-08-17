import { useAuth } from "@/context/AuthContext";

const ContactDetails = () => {
  const { userData, loading } = useAuth();

  if (loading) {
    return <p className="text-gray-500">Loading user data...</p>;
  }

  if (!userData) {
    return <p className="text-gray-500">No user data available...</p>;
  }
  return (
    <div className="rounded w-full">
      <h2 className="text-base my-3">Your contact details</h2>
      <div className="space-y-4">
        <div>
          <label className="text-[14px] text-black">Name</label>
          <input
            type="text"
            value={userData.firstName + " " + userData.lastName}
            readOnly
            className="w-full mt-1 p-3 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-800"
          />
        </div>

        <div>
          <label className="text-[14px] text-black">Email</label>
          <input
            type="email"
            value={userData.email}
            readOnly
            className="w-full mt-1 p-3 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-800"
          />
        </div>

        <div>
          <label className="text-[14px] text-black">Contact Number</label>
          <input
            type="text"
            value={userData.contactNum}
            readOnly
            className="w-full mt-1 p-3 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-800"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactDetails;

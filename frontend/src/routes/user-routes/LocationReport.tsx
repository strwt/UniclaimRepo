// src/routes/user-routes/LocationReport.tsx
import { FiChevronDown } from "react-icons/fi";
import USTPCDOMapLoc from "@/components/USTPCDOMap";

interface LocationProps {
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  locationError?: boolean;
  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (val: { lat: number; lng: number } | null) => void;
}

const locations = [
  "Library",
  "Canteen",
  "Gymnasium",
  "Main Entrance",
  "Hallway",
  "Computer Lab",
  "Classroom 101",
  "Parking Lot",
];

const LocationReport = ({
  selectedLocation,
  setSelectedLocation,
  locationError = false,
  coordinates,
  setCoordinates,
}: LocationProps) => {
  return (
    <div>
      <h1 className="font-medium">Location</h1>

      <p className="my-3 text-[14px]">Last seen location</p>

      <div className="relative">
        <select
          name="last_seen_location"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className={`w-full text-sm appearance-none p-3 rounded text-black focus:outline-none focus:ring-black ${
            locationError ? "border-2 border-red-500" : "border border-gray-500"
          }`}
        >
          <option value="" disabled>
            Select location ...
          </option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
      </div>

      <div className="mt-4">
        <USTPCDOMapLoc
          locationError={locationError}
          coordinates={coordinates}
          setCoordinatesExternal={setCoordinates}
        />
      </div>
    </div>
  );
};

export default LocationReport;

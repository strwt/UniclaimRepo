// src/routes/user-routes/LocationReport.tsx
import USTPCDOMapLoc from "@/components/USTPCDOMap";
import DropdownWithSearch from "@/components/DropdownWithSearch";

interface LocationProps {
  selectedLocation: string | null;
  setSelectedLocation: (val: string | null) => void;
  locationError?: boolean;
  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (val: { lat: number; lng: number } | null) => void;
}

const locations = [
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
        <DropdownWithSearch
          label=""
          data={locations}
          selected={selectedLocation}
          setSelected={setSelectedLocation}
          placeholder="Select location ..."
          error={locationError}
        />
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

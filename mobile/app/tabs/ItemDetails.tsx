// ItemDetails.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import CustomDropdown from "../../components/Dropdown";
import CustomDropdownWithSearch from "../../components/DropdownWithSearch";
import ImageUpload from "../../components/ImageUpload";
import Info from "../../components/Info";

// navigation
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/type";

// Props
type ItemDetailsProps = {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  showLostInfo: boolean;
  showFoundInfo: boolean;
  setShowLostInfo: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFoundInfo: React.Dispatch<React.SetStateAction<boolean>>;
};

type NavigationProps = NativeStackNavigationProp<
  RootStackParamList,
  "ItemDetails"
>;

export default function ItemDetails({
  images,
  setImages,
  showLostInfo,
  showFoundInfo,
  setShowLostInfo,
  setShowFoundInfo,
}: ItemDetailsProps) {
  const navigation = useNavigation<NavigationProps>();
  const [reportType, setReportType] = useState<"lost" | "found" | null>(null);
  const [foundAction, setFoundAction] = useState<
    "keep" | "turnover to OSA" | "turnover to Campus Security" | null
  >(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<null | {
    lat: number;
    lng: number;
  }>(null);

  const itemCategory = ["Student Essentials", "Gadgets", "Personal Belongings"];

  const locationOptions = [
    "Library",
    "Canteen",
    "Gym",
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

  const handleReportClick = (type: "lost" | "found") => {
    setReportType(type);
    if (type === "found") setIsModalVisible(true);
  };

  return (
    <View className="flex-1">
      <View
        className={`gap-3 ${showLostInfo || showFoundInfo ? "mt-3" : "mt-0"}`}
      >
        {showLostInfo && (
          <Info type="lost" onClose={() => setShowLostInfo(false)} />
        )}
        {showFoundInfo && (
          <Info type="found" onClose={() => setShowFoundInfo(false)} />
        )}
      </View>

      <ImageUpload images={images} setImages={setImages} />

      {/* Report Type */}
      <View className="space-y-3 mt-4">
        <Text className="text-base font-manrope-semibold mb-3">
          Item Report
        </Text>
        <View className="flex-row gap-3 mb-4">
          {["lost", "found"].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => handleReportClick(type as "lost" | "found")}
              className={`flex-1 h-[3rem] rounded-md justify-center items-center ${
                reportType === type ? "bg-navyblue" : "bg-zinc-200"
              }`}
            >
              <Text
                className={`text-base font-manrope-medium ${
                  reportType === type ? "text-white" : "text-black"
                }`}
              >
                {type === "found" && foundAction
                  ? `Found (${
                      foundAction === "keep"
                        ? "Keep"
                        : foundAction === "turnover to OSA"
                          ? "OSA"
                          : "Campus Security"
                    })`
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* item category dropdown */}
      <View>
        <CustomDropdown
          label="Item Category"
          data={itemCategory}
          selected={selectedCategory}
          setSelected={setSelectedCategory}
        />
      </View>

      {/* Date and Time */}
      <View className="mb-4">
        <Text className="text-base font-manrope-semibold mb-2">
          Date and Time
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="h-[3.3rem] border border-zinc-300 rounded-md px-3 flex-row items-center justify-between"
        >
          <Text className="font-manrope text-base text-gray-700 flex-1">
            {selectedDate
              ? selectedDate.toLocaleString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Select date and time"}
          </Text>
          {selectedDate && (
            <Pressable onPress={() => setSelectedDate(null)} hitSlop={10}>
              <Ionicons name="close-outline" size={20} color="#4B5563" />
            </Pressable>
          )}
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type === "set" && date) {
                setSelectedDate(new Date(date));
                setShowTimePicker(true);
              }
            }}
          />
        )}
        {showTimePicker && selectedDate && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display="default"
            onChange={(event, time) => {
              setShowTimePicker(false);
              if (event.type === "set" && time) {
                const updated = new Date(selectedDate);
                updated.setHours(time.getHours(), time.getMinutes());
                setSelectedDate(updated);
              }
            }}
          />
        )}
      </View>

      {/* last known location */}
      <View>
        <CustomDropdownWithSearch
          label="Last Known Location"
          data={locationOptions}
          selected={selectedLocation}
          setSelected={setSelectedLocation}
          placeholder="Select a place"
        />
      </View>

      {/* Pin a location */}
      <View className="mb-4">
        <Text className="text-sm font-manrope-semibold text-gray-700 mb-2">
          Pin a Location
        </Text>

        <View className="flex-row items-center border border-gray-300 rounded-md px-3 h-[3.3rem] bg-white">
          <Text className="flex-1 font-manrope text-base text-gray-700">
            {coordinates
              ? `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
              : "Pin a location to show coordinates"}
          </Text>
          {coordinates && (
            <Pressable onPress={() => setCoordinates(null)} hitSlop={10}>
              <Ionicons name="close-outline" size={20} color="#4B5563" />
            </Pressable>
          )}
        </View>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("USTPMapScreen", {
              setCoordinatesFromMap: (coords: { lat: number; lng: number }) =>
                setCoordinates(coords),
            })
          }
          className="mt-3 h-[3.3rem] bg-navyblue rounded-md justify-center items-center"
        >
          <Text className="text-white font-manrope-medium text-base">
            Open USTP CDO Map
          </Text>
        </TouchableOpacity>
      </View>

      <View className="w-full flex-row gap-2 justify-center bg-orange-50 rounded-md py-4">
        <MaterialIcons name="warning-amber" size={18} color="orange" />
        <Text className="font-inter-medium text-center text-orange-500 text-sm">
          Your post/ticket will expire within 30 days if not found
        </Text>
      </View>

      {/* Found Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center"
          onPress={() => setIsModalVisible(false)}
        >
          <View className="bg-white w-[23rem] h-auto rounded-xl p-4 items-center flex-col gap-6">
            {/* Header */}
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="info-outline" size={18} color="black" />
              <Text className="text-xl font-manrope-bold">
                Keep or Turnover
              </Text>
            </View>

            {/* Description */}
            <Text className="text-lg font-inter text-center text-gray-600">
              Will you keep the item and return it yourself, or turn it over to
              Campus Security or OSA?
            </Text>

            {/* Action Buttons */}
            <View className="flex-col w-full gap-3">
              {["keep", "turnover to OSA", "turnover to Campus Security"].map(
                (action) => (
                  <TouchableOpacity
                    key={action}
                    onPress={() => {
                      setFoundAction(
                        action as
                          | "keep"
                          | "turnover to OSA"
                          | "turnover to Campus Security"
                      );
                      setIsModalVisible(false);
                    }}
                    className={`py-3 rounded-md items-center ${
                      foundAction === action ? "bg-navyblue" : "bg-zinc-200"
                    }`}
                  >
                    <Text
                      className={
                        foundAction === action
                          ? "text-white font-manrope-medium"
                          : "text-black font-manrope-medium"
                      }
                    >
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

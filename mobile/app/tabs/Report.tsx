import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PageWrapper from "../../layout/PageLayout";
import ContactDetails from "./ContactDetails";
import ItemDetails from "./ItemDetails";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Report() {
  const [activeTab, setActiveTab] = useState<"item" | "contact">("item");
  const [images, setImages] = useState<string[]>([]);

  // Toast visibility state
  const [showLostInfo, setShowLostInfo] = useState(true);
  const [showFoundInfo, setShowFoundInfo] = useState(true);

  const tabAnim = useState(new Animated.Value(0))[0];
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);

  const switchTab = (tab: "item" | "contact") => {
    setActiveTab(tab);
    Animated.timing(tabAnim, {
      toValue: tab === "item" ? 0 : containerWidth / 2,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSubmit = () => {
    // 🔹 Add your submit logic here
    console.log("Form submitted!");
  };

  return (
    <PageWrapper>
      <View className="flex-1 bg-white">
        {/* Tabs */}
        <View
          className="relative mx-4 mb-2"
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          <View className="flex-row">
            <TouchableOpacity
              className="w-1/2 pb-3 items-center"
              onPress={() => switchTab("item")}
            >
              <Text
                className={`text-base font-manrope-semibold ${
                  activeTab === "item" ? "text-blue-900" : "text-gray-400"
                }`}
              >
                Item Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-1/2 pb-3 items-center"
              onPress={() => switchTab("contact")}
            >
              <Text
                className={`text-base font-manrope-semibold ${
                  activeTab === "contact" ? "text-blue-900" : "text-gray-400"
                }`}
              >
                Contact Details
              </Text>
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-200 rounded" />
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              height: 3,
              width: containerWidth / 2,
              backgroundColor: "#0a0f3d",
              transform: [{ translateX: tabAnim }],
            }}
            className="rounded-lg"
          />
        </View>

        {/* Content */}
        <ScrollView
          className="pt-2 px-4"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* 🔹 Added extra padding for button space */}
          {activeTab === "item" ? (
            <ItemDetails
              images={images}
              setImages={setImages}
              showLostInfo={showLostInfo}
              showFoundInfo={showFoundInfo}
              setShowLostInfo={setShowLostInfo}
              setShowFoundInfo={setShowFoundInfo}
            />
          ) : (
            <ContactDetails
              showLostInfo={showLostInfo}
              showFoundInfo={showFoundInfo}
              setShowLostInfo={setShowLostInfo}
              setShowFoundInfo={setShowFoundInfo}
            />
          )}
        </ScrollView>

        {/* Submit Button */}
        <View className="absolute bg-teal-50 bottom-0 left-0 w-full p-4">
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-brand py-4 rounded-lg"
          >
            <Text className="text-white text-center text-base font-manrope-semibold">
              Submit Report
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </PageWrapper>
  );
}

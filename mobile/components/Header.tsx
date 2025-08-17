import { Bell, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Header() {
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(SCREEN_WIDTH))[0];

  const openPanel = () => {
    setIsVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  const closePanel = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start(() => setIsVisible(false));
  };

  return (
    <>
      {/* Header Top Bar */}
      <View className="flex-row items-center justify-between mb-4 mt-2 px-4">
        {/* Left: Logo + Title */}
        <View className="flex-row items-center">
          <Image
            source={require("../assets/images/uniclaimlogo.png")}
            className="size-10 mr-1"
            resizeMode="contain"
          />
          <Text className="text-2xl font-albert-bold text-brand">Uni</Text>
          <Text className="text-2xl font-albert-bold text-black-500">
            Claim
          </Text>
        </View>

        {/* Right: Bell Icon */}
        <TouchableOpacity onPress={openPanel}>
          <Bell className="text-blue-900" size={26} />
        </TouchableOpacity>
      </View>

      {/* Full-Screen Modal with Full-Width Sliding Panel */}
      {isVisible && (
        <Modal transparent animationType="none">
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: SCREEN_WIDTH, // ✅ full width
                backgroundColor: "white",
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: -2, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
                transform: [{ translateX: slideAnim }],
              }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-manrope-semibold text-black">
                  Notifications
                </Text>
                <TouchableOpacity onPress={closePanel}>
                  <X size={24} color="black" />
                </TouchableOpacity>
              </View>

              {/* Notification content */}
              <View className="items-center justify-center flex-1">
                <Text className="text-lg font-inter text-gray-700">
                  📣 You have no new notifications.
                </Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
}

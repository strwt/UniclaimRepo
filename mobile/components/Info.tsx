import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type InfoToastProps = {
  type: "lost" | "found";
  onClose: () => void;
};

export default function Info({ type, onClose }: InfoToastProps) {
  const message =
    type === "lost"
      ? "All lost items must be surrendered to the OSA Building or to the Campus Security."
      : "All found items can be kept or turned over either to the OSA or Campus Security.";

  return (
    <View className="bg-blue-50 w-full py-3 px-4 rounded-lg flex-row items-start justify-between">
      <View className="flex-row flex-1 items-start">
        <MaterialIcons name="info-outline" size={18} color="blue" />
        <Text className="ml-3 text-sm text-blue-700 font-inter-medium flex-1">
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose}>
        <MaterialIcons name="close" size={18} color="blue" />
      </TouchableOpacity>
    </View>
  );
}

// components/AlertMessage.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  description: string;
}

const iconMap = {
  success: { name: "checkmark-circle", color: "#22c55e" },
  error: { name: "close-circle", color: "#ef4444" },
  warning: { name: "warning", color: "#f59e0b" },
  info: { name: "information-circle", color: "#3b82f6" },
};

export const AlertMessage: React.FC<AlertProps> = ({
  type,
  title,
  description,
}) => {
  const icon = iconMap[type];

  return (
    <View
      className={`flex-row items-start p-4 mb-4 rounded-lg bg-${type === "success" ? "green" : type === "error" ? "red" : type === "warning" ? "yellow" : "blue"}-100`}
    >
      <Ionicons
        name={icon.name as any}
        size={24}
        color={icon.color}
        className="mt-1 mr-3"
      />
      <View className="flex-1">
        <Text className="font-semibold text-base text-gray-800 mb-1">
          {title}
        </Text>
        <Text className="text-sm text-gray-700">{description}</Text>
      </View>
    </View>
  );
};

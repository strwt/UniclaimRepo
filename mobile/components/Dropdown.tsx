import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DropdownProps = {
  label?: string;
  data: string[];
  selected: string | null;
  setSelected: (value: string | null) => void;
  placeholder?: string;
};

const CustomDropdown = ({
  label,
  data,
  selected,
  setSelected,
  placeholder = "Select a category",
}: DropdownProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-4 z-50">
      {label && (
        <Text className="text-base font-manrope-semibold text-black mb-2">
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row justify-between items-center bg-white border border-gray-300 rounded-md px-4 py-3"
      >
        <Text
          className={`font-manrope text-base flex-1 ${
            selected ? "text-gray-800" : "text-gray-700"
          }`}
        >
          {selected || placeholder}
        </Text>

        <View className="flex-row items-center gap-2">
          {selected && (
            <Pressable onPress={() => setSelected(null)} hitSlop={10}>
              <Ionicons name="close" size={20} color="#4B5563" />
            </Pressable>
          )}
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#4B5563"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="font-manrope mt-2 bg-white border border-gray-300 rounded-md shadow-md max-h-48">
          <ScrollView nestedScrollEnabled>
            {data.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setSelected(item);
                  setExpanded(false);
                }}
                className="py-3 px-4 border-gray-200"
              >
                <Text className="text-gray-800 text-base font-manrope">
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default CustomDropdown;

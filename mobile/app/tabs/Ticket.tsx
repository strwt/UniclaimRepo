import PageLayout from "@/layout/PageLayout";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Ticket() {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  return (
    <PageLayout>
      <View className="flex-1 bg-white">
        {/* Search Section */}
        <View className="px-4 mt-1 space-y-3">
          <View className="flex-row items-center gap-2">
            {/* Search Input */}
            <View className="flex-[1.3] bg-gray-100 border border-zinc-300 rounded-md px-3 h-[3.3rem] flex-row items-center">
              {/* <Search className="text-gray-500 mr-1" size={16} /> */}
              <TextInput
                className="flex-1 text-gray-800 text-[13px] leading-tight font-manrope"
                placeholder="Search an ticket"
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Search Button */}
            <TouchableOpacity className="bg-teal-500 rounded-md h-[3.3rem] px-4 justify-center items-center">
              <Text className="text-white font-manrope-medium text-base">
                Search
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toggle Buttons for Active/Completed */}
          <View className="flex-row mt-4 gap-2">
            <TouchableOpacity
              onPress={() => setActiveTab("active")}
              className={`flex-1 h-[3.3rem] rounded-md items-center justify-center ${
                activeTab === "active" ? "bg-navyblue" : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-base font-manrope-semibold ${
                  activeTab === "active" ? "text-white" : "text-black"
                }`}
              >
                Active Tickets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("completed")}
              className={`flex-1 h-[3.3rem] rounded-md items-center justify-center ${
                activeTab === "completed" ? "bg-navyblue" : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-base font-manrope-semibold  ${
                  activeTab === "completed" ? "text-white" : "text-black"
                }`}
              >
                Completed Tickets
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}

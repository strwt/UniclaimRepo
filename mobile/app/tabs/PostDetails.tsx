import ImageCarousel from "@/components/ImageCarousel";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../types/type";

type PostDetailsRouteProp = RouteProp<RootStackParamList, "PostDetails">;

export default function PostDetailsScreen() {
  const route = useRoute<PostDetailsRouteProp>();
  const { post } = route.params;

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getCategoryBadgeStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case "student essentials":
        return "bg-yellow-100 text-yellow-700";
      case "gadgets":
        return "bg-blue-100 text-blue-700";
      case "personal belongings":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-blue-100 text-blue-700"; // fallback
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
      {/* X Close Icon */}
      <View className="flex-row items-center gap-3 p-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-manrope-bold text-gray-800">
          {post.user.firstName} {post.user.lastName}
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4 pb-4"
      >
        {/* Image Container */}
        <View className="bg-zinc-100 w-full h-80 mb-5 rounded-sm overflow-hidden">
          <ImageCarousel images={post.images as string[]} />
        </View>

        <TouchableOpacity className="bg-brand h-[3.5rem] mb-5 w-full items-center justify-center rounded-md">
          <Text className="text-white font-manrope-medium text-base">
            Send Message to Juan
          </Text>
        </TouchableOpacity>

        {post.type === "lost" ? (
          <View className="flex-row mb-5 bg-blue-50 rounded-md py-3 w-full items-center justify-center px-3">
            <MaterialIcons name="info-outline" size={15} color="blue" />
            <Text className="text-sm text-center w-[20rem] text-blue-700 font-inter ml-2">
              All lost items must be surrendered to the OSA Building or to the
              Campus Security
            </Text>
          </View>
        ) : (
          <View className="flex-row mb-5 bg-blue-50 rounded-md py-3 w-full items-center justify-center px-3">
            <MaterialIcons name="info-outline" size={15} color="blue" />
            <Text className="text-sm text-center w-[20rem] text-blue-700 font-inter ml-2">
              All found items can be claimed to the OSA office.
            </Text>
          </View>
        )}

        {/* item-details */}
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="info-outline" size={20} color="black" />
          <Text className="font-manrope-medium">Item Details</Text>
        </View>

        <View className="my-3">
          <Text className="mb-2 font-manrope-semibold">Item Title</Text>
          <View className="bg-zinc-100 justify-center w-full p-3 h-[3.5rem] border border-zinc-200 rounded-md">
            <Text className="text-base font-manrope-medium text-black">
              {post.title}
            </Text>
          </View>
        </View>

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Item Status</Text>
          <View className="bg-zinc-100 justify-center w-full p-3 h-[3.5rem] border border-zinc-200 rounded-md">
            <Text className="text-base capitalize font-manrope-medium text-black">
              {post.type}
            </Text>
          </View>
        </View>

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Item Category</Text>
          <View className="bg-zinc-100 justify-center w-full p-3 h-[3.5rem] border border-zinc-200 rounded-md">
            <Text className="text-base capitalize font-manrope-medium text-black">
              {post.category}
            </Text>
          </View>
        </View>

        {/* Keep/Turnover Display for Found Items Only */}
        {post.type === "found" && post.status && (
          <View className="mt-1 mb-3">
            <Text className="mb-2 font-manrope-semibold">Keep or Turnover</Text>
            <View
              className={`justify-center w-full p-3 h-[3.5rem] border rounded-md ${
                post.status === "keep"
                  ? "bg-zinc-100 border-zinc-200"
                  : "bg-zinc-100 border-zinc-200"
              }`}
            >
              <Text
                className={`text-base capitalize font-manrope-medium ${
                  post.status === "keep" ? "text-black" : "text-black"
                }`}
              >
                {post.status === "keep" ? "Kept by Poster" : "Turned Over"}
              </Text>
            </View>
          </View>
        )}

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Description</Text>

          <View className="bg-zinc-100 w-full h-[10rem] border border-zinc-200 rounded-md">
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 13 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <Text className="text-base font-manrope-medium text-black leading-relaxed">
                {post.description}
              </Text>
            </ScrollView>
          </View>
        </View>

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Date and Time</Text>
          <View className="bg-zinc-100 justify-center w-full p-3 h-[3.5rem] border border-zinc-200 rounded-md">
            <Text className="text-base capitalize font-manrope-medium text-black">
              {post.datetime}
            </Text>
          </View>
        </View>

        {/* location-section */}
        <View className="flex-row items-center gap-2 mt-5 mb-3">
          <Ionicons name="location-outline" size={20} color="black" />
          <Text className="font-manrope-medium">Location</Text>
        </View>

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Last Seen Location</Text>
          <View className="bg-zinc-100 justify-center w-full p-3 h-[3.5rem] border border-zinc-200 rounded-md">
            <Text className="text-base capitalize font-manrope-medium text-black">
              {post.location}
            </Text>
          </View>
        </View>

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Location Map</Text>
          <View className="bg-zinc-100 w-full p-3 h-[20rem] border border-zinc-200 rounded-md">
            <Text className="text-base capitalize italic font-manrope-medium text-black">
              Display here at location map
            </Text>
          </View>
        </View>

        {/* contact-details */}
        <View className="flex-row items-center gap-2 mt-5 mb-3">
          <MaterialCommunityIcons
            name="account-details"
            size={20}
            color="black"
          />
          <Text className="font-manrope-medium">Contact Details</Text>
        </View>

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Name</Text>
          <View className="bg-zinc-100 justify-center w-full p-3 h-[3.5rem] border border-zinc-200 rounded-md">
            <Text className="text-base capitalize font-manrope-medium text-black">
              Display dari ang name sa nag post
            </Text>
          </View>
        </View>

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Contact Number</Text>
          <View className="bg-zinc-100 justify-center w-full p-3 h-[3.5rem] border border-zinc-200 rounded-md">
            <Text className="text-base capitalize font-manrope-medium text-black">
              Display dari ang contact number sa nag post
            </Text>
          </View>
        </View>

        <View className="mt-1 mb-3">
          <Text className="mb-2 font-manrope-semibold">Email</Text>
          <View className="bg-zinc-100 justify-center w-full p-3 h-[3.5rem] border border-zinc-200 rounded-md">
            <Text className="text-base capitalize font-manrope-medium text-black">
              Display dari ang email sa nag post
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

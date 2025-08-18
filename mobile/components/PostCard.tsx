import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Image,
  Image as RNImage,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Post } from "../types/type";

type RootStackParamList = {
  PostDetails: { post: Post };
};

type Props = {
  post: Post;
  descriptionSearch?: string;
};

export default function PostCard({ post, descriptionSearch = "" }: Props) {
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
        return "bg-blue-100 text-blue-700";
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return <Text>{text}</Text>;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return (
      <Text>
        {parts.map((part, i) => (
          <Text
            key={i}
            className={
              part.toLowerCase() === search.toLowerCase()
                ? "bg-teal-300"
                : "text-gray-800"
            }
          >
            {part}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      className="border border-zinc-200 rounded-md mb-4"
      activeOpacity={0.1}
      onPress={() =>
        navigation.navigate("PostDetails", {
          post: {
            ...post,
            images: post.images.map((img) =>
              typeof img === "number"
                ? RNImage.resolveAssetSource(img).uri
                : img
            ),
          },
        })
      }
    >
      <Image
        source={
          typeof post.images[0] === "string"
            ? { uri: post.images[0] as string }
            : (post.images[0] as any)
        }
        className="w-full h-80 rounded-t-md"
        resizeMode="cover"
      />

      <View className="p-3">
        <View className="flex-row items-center gap-2">
          <Text
            className={`self-start px-3 py-1 mb-2 rounded-sm text-xs font-inter-medium ${
              post.type === "lost"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {post.type === "lost" ? "Lost" : "Found"}
          </Text>

          <Text
            className={`px-3 py-1 mb-2 rounded-sm font-inter-medium text-xs font-medium ${getCategoryBadgeStyle(
              post.category
            )}`}
          >
            {post.category}
          </Text>

          {post.type === "found" && post.foundAction && (
            <Text
              className={`px-3 py-1 mb-2 rounded-sm text-xs font-inter-medium ${
                post.foundAction === "keep"
                  ? "bg-amber-200 text-amber-700"
                  : "bg-fuchsia-200 text-fuchsia-700"
              }`}
            >
              {post.foundAction === "keep" ? "Kept by the Poster" : "Turned Over"}
            </Text>
          )}
        </View>

        <Text className="text-2xl my-1.5 font-manrope-semibold text-black">
          {post.title}
        </Text>
        <Text className="text-xs text-blue-800 mb-2 font-manrope-bold">
          Posted by {(() => {
            // ✅ Handle multiple data structure scenarios
            if (post.user?.firstName && post.user?.lastName) {
              return `${post.user.firstName} ${post.user.lastName}`;
            } else if (post.postedBy) {
              return post.postedBy;
            } else if (post.user?.email) {
              return post.user.email.split('@')[0]; // Show username part of email
            } else {
              return 'Unknown User';
            }
          })()}
        </Text>

        <View className="flex-row flex-wrap items-center gap-2">
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={16} color="#4B5563" />
            <Text className="text-sm text-zinc-700 font-inter ml-0.5">
              Last seen at
            </Text>
            <Text className="text-sm text-zinc-700 font-inter">
              {post.location}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text className="text-sm font-inter text-zinc-700">
              {(() => {
                // Priority: dateTime (when item was lost/found) > createdAt (when post was created)
                let dateToShow: Date | null = null;
                
                if (post.dateTime) {
                  dateToShow = new Date(post.dateTime);
                } else if (post.createdAt) {
                  dateToShow = new Date(post.createdAt);
                }
                
                if (!dateToShow || isNaN(dateToShow.getTime())) {
                  return 'Date not available';
                }
                
                const now = new Date();
                const diffInMs = now.getTime() - dateToShow.getTime();
                const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                
                // Show relative time for recent posts, full date for older ones
                if (diffInMinutes < 60) {
                  return `${diffInMinutes} min ago`;
                } else if (diffInHours < 24) {
                  return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                } else if (diffInDays < 7) {
                  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                } else {
                  // For older posts, show the actual date
                  return dateToShow.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                }
              })()}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={2}
          className="text-sm text-gray-700 mt-3 font-inter"
        >
          {highlightText(post.description, descriptionSearch)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

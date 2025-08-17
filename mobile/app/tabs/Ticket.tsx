import PageLayout from "@/layout/PageLayout";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, ScrollView, ActivityIndicator, Image, Alert } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useUserPostsWithSet } from "@/hooks/usePosts";
import type { Post } from "@/types/type";
import { auth } from "@/utils/firebase";
import { postService } from "@/utils/firebase";

export default function Ticket() {
  const { userData, loading: authLoading } = useAuth();
  const { posts, setPosts, loading: postsLoading } = useUserPostsWithSet(userData?.email || "");
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [searchText, setSearchText] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Filter posts based on selected tab and search
  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === "active" ? post.status === "pending" : post.status === "resolved";
    const matchesSearch = post.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleClearSearch = () => {
    setSearchText("");
  };

  const handleDeletePost = async (id: string) => {
    // Show confirmation dialog
    Alert.alert(
      "Delete Ticket",
      "Are you sure you want to delete this ticket? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingPostId(id); // Show loading state
              
              // Call Firebase service to actually delete the post
              await postService.deletePost(id);
              
              // Update local state after successful deletion
              setPosts((prevPosts: Post[]) => prevPosts.filter((p: Post) => p.id !== id));
              
              // Show success message
              Alert.alert("Success", "Ticket deleted successfully!");
            } catch (error) {
              console.error('Error deleting post:', error);
              // Show error message to user
              Alert.alert("Error", "Failed to delete ticket. Please try again.");
            } finally {
              setDeletingPostId(null); // Hide loading state
            }
          }
        }
      ]
    );
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <PageLayout>
        <View className="flex-1 bg-white justify-center items-center">
          <ActivityIndicator size="large" color="#0f766e" />
          <Text className="text-gray-500 mt-2 font-manrope">Loading...</Text>
        </View>
      </PageLayout>
    );
  }

  // Show error if no user data
  if (!userData) {
    return (
      <PageLayout>
        <View className="flex-1 bg-white justify-center items-center px-4">
          <Text className="text-red-500 text-center font-manrope-medium">
            Please log in to view your tickets
          </Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <View className="flex-1 bg-white">
        {/* Search Section */}
        <View className="px-4 mt-1 space-y-3">
          <View className="flex-row items-center gap-2">
            {/* Search Input */}
            <View className="flex-[1.3] bg-gray-100 border border-zinc-300 rounded-md px-3 h-[3.3rem] flex-row items-center">
              <TextInput
                className="flex-1 text-gray-800 text-[13px] leading-tight font-manrope"
                placeholder="Search a ticket"
                placeholderTextColor="#6B7280"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* Search Button */}
            <TouchableOpacity className="bg-teal-500 rounded-md h-[3.3rem] px-4 justify-center items-center">
              <Text className="text-white font-manrope-medium text-base">
                Search
              </Text>
            </TouchableOpacity>
          </View>

          {/* Clear Search Button */}
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              className="bg-gray-200 rounded-md h-[2.5rem] px-4 justify-center items-center self-start"
            >
              <Text className="text-black font-manrope-medium text-sm">
                Clear Search
              </Text>
            </TouchableOpacity>
          )}

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

        {/* Tickets Section */}
        <ScrollView className="flex-1 px-4 mt-4">
          {postsLoading ? (
            <View className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#0f766e" />
              <Text className="text-gray-500 mt-2 font-manrope">Loading tickets...</Text>
            </View>
          ) : filteredPosts.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-gray-500 text-center font-manrope-medium">
                {searchText.length > 0 
                  ? "No tickets found matching your search." 
                  : `No ${activeTab} tickets found.`
                }
              </Text>
            </View>
          ) : (
            <View className="space-y-4 pb-4">
              {filteredPosts.map((post) => (
                <TicketCard 
                  key={post.id} 
                  post={post} 
                  onDelete={handleDeletePost}
                  isDeleting={deletingPostId === post.id}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </PageLayout>
  );
}

// Ticket Card Component
const TicketCard = ({ 
  post, 
  onDelete, 
  isDeleting 
}: { 
  post: Post; 
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100";
      case "rejected":
        return "bg-red-100";
      default:
        return "bg-yellow-100";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "text-green-700";
      case "rejected":
        return "text-red-700";
      default:
        return "text-yellow-700";
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "Unknown date";
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date.toDate();
      return dateObj.toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  // Handle image source properly for React Native
  const getImageSource = (images: (string | File)[]) => {
    if (!images || images.length === 0) return null;
    
    const firstImage = images[0];
    if (typeof firstImage === 'string') {
      // If it's already a URL (Cloudinary URL), use it directly
      return { uri: firstImage };
    }
    
    // If it's a File object, this shouldn't happen in mobile but handle gracefully
    return null;
  };

  const imageSource = getImageSource(post.images);

  return (
    <TouchableOpacity className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Image Section */}
      {imageSource ? (
        <View className="w-full h-48">
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
            // Add error handling for failed image loads
            onError={() => console.log('Failed to load image:', imageSource)}
          />
        </View>
      ) : (
        <View className="w-full h-48 bg-gray-100 justify-center items-center">
          <Text className="text-gray-400 text-center font-manrope">
            No Image Available
          </Text>
        </View>
      )}

      {/* Content Section */}
      <View className="p-4">
        {/* Title and Status */}
        <View className="flex-row items-start justify-between gap-3 mb-3">
          <Text className="flex-1 font-manrope-semibold text-lg text-gray-800 leading-tight">
            {post.title}
          </Text>
          <View className={`px-2 py-1 rounded ${getStatusColor(post.status || "pending")}`}>
            <Text className={`text-xs font-manrope-semibold capitalize ${getStatusTextColor(post.status || "pending")}`}>
              {post.status || "pending"}
            </Text>
          </View>
        </View>

        {/* Location and Date */}
        <View className="space-y-2 mb-3">
          <Text className="text-xs text-gray-500 font-manrope">
            Last seen location: {post.location}
          </Text>
          <Text className="text-xs text-gray-400 font-manrope">
            Posted: {formatDate(post.createdAt)}
          </Text>
        </View>

        {/* Description */}
        <Text className="text-sm text-gray-600 font-manrope leading-tight" numberOfLines={3}>
          {post.description}
        </Text>

        {/* Category and Type */}
        <View className="flex-row items-center gap-2 mt-3">
          <View className="bg-gray-100 px-2 py-1 rounded">
            <Text className="text-xs text-gray-600 font-manrope-medium capitalize">
              {post.category}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded ${
            post.type === "found" ? "bg-blue-100" : "bg-orange-100"
          }`}>
            <Text className={`text-xs font-manrope-medium capitalize ${
              post.type === "found" ? "text-blue-700" : "text-orange-700"
            }`}>
              {post.type}
            </Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => onDelete(post.id)}
          className="mt-4 bg-red-500 rounded-md h-[3.3rem] px-4 justify-center items-center"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-manrope-medium text-base">
              Delete Ticket
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

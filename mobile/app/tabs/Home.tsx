import React, { useState, useEffect } from "react";
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import SearchWithToggle from "../../components/Input";
import PostCard from "../../components/PostCard";
import { PostCardSkeletonList } from "../../components/PostCardSkeleton";
import Layout from "../../layout/HomeLayout";
import type { Post } from "../../types/type";

// hooks
import { usePosts } from "../../hooks/usePosts";
import { useScrollPreservation } from "../../hooks/useScrollPreservation";

export default function Home() {
  // ✅ Use the custom hook for real-time posts with smart loading
  const { posts, loading, error, isInitialLoad } = usePosts();
  
  // ✅ Use scroll preservation hook
  const { flatListRef, handleScroll, restoreScrollPosition } = useScrollPreservation('home');
  
  const [activeButton, setActiveButton] = useState<"lost" | "found">("lost");
  const [query, setQuery] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");

  // Restore scroll position when component becomes visible
  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      restoreScrollPosition();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [restoreScrollPosition]);

  const filteredPosts = (posts || []).filter((post) => {
    // ✅ Add data validation to prevent crashes
    if (!post || !post.title || !post.description || !post.category || !post.location) {
      return false;
    }
    
    const queryWords = query.toLowerCase().trim().split(/\s+/);

    const titleMatch = queryWords.every((word) =>
      post.title.toLowerCase().includes(word)
    );

    const descriptionMatch = descriptionSearch
      ? post.description
          .toLowerCase()
          .includes(descriptionSearch.toLowerCase().trim())
      : true;

    const categoryMatch = categorySearch
      ? post.category === categorySearch
      : true;

    const locationMatch = locationSearch
      ? post.location === locationSearch
      : true;

    return (
      post.type === activeButton &&
      titleMatch &&
      categoryMatch &&
      locationMatch &&
      descriptionMatch
    );
  });

  return (
    <Layout>
      <View className="flex-1 px-4">
        <SearchWithToggle
          query={query}
          setQuery={setQuery}
          categorySearch={categorySearch}
          setCategorySearch={setCategorySearch}
          locationSearch={locationSearch}
          setLocationSearch={setLocationSearch}
          descriptionSearch={descriptionSearch}
          setDescriptionSearch={setDescriptionSearch}
        />

        <View className="flex-row mt-5 gap-2">
          <TouchableOpacity
            onPress={() => setActiveButton("lost")}
            className={`flex-1 h-[3.3rem] rounded-md items-center justify-center ${
              activeButton === "lost" ? "bg-navyblue" : "bg-zinc-200"
            }`}
          >
            <Text
              className={`font-semibold text-base font-manrope-semibold ${
                activeButton === "lost" ? "text-white" : "text-black"
              }`}
            >
              Lost Item
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveButton("found")}
            className={`flex-1 h-[3.3rem] rounded-md items-center justify-center ${
              activeButton === "found" ? "bg-navyblue" : "bg-zinc-200"
            }`}
          >
            <Text
              className={`font-semibold text-base font-manrope-semibold ${
                activeButton === "found" ? "text-white" : "text-black"
              }`}
            >
              Found Item
            </Text>
          </TouchableOpacity>
        </View>

        {/* 📄 Filtered Post List with Smart Loading & Error States */}
        {error ? (
          <View className="items-center justify-center mt-10">
            <Text className="text-red-500 text-base font-manrope-medium">
              Error loading posts: {error}
            </Text>
            <TouchableOpacity 
              onPress={() => {/* Add retry functionality if needed */}}
              className="mt-3 px-4 py-2 bg-navyblue rounded"
            >
              <Text className="text-white font-manrope-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : isInitialLoad && loading ? (
          // Show skeleton loading only on first load
          <PostCardSkeletonList count={5} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PostCard post={item} descriptionSearch={descriptionSearch} />
            )}
            onScroll={handleScroll}
            scrollEventThrottle={16} // Optimize scroll performance
            ListEmptyComponent={
              <View className="items-center justify-center mt-10">
                <Text className="text-gray-500 text-base font-manrope-medium">
                  No posts/report found.
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            className="mt-4"
          />
        )}
      </View>
    </Layout>
  );
}

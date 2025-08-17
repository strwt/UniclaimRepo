import React, { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import SearchWithToggle from "../../components/Input";
import PostCard from "../../components/PostCard";
import Layout from "../../layout/HomeLayout";
import type { Post } from "../../types/type";

// ✅ Your dummy data (KEEP THIS)
const posts: Post[] = [
  {
    id: "1",
    type: "lost",
    category: "Personal Belongings",
    images: [
      require("../../assets/images/squarepic.jpg"),
      require("../../assets/images/dummypostrec.jpg"),
      require("../../assets/images/squarepic.jpg"),
    ],
    title: "Lost Black Wallet",
    location: "Entrance Hallway",
    datetime: "August 2, 2025 - 3:45 PM",
    description:
      "A black leather wallet with multiple cards and cash inside. Has a visible scratch at the front.",
    postedBy: "Juan Dela Cruz",
  },
  {
    id: "2",
    type: "lost",
    category: "Gadgets",
    images: [require("../../assets/images/squarepic.jpg")],
    title: "iPhone 12 Pro",
    location: "Admin Building",
    datetime: "August 2, 2025 - 1:00 PM",
    description: "Silver iPhone 12 Pro with blue case. Has sticker of Batman.",
    postedBy: "Maria Santos",
  },
  {
    id: "3",
    type: "found",
    category: "Student Essentials",
    status: "turnover",
    images: [
      require("../../assets/images/squarepic.jpg"),
      require("../../assets/images/squarepic.jpg"),
      require("../../assets/images/squarepic.jpg"),
    ],
    title: "USTP ID Lace",
    location: "Library",
    datetime: "August 1, 2025 - 10:30 AM",
    description: "Blue ID lace labeled USTP with no ID.",
    postedBy: "Mark Reyes",
  },
  {
    id: "4",
    type: "found",
    category: "Student Essentials",
    status: "keep",
    images: [
      require("../../assets/images/squarepic.jpg"),
      require("../../assets/images/squarepic.jpg"),
      require("../../assets/images/squarepic.jpg"),
    ],
    title: "USTP ID Lace",
    location: "Library",
    datetime: "August 1, 2025 - 10:30 AM",
    description: "Blue ID lace labeled USTP with ID.",
    postedBy: "Mark Reyes",
  },
];

export default function Home() {
  const [activeButton, setActiveButton] = useState<"lost" | "found">("lost");
  const [query, setQuery] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");

  const filteredPosts = posts.filter((post) => {
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

        {/* 📄 Filtered Post List */}
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} descriptionSearch={descriptionSearch} />
          )}
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
      </View>
    </Layout>
  );
}

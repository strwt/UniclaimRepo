import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function ImageUploader({ images, setImages }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    if (images.length >= 3) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any, // Direct string value avoids all enum deprecation warnings
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImages((prev) => [...prev, uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <View className="w-full">
      <Text className="text-base font-manrope-semibold">Image Upload</Text>

      <View
        className={`flex-row flex-wrap gap-4 mb-3 ${
          images.length > 0 ? "mt-3" : "mt-0"
        }`}
      >
        {images.map((uri, index) => (
          <View key={index} className="relative">
            <TouchableOpacity onPress={() => setSelectedImage(uri)}>
              <Image
                source={{ uri }}
                className="w-24 h-24 rounded-lg border border-gray-300"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removeImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
            >
              <MaterialIcons name="close" size={14} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {images.length < 3 ? (
        <TouchableOpacity
          onPress={pickImage}
          className="border border-navyblue bg-navyblue h-[3.3rem] rounded-md items-center justify-center"
        >
          <Text className="text-white font-manrope-medium text-base">
            Upload Image
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="border border-green-500 py-4 rounded-md items-center">
          <Text className="text-green-500 font-manrope-medium">
            Max Upload Reached
          </Text>
        </View>
      )}

      {/* Modal for image preview */}
      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          onPress={() => setSelectedImage(null)}
          className="flex-1 bg-black/80 justify-center items-center"
        >
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              className="w-[90%] h-[70%] rounded-xl"
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

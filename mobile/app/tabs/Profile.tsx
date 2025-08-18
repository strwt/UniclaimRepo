import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import PageLayout from "../../layout/PageLayout";
import type { RootStackParamList } from "../../types/type";
import { useAuth } from "../../context/AuthContext";
import { profileUpdateService } from "../../utils/profileUpdateService";
import { cloudinaryService } from "../../utils/cloudinary";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Profile">;

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { logout, userData, user, refreshUserData } = useAuth();

  const [profile, setProfile] = useState({
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    email: userData?.email || "",
    contactNumber: userData?.contactNum || "",
    studentId: userData?.studentId || "",
    imageUri: userData?.profileImageUrl 
      ? { uri: userData.profileImageUrl }
      : require("../../assets/images/squarepic.jpg"), // default local asset
  });
  const [hasImageChanged, setHasImageChanged] = useState(false);

  // Update profile when userData changes
  React.useEffect(() => {
    if (userData) {
      setProfile({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        contactNumber: userData.contactNum || "",
        studentId: userData.studentId || "",
        imageUri: userData.profileImageUrl 
          ? { uri: userData.profileImageUrl }
          : require("../../assets/images/squarepic.jpg"),
      });
      setHasImageChanged(false);
    }
  }, [userData]);

  const handleSave = async () => {
    if (!userData || !user) {
      Alert.alert("Error", "User data not available");
      return;
    }

    try {
      setIsLoading(true);
      
      let profileImageUrl = userData.profileImageUrl;

      // Upload image to Cloudinary if it has changed
      if (hasImageChanged && profile.imageUri && typeof profile.imageUri === 'object' && 'uri' in profile.imageUri) {
        try {
          const uploadedUrls = await cloudinaryService.uploadImages([profile.imageUri.uri], 'profiles');
          profileImageUrl = uploadedUrls[0];
        } catch (imageError: any) {
          console.error('Error uploading profile image:', imageError);
          Alert.alert("Warning", "Failed to upload profile image, but other changes will be saved.");
        }
      }
      
      // Prepare update data, only include fields that have values
      const updateData: any = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        contactNum: profile.contactNumber,
        studentId: profile.studentId,
      };

      // Only include profileImageUrl if it has a valid value
      if (profileImageUrl && profileImageUrl !== userData.profileImageUrl) {
        updateData.profileImageUrl = profileImageUrl;
      }

      // Update all user data across collections using the new service
      await profileUpdateService.updateAllUserData(user.uid, updateData);

      // Refresh user data to ensure UI shows updated information
      await refreshUserData();

      Alert.alert(
        "Success", 
        "Profile updated successfully! All your posts and conversations have been updated with the new information."
      );
      setIsEditing(false);
      setHasImageChanged(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Revert to original userData
    if (userData) {
      setProfile({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        contactNumber: userData.contactNum || "",
        studentId: userData.studentId || "",
        imageUri: userData.profileImageUrl 
          ? { uri: userData.profileImageUrl }
          : require("../../assets/images/squarepic.jpg"),
      });
    }
    setIsEditing(false);
    setHasImageChanged(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: "Index" }],
              });
            } catch (error: any) {
              Alert.alert("Logout Failed", error.message);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need access to your gallery to change the photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any, // Direct string value avoids all enum deprecation warnings
      allowsEditing: true, // crop square
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfile((prev) => ({
        ...prev,
        imageUri: { uri: result.assets[0].uri },
      }));
      setHasImageChanged(true);
    }
  };

  const renderField = (
    iconName: keyof typeof AntDesign.glyphMap | keyof typeof Ionicons.glyphMap,
    label: string,
    value: string,
    fieldKey: keyof typeof profile,
    IconComponent: typeof AntDesign | typeof Ionicons,
    isReadOnly = false
  ) => {
    if (isEditing && typeof value === "string" && !isReadOnly) {
      return (
        <View className="w-full">
          <Text className="text-base font-manrope-medium mb-1">{label}</Text>
          <TextInput
            value={profile[fieldKey] as string}
            onChangeText={(text) =>
              setProfile((prev) => ({ ...prev, [fieldKey]: text }))
            }
            className="w-full bg-zinc-100 p-3 rounded-md border border-zinc-300 font-inter text-base"
            returnKeyType="done"
          />
        </View>
      );
    }

    return (
      <View className="flex-row justify-between items-center w-full bg-zinc-100 p-3 rounded-md border border-zinc-300">
        <View className="flex-row items-center gap-3">
          <IconComponent name={iconName as any} size={20} color="black" />
          <Text className="text-base font-manrope-medium">{label}</Text>
        </View>
        <Text className="font-inter text-base">{value}</Text>
      </View>
    );
  };

  // Show loading if userData is not available yet
  if (!userData) {
    return (
      <PageLayout>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text className="text-gray-500 text-base font-manrope-medium mt-3">
            Loading profile...
          </Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <KeyboardAwareScrollView
          className="mx-4"
          contentContainerStyle={{
            paddingBottom: 60,
          }}
          extraScrollHeight={10}
          enableOnAndroid={true}
          keyboardOpeningTime={0}
          showsVerticalScrollIndicator={false}
        >
          {/* profile with name and id */}
          <View className="items-center my-4">
            <TouchableOpacity
              activeOpacity={isEditing ? 0.7 : 1}
              onPress={() => {
                if (isEditing) pickImage();
              }}
            >
              <Image
                source={profile.imageUri}
                className="size-[7.8rem] rounded-full"
              />
              {isEditing && (
                <View className="absolute bottom-0 right-0 bg-black/60 p-1 rounded-full">
                  <Ionicons name="camera-outline" size={18} color="white" />
                </View>
              )}
            </TouchableOpacity>

            <View className="items-center flex-col gap-1 mt-3">
              <Text className="font-manrope-bold text-xl">
                {profile.firstName} {profile.lastName}
              </Text>
              <Text className="text-zinc-500 text-base font-inter">
                Student ID: {profile.studentId}
              </Text>
            </View>

            {/* edit/save/cancel buttons */}
            <View className="my-3 flex-row gap-2">
              {!isEditing ? (
                <TouchableOpacity
                  className="flex-row gap-2 bg-navyblue rounded-md py-3 px-4"
                  onPress={() => setIsEditing(true)}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={15}
                    color="white"
                  />
                  <Text className="text-white text-sm font-manrope-medium">
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    className={`rounded-md py-3 px-4 flex-row items-center justify-center ${isLoading ? 'bg-gray-400' : 'bg-green-600'}`}
                    onPress={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white text-sm font-manrope-medium ml-2">
                          Saving...
                        </Text>
                      </>
                    ) : (
                      <Text className="text-white text-sm font-manrope-medium">
                        Save Changes
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-red-600 rounded-md py-3 px-4"
                    onPress={handleCancel}
                  >
                    <Text className="text-white text-sm font-manrope-medium">
                      Cancel Changes
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* profile-details-info */}
          <View className="flex-col gap-4 mt-1">
            {renderField(
              "user",
              "First Name",
              profile.firstName,
              "firstName",
              AntDesign
            )}
            {renderField(
              "user",
              "Last Name",
              profile.lastName,
              "lastName",
              AntDesign
            )}
            {renderField(
              "mail-outline",
              "Email",
              profile.email,
              "email",
              Ionicons,
              true // Email is read-only
            )}
            {renderField(
              "contacts",
              "Contact Number",
              profile.contactNumber,
              "contactNumber",
              AntDesign
            )}
            {renderField(
              "idcard",
              "Student ID",
              profile.studentId,
              "studentId",
              AntDesign
            )}

            {!isEditing && (
              <TouchableOpacity
                className="flex-row justify-between items-center w-full bg-red-50 p-3 rounded-md border border-red-300"
                activeOpacity={0.7}
                onPress={handleLogout}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="exit-outline" size={20} color="red" />
                  <Text className="text-base font-manrope-medium text-red-500">
                    Log Out
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </PageLayout>
  );
}

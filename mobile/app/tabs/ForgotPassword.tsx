// app/tabs/ForgotPassword.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    // Placeholder for password reset logic (e.g., API call)
    Alert.alert(
      "Success",
      "If an account exists for this email, a password reset link has been sent."
    );
    setEmail("");
  };

  return (
    <View className="flex-1 justify-center px-6">
      <Text className="text-2xl font-manrope-bold text-gray-800 mb-6">
        Forgot Password
      </Text>
      <Text className="text-base font-manrope text-gray-600 mb-6">
        Enter your email address to receive a password reset link.
      </Text>

      <TextInput
        className="bg-white border border-gray-300 rounded-lg h-[3.5rem] px-4 mb-4 text-gray-800 font-[ManropeRegular]"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        className="mt-4 items-center justify-center bg-brand rounded-lg h-[3.5rem] px-4 mb-4"
        onPress={handleResetPassword}
      >
        <Text className="text-white font-[ManropeSemiBold]">
          Send Reset Link
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="h-[3.5rem] mt-1 items-center justify-center border border-brand rounded-lg"
        onPress={() => router.back()}
      >
        <Text className="text-brand text-center font-[ManropeSemiBold]">
          Back to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPassword;

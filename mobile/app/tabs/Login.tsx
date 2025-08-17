import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../../types/type";

export default function Login() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }

    if (!valid) return;

    // simulated credentials
    const dummyEmail = "test@gmail.com";
    const dummyPassword = "password";

    if (email !== dummyEmail || password !== dummyPassword) {
      setGeneralError("Incorrect email or password.");
      return;
    }

    navigation.navigate("RootBottomTabs");
  };

  return (
    <SafeAreaView className="flex-1 justify-center bg-white px-6">
      {/* Header */}
      <View className="mb-10">
        <Text className="text-4xl font-manrope-bold text-brand mb-2">
          Welcome Back
        </Text>
        <Text className="text-base font-manrope-medium text-black mt-1">
          Hi, Welcome back, you’ve been missed
        </Text>
      </View>

      {/* General Error */}
      {generalError !== "" && (
        <Text className="text-red-500 font-manrope-medium mb-4 text-center">
          {generalError}
        </Text>
      )}

      {/* Form */}
      <View>
        {/* Email */}
        <View>
          <Text className="text-base font-medium text-black mb-2 font-manrope-medium">
            Email
          </Text>
          <TextInput
            placeholder="Enter email"
            placeholderTextColor="#747476"
            style={{
              fontFamily: "ManropeRegular",
              fontSize: 15,
            }}
            value={email}
            onChangeText={setEmail}
            onFocus={() => {
              setEmailFocused(true);
              setEmailError("");
            }}
            onBlur={() => setEmailFocused(false)}
            className={`bg-gray-100 rounded-lg px-5 h-[3.5rem] text-base text-black font-manrope border ${
              emailError
                ? "border-red-500"
                : emailFocused
                  ? "border-teal-500"
                  : "border-gray-300"
            }`}
          />
          {emailError !== "" && (
            <Text className="text-red-500 text-sm mt-2 font-manrope-medium">
              {emailError}
            </Text>
          )}
        </View>

        {/* Password */}
        <View className="mt-5">
          <Text className="text-base font-medium mb-2 font-manrope-medium">
            Password
          </Text>
          <View
            className={`flex-row items-center bg-gray-100 rounded-lg px-4 h-[3.5rem] border ${
              passwordError
                ? "border-red-500"
                : passwordFocused
                  ? "border-teal-500"
                  : "border-gray-300"
            }`}
          >
            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#747476"
              style={{
                fontFamily: "ManropeRegular",
                fontSize: 15,
              }}
              value={password}
              onChangeText={setPassword}
              onFocus={() => {
                setPasswordFocused(true);
                setPasswordError("");
              }}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              className="flex-1 text-base text-black"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#000000"
              />
            </Pressable>
          </View>
          {passwordError !== "" && (
            <Text className="text-red-500 text-sm mt-2 font-manrope-medium">
              {passwordError}
            </Text>
          )}
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          className="mt-5 self-end"
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text className="text-base font-manrope-medium text-brand underline">
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        className="bg-brand flex items-center justify-center py-4 rounded-xl mb-3 mt-6"
        onPress={handleLogin}
      >
        <Text className="text-white text-lg font-semibold font-manrope-medium">
          Login
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="my-5" />

      {/* Register Link */}
      <View className="flex-row justify-center">
        <Text className="text-base text-gray-700 font-manrope-medium">
          New to UniClaim?{" "}
        </Text>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text className="text-base font-manrope-medium text-brand font-semibold underline">
            Register here
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

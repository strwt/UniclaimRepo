// Navigation.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import type { RootStackParamList } from "../types/type";

// Screens
import ForgotPassword from "@/app/tabs/ForgotPassword";
import Home from "../app/tabs/Home";
import Index from "../app/tabs/index";
import ItemDetails from "../app/tabs/ItemDetails";
import Login from "../app/tabs/Login";
import Message from "../app/tabs/Message";
import OnBoarding from "../app/tabs/OnBoarding";
import PostDetails from "../app/tabs/PostDetails";
import Profile from "../app/tabs/Profile";
import Register from "../app/tabs/Register";
import Report from "../app/tabs/Report";
import USTPMapScreen from "../app/tabs/USTPMapScreen";

// Components
import RootBottomTabs from "../components/BottomTabs";
import ScreenWrapper from "../components/ScreenWrapper";

const Stack = createNativeStackNavigator<RootStackParamList>();

const withScreenWrapper = (Component: React.ComponentType) => () => (
  <ScreenWrapper statusBarStyle="dark-content" statusBarBg="#fff">
    <Component />
  </ScreenWrapper>
);

interface NavigationProps {
  hasSeenOnBoarding: boolean;
  setHasSeenOnBoarding: React.Dispatch<React.SetStateAction<boolean>>;
  hasPassedIndex: boolean;
  setHasPassedIndex: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Navigation({
  hasSeenOnBoarding,
  setHasSeenOnBoarding,
  hasPassedIndex,
  setHasPassedIndex,
}: NavigationProps) {
  const [images, setImages] = useState<string[]>([]);
  const [showLostInfo, setShowLostInfo] = useState(false);
  const [showFoundInfo, setShowFoundInfo] = useState(false);

  const initial = !hasSeenOnBoarding
    ? "OnBoarding"
    : !hasPassedIndex
      ? "Index"
      : "RootBottomTabs";

  return (
    <Stack.Navigator
      initialRouteName={initial}
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      {/* Entry Screens */}
      <Stack.Screen name="OnBoarding">
        {() => <OnBoarding onFinish={() => setHasSeenOnBoarding(true)} />}
      </Stack.Screen>

      <Stack.Screen name="Index">
        {() => <Index onContinue={() => setHasPassedIndex(true)} />}
      </Stack.Screen>

      {/* Main Screens */}
      <Stack.Screen
        name="RootBottomTabs"
        component={withScreenWrapper(RootBottomTabs)}
      />
      <Stack.Screen name="Login" component={withScreenWrapper(Login)} />
      <Stack.Screen name="Register" component={withScreenWrapper(Register)} />
      <Stack.Screen name="Home" component={withScreenWrapper(Home)} />
      <Stack.Screen name="Report" component={withScreenWrapper(Report)} />
      <Stack.Screen name="Profile" component={withScreenWrapper(Profile)} />
      <Stack.Screen name="Message" component={withScreenWrapper(Message)} />
      <Stack.Screen
        name="ForgotPassword"
        component={withScreenWrapper(ForgotPassword)}
      />
      <Stack.Screen
        name="PostDetails"
        component={withScreenWrapper(PostDetails)}
      />

      {/* ✅ FIXED: Pass props using render function */}
      <Stack.Screen name="ItemDetails">
        {(props) => (
          <ScreenWrapper statusBarStyle="dark-content" statusBarBg="#fff">
            <ItemDetails
              {...props}
              images={images}
              setImages={setImages}
              showLostInfo={showLostInfo}
              showFoundInfo={showFoundInfo}
              setShowLostInfo={setShowLostInfo}
              setShowFoundInfo={setShowFoundInfo}
            />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="USTPMapScreen"
        component={USTPMapScreen}
        options={{ title: "USTP Campus Map", presentation: "modal" }} // optional customization
      />
    </Stack.Navigator>
  );
}

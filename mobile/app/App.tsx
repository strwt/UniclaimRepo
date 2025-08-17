import ScreenWrapper from "@/components/ScreenWrapper";
import Navigation from "@/navigation/Navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { MessageProvider } from "@/context/MessageContext";
import { NavigationContainer } from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useState } from "react";
import SplashScreen from "../components/SplashScreen";

// Separate component to access auth context
const AppContent = ({ 
  isSplashVisible, 
  handleSplashEnd, 
  hasSeenOnBoarding, 
  setHasSeenOnBoarding, 
  hasPassedIndex, 
  setHasPassedIndex 
}: {
  isSplashVisible: boolean;
  handleSplashEnd: () => void;
  hasSeenOnBoarding: boolean;
  setHasSeenOnBoarding: (value: boolean) => void;
  hasPassedIndex: boolean;
  setHasPassedIndex: (value: boolean) => void;
}) => {
  const { user } = useAuth();

  return (
    <MessageProvider userId={user?.uid || null}>
      {isSplashVisible ? (
        <SplashScreen onAnimationEnd={handleSplashEnd} />
      ) : (
        <NavigationContainer>
          <Navigation
            hasSeenOnBoarding={hasSeenOnBoarding}
            setHasSeenOnBoarding={setHasSeenOnBoarding}
            hasPassedIndex={hasPassedIndex}
            setHasPassedIndex={setHasPassedIndex}
          />
        </NavigationContainer>
      )}
    </MessageProvider>
  );
};

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [hasSeenOnBoarding, setHasSeenOnBoarding] = useState(false);
  const [hasPassedIndex, setHasPassedIndex] = useState(false);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync("#000000");
  }, []);

  const handleSplashEnd = () => {
    setIsSplashVisible(false);
    SystemUI.setBackgroundColorAsync("#ffffff");
  };

  return (
    <ScreenWrapper>
      <AuthProvider>
        <AppContent 
          isSplashVisible={isSplashVisible}
          handleSplashEnd={handleSplashEnd}
          hasSeenOnBoarding={hasSeenOnBoarding}
          setHasSeenOnBoarding={setHasSeenOnBoarding}
          hasPassedIndex={hasPassedIndex}
          setHasPassedIndex={setHasPassedIndex}
        />
      </AuthProvider>
    </ScreenWrapper>
  );
}

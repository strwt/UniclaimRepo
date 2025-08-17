import ScreenWrapper from "@/components/ScreenWrapper";
import Navigation from "@/navigation/Navigation";
import { NavigationContainer } from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useState } from "react";
import SplashScreen from "../components/SplashScreen";

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
    </ScreenWrapper>
  );
}

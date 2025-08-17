import React from "react";
import { StatusBar, View } from "react-native";

type ScreenWrapperProps = {
  children: React.ReactNode;
  statusBarStyle?: "light-content" | "dark-content";
  statusBarBg?: string;
};

export default function ScreenWrapper({
  children,
  statusBarStyle = "dark-content",
  statusBarBg = "#FBFDFC",
}: ScreenWrapperProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: statusBarBg,
      }}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
      {children}
    </View>
  );
}

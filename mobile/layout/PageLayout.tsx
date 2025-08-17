import React, { PropsWithChildren } from "react";
import { View } from "react-native";
import Header from "../components/Header";

export default function PageLayout({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 bg-white">
      <Header />
      <View className="mt-1 flex-1 space-y-3">{children}</View>
    </View>
  );
}
